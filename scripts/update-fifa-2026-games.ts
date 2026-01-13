import { db } from '../app/db/database';
import FIFA_2026_TOURNAMENT from '../data/fifa-2026';

/**
 * Update FIFA 2026 World Cup Games Only
 *
 * This script updates ONLY the games for an existing FIFA 2026 tournament.
 * It will:
 * 1. Find the tournament by name
 * 2. Delete all existing games and their associations
 * 3. Recreate all 104 games with correct data
 *
 * Usage:
 *   npx tsx scripts/update-fifa-2026-games.ts [tournament-id]
 *
 *   If tournament-id is not provided, it will find the FIFA 2026 tournament automatically
 */

interface TeamMap {
  [key: string]: string; // team name -> team id
}

interface GroupMap {
  [key: string]: string; // group letter -> group id
}

interface PlayoffRoundMap {
  [key: string]: string; // playoff stage name -> round id
}

async function updateFifa2026Games() {
  console.log('\n=== FIFA 2026 World Cup Games Update ===\n');

  // Step 1: Find or get tournament ID
  let tournamentId = process.argv[2];

  if (!tournamentId) {
    console.log('No tournament ID provided, searching for FIFA 2026 tournament...');

    const tournament = await db
      .selectFrom('tournaments')
      .where('short_name', '=', 'WC 2026')
      .selectAll()
      .executeTakeFirst();

    if (!tournament) {
      console.error('❌ FIFA 2026 tournament not found!');
      console.error('Please create the tournament first or provide a tournament ID.');
      process.exit(1);
    }

    tournamentId = tournament.id;
    console.log(`✓ Found tournament: ${tournament.long_name} (ID: ${tournamentId})\n`);
  }

  // Step 2: Get team and group mappings
  console.log('Step 1: Loading team and group mappings...');

  const teamMap: TeamMap = {};
  const teams = await db
    .selectFrom('teams')
    .innerJoin('tournament_teams', 'teams.id', 'tournament_teams.team_id')
    .where('tournament_teams.tournament_id', '=', tournamentId)
    .select(['teams.id', 'teams.name'])
    .execute();

  for (const team of teams) {
    teamMap[team.name] = team.id;
  }

  console.log(`✓ Loaded ${teams.length} teams\n`);

  const groupMap: GroupMap = {};
  const groups = await db
    .selectFrom('tournament_groups')
    .where('tournament_id', '=', tournamentId)
    .select(['id', 'group_letter'])
    .execute();

  for (const group of groups) {
    groupMap[group.group_letter] = group.id;
  }

  console.log(`✓ Loaded ${groups.length} groups\n`);

  const playoffRoundMap: PlayoffRoundMap = {};
  const playoffRounds = await db
    .selectFrom('tournament_playoff_rounds')
    .where('tournament_id', '=', tournamentId)
    .select(['id', 'round_name'])
    .execute();

  for (const round of playoffRounds) {
    playoffRoundMap[round.round_name] = round.id;
  }

  console.log(`✓ Loaded ${playoffRounds.length} playoff rounds\n`);

  // Step 3: Delete existing games
  console.log('Step 2: Deleting existing games...');

  const existingGames = await db
    .selectFrom('games')
    .where('tournament_id', '=', tournamentId)
    .select('id')
    .execute();

  if (existingGames.length > 0) {
    // Delete game associations first
    for (const game of existingGames) {
      await db
        .deleteFrom('tournament_group_games')
        .where('game_id', '=', game.id)
        .execute();

      await db
        .deleteFrom('tournament_playoff_round_games')
        .where('game_id', '=', game.id)
        .execute();
    }

    // Delete games
    await db
      .deleteFrom('games')
      .where('tournament_id', '=', tournamentId)
      .execute();

    console.log(`✓ Deleted ${existingGames.length} existing games\n`);
  } else {
    console.log('✓ No existing games to delete\n');
  }

  // Step 4: Create new games
  console.log('Step 3: Creating new games from updated data...');

  const gameMap: { [key: number]: string } = {};

  for (const gameData of FIFA_2026_TOURNAMENT.games) {
    // Get team IDs (may be null for playoff games)
    const homeTeamId = gameData.home_team ? teamMap[gameData.home_team] : null;
    const awayTeamId = gameData.away_team ? teamMap[gameData.away_team] : null;

    const result = await db
      .insertInto('games')
      .values({
        game_number: gameData.game_number,
        tournament_id: tournamentId,
        game_date: gameData.date,
        location: gameData.location,
        game_local_timezone: gameData.timezone || null,
        home_team: homeTeamId,
        away_team: awayTeamId,
        home_team_rule: gameData.home_team_rule ? gameData.home_team_rule as any : null,
        away_team_rule: gameData.away_team_rule ? gameData.away_team_rule as any : null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    gameMap[gameData.game_number] = result.id;
  }

  console.log(`✓ Created ${FIFA_2026_TOURNAMENT.games.length} games\n`);

  // Step 5: Link games to groups and playoff rounds
  console.log('Step 4: Linking games to groups and playoff rounds...');

  let groupGameCount = 0;
  let playoffGameCount = 0;

  for (const gameData of FIFA_2026_TOURNAMENT.games) {
    const gameId = gameMap[gameData.game_number];

    // Link group stage games
    if (gameData.group) {
      const groupId = groupMap[gameData.group];

      await db
        .insertInto('tournament_group_games')
        .values({
          tournament_group_id: groupId,
          game_id: gameId,
        })
        .execute();

      groupGameCount++;
    }

    // Link playoff games
    if (gameData.playoff) {
      const playoffRoundId = playoffRoundMap[gameData.playoff];

      await db
        .insertInto('tournament_playoff_round_games')
        .values({
          tournament_playoff_round_id: playoffRoundId,
          game_id: gameId,
        })
        .execute();

      playoffGameCount++;
    }
  }

  console.log(`✓ ${groupGameCount} group games linked`);
  console.log(`✓ ${playoffGameCount} playoff games linked\n`);

  // Summary
  console.log('=== Update Complete ===\n');
  console.log('Summary:');
  console.log(`  Tournament ID: ${tournamentId}`);
  console.log(`  Total Games: ${FIFA_2026_TOURNAMENT.games.length}`);
  console.log(`  Group Games: ${groupGameCount}`);
  console.log(`  Playoff Games: ${playoffGameCount}`);
  console.log('\n✓ All games updated successfully!\n');
}

// Execute the update
updateFifa2026Games()
  .then(() => {
    console.log('✓ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });
