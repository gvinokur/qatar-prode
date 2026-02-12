#!/usr/bin/env tsx

/**
 * Debug script to analyze playoff game dependencies
 * Usage: tsx scripts/debug-playoff-dependencies.ts <tournament_id> [game_number]
 */

import { db } from '../app/db'
import { sql } from 'kysely'

async function debugPlayoffDependencies(tournamentId: string, gameNumber?: number) {
  console.log(`\n=== Playoff Dependencies Debug for Tournament: ${tournamentId} ===\n`)

  // Get all playoff games with their team rules
  const games = await db
    .selectFrom('game')
    .leftJoin('game_result', 'game.id', 'game_result.game_id')
    .leftJoin('playoff_round', 'game.playoff_round_id', 'playoff_round.id')
    .select([
      'game.id',
      'game.game_number',
      'game.home_team',
      'game.away_team',
      'game.home_team_rule',
      'game.away_team_rule',
      'playoff_round.round_name',
      'playoff_round.round_order',
      'game_result.home_score',
      'game_result.away_score',
      'game_result.home_penalty_score',
      'game_result.away_penalty_score',
      'game_result.is_draft'
    ])
    .where('game.tournament_id', '=', tournamentId)
    .where('game.playoff_round_id', 'is not', null)
    .orderBy('playoff_round.round_order', 'asc')
    .orderBy('game.game_number', 'asc')
    .execute()

  if (games.length === 0) {
    console.log('No playoff games found for this tournament.')
    return
  }

  console.log(`Found ${games.length} playoff games\n`)

  // Build a map of game_number -> game for quick lookup
  const gamesByNumber = new Map(games.map(g => [g.game_number, g]))

  // If specific game number provided, focus on that
  if (gameNumber !== undefined) {
    const game = games.find(g => g.game_number === gameNumber)
    if (!game) {
      console.log(`Game #${gameNumber} not found`)
      return
    }

    console.log(`\n=== Game #${gameNumber} (${game.round_name}) ===`)
    console.log(`ID: ${game.id}`)
    console.log(`Home Team: ${game.home_team || 'TBD'}`)
    console.log(`Away Team: ${game.away_team || 'TBD'}`)
    console.log(`Score: ${game.home_score ?? '-'} - ${game.away_score ?? '-'}`)
    if (game.home_penalty_score !== null || game.away_penalty_score !== null) {
      console.log(`Penalties: ${game.home_penalty_score} - ${game.away_penalty_score}`)
    }
    console.log(`Is Draft: ${game.is_draft ?? 'N/A'}`)
    console.log(`Has Result: ${game.home_score !== null && game.away_score !== null}`)

    // Find games that depend on this game
    const dependentGames = games.filter(g => {
      const homeRule = g.home_team_rule as any
      const awayRule = g.away_team_rule as any
      return (
        (homeRule?.game === gameNumber) ||
        (awayRule?.game === gameNumber)
      )
    })

    if (dependentGames.length > 0) {
      console.log(`\n--- Games that depend on Game #${gameNumber} ---`)
      dependentGames.forEach(dg => {
        const homeRule = dg.home_team_rule as any
        const awayRule = dg.away_team_rule as any
        console.log(`\nGame #${dg.game_number} (${dg.round_name}):`)
        if (homeRule?.game === gameNumber) {
          console.log(`  Home Team Rule: Winner=${homeRule.winner} from Game #${gameNumber}`)
          console.log(`  Home Team Actual: ${dg.home_team || 'NOT SET ❌'}`)
        }
        if (awayRule?.game === gameNumber) {
          console.log(`  Away Team Rule: Winner=${awayRule.winner} from Game #${gameNumber}`)
          console.log(`  Away Team Actual: ${dg.away_team || 'NOT SET ❌'}`)
        }
      })
    } else {
      console.log(`\nNo games depend on Game #${gameNumber}`)
    }
  } else {
    // Show all games with their dependencies
    console.log('=== All Playoff Games ===\n')

    games.forEach(game => {
      const homeRule = game.home_team_rule as any
      const awayRule = game.away_team_rule as any

      console.log(`Game #${game.game_number} (${game.round_name}):`)
      console.log(`  ID: ${game.id}`)
      console.log(`  Score: ${game.home_score ?? '-'} - ${game.away_score ?? '-'} ${game.is_draft ? '(DRAFT)' : ''}`)

      if (homeRule?.game !== undefined) {
        const depGame = gamesByNumber.get(homeRule.game)
        console.log(`  Home Team Rule: ${homeRule.winner ? 'Winner' : 'Loser'} of Game #${homeRule.game}`)
        console.log(`    -> Actual: ${game.home_team || 'NOT SET ❌'}`)
        if (depGame) {
          const hasResult = depGame.home_score !== null && depGame.away_score !== null
          console.log(`    -> Dependency Game has result: ${hasResult ? '✅' : '❌'}`)
        }
      } else {
        console.log(`  Home Team: ${game.home_team || 'TBD'}`)
      }

      if (awayRule?.game !== undefined) {
        const depGame = gamesByNumber.get(awayRule.game)
        console.log(`  Away Team Rule: ${awayRule.winner ? 'Winner' : 'Loser'} of Game #${awayRule.game}`)
        console.log(`    -> Actual: ${game.away_team || 'NOT SET ❌'}`)
        if (depGame) {
          const hasResult = depGame.home_score !== null && depGame.away_score !== null
          console.log(`    -> Dependency Game has result: ${hasResult ? '✅' : '❌'}`)
        }
      } else {
        console.log(`  Away Team: ${game.away_team || 'TBD'}`)
      }

      console.log('')
    })
  }

  console.log('\n=== Dependency Chain Analysis ===\n')

  // Find games with complete results
  const gamesWithResults = games.filter(g =>
    g.home_score !== null && g.away_score !== null && !g.is_draft
  )

  console.log(`Games with complete results: ${gamesWithResults.length}`)

  // Check if their dependent games are updated
  gamesWithResults.forEach(game => {
    const dependentGames = games.filter(g => {
      const homeRule = g.home_team_rule as any
      const awayRule = g.away_team_rule as any
      return (
        (homeRule?.game === game.game_number) ||
        (awayRule?.game === game.game_number)
      )
    })

    if (dependentGames.length > 0) {
      console.log(`\nGame #${game.game_number} has result → Should update ${dependentGames.length} game(s):`)
      dependentGames.forEach(dg => {
        const homeRule = dg.home_team_rule as any
        const awayRule = dg.away_team_rule as any
        let isUpdated = true

        if (homeRule?.game === game.game_number && !dg.home_team) {
          isUpdated = false
        }
        if (awayRule?.game === game.game_number && !dg.away_team) {
          isUpdated = false
        }

        console.log(`  - Game #${dg.game_number}: ${isUpdated ? '✅ Updated' : '❌ NOT Updated'}`)
      })
    }
  })

  await db.destroy()
}

// Main execution
const tournamentId = process.argv[2]
const gameNumber = process.argv[3] ? parseInt(process.argv[3]) : undefined

if (!tournamentId) {
  console.error('Usage: tsx scripts/debug-playoff-dependencies.ts <tournament_id> [game_number]')
  process.exit(1)
}

debugPlayoffDependencies(tournamentId, gameNumber).catch(console.error)
