import { db } from '../app/db/database';
import FIFA_2026_TOURNAMENT from '../data/fifa-2026';
import { FIFA_2026_THIRD_PLACE_RULES } from '../data/fifa-2026/third-place-rules';
import { upsertThirdPlaceRule } from '../app/db/tournament-third-place-rules-repository';
import { randomUUID } from 'crypto';

/**
 * FIFA 2026 World Cup Tournament Import Script
 *
 * This script creates a complete FIFA 2026 World Cup tournament in the database with:
 * - 1 tournament record (dev_only=true, is_active=false)
 * - 48 teams across 12 groups (A-L)
 * - 104 games (48 group stage + 56 playoff)
 * - 6 playoff rounds
 * - 495 third-place assignment rules
 *
 * Usage: npx ts-node scripts/import-fifa-2026-tournament.ts
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

interface GameMap {
  [key: number]: string; // game number -> game id
}

async function importFifa2026Tournament() {
  console.log('\n=== FIFA 2026 World Cup Tournament Import ===\n');

  // Generate tournament ID
  const tournamentId = randomUUID();
  console.log(`Tournament ID: ${tournamentId}\n`);

  // ==================== STEP 1: Create Tournament Record ====================
  console.log('Step 1: Creating tournament record...');

  await db
    .insertInto('tournaments')
    .values({
      id: tournamentId,
      short_name: FIFA_2026_TOURNAMENT.tournament_short_name,
      long_name: FIFA_2026_TOURNAMENT.tournament_name,
      is_active: false,
      dev_only: true,
      theme: FIFA_2026_TOURNAMENT.tournament_theme as any,
    })
    .execute();

  console.log('✓ Tournament record created\n');

  // ==================== STEP 2: Create/Link Teams ====================
  console.log('Step 2: Creating and linking teams...');

  const teamMap: TeamMap = {};

  for (const teamData of FIFA_2026_TOURNAMENT.teams) {
    // Check if team already exists
    let existingTeam = await db
      .selectFrom('teams')
      .where('short_name', '=', teamData.short_name)
      .selectAll()
      .executeTakeFirst();

    let teamId: string;

    if (!existingTeam) {
      // Create new team
      const newTeam = await db
        .insertInto('teams')
        .values({
          id: randomUUID(),
          name: teamData.name,
          short_name: teamData.short_name,
          theme: {
            primary_color: teamData.primary_color,
            secondary_color: teamData.secondary_color,
          } as any,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      teamId = newTeam.id;
    } else {
      teamId = existingTeam.id;
    }

    // Store team ID in map
    teamMap[teamData.name] = teamId;

    // Create tournament_teams association
    await db
      .insertInto('tournament_teams')
      .values({
        tournament_id: tournamentId,
        team_id: teamId,
      })
      .execute();
  }

  console.log(`✓ ${FIFA_2026_TOURNAMENT.teams.length} teams created/linked\n`);

  // ==================== STEP 3: Create Groups ====================
  console.log('Step 3: Creating tournament groups...');

  const groupMap: GroupMap = {};

  for (const groupData of FIFA_2026_TOURNAMENT.groups) {
    const groupId = randomUUID();

    await db
      .insertInto('tournament_groups')
      .values({
        id: groupId,
        tournament_id: tournamentId,
        group_letter: groupData.letter,
        sort_by_games_between_teams: false, // FIFA uses standard tiebreakers
      })
      .execute();

    groupMap[groupData.letter] = groupId;
  }

  console.log(`✓ ${FIFA_2026_TOURNAMENT.groups.length} groups created\n`);

  // ==================== STEP 4: Create Group Teams ====================
  console.log('Step 4: Creating group team records...');

  let groupTeamCount = 0;

  for (const groupData of FIFA_2026_TOURNAMENT.groups) {
    const groupId = groupMap[groupData.letter];

    for (let position = 0; position < groupData.teams.length; position++) {
      const teamName = groupData.teams[position];
      const teamId = teamMap[teamName];

      await db
        .insertInto('tournament_group_teams')
        .values({
          id: randomUUID(),
          tournament_group_id: groupId,
          team_id: teamId,
          position: position,
          // Initialize all stats to 0
          games_played: 0,
          points: 0,
          win: 0,
          draw: 0,
          loss: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          conduct_score: 0,
          is_complete: false,
        })
        .execute();

      groupTeamCount++;
    }
  }

  console.log(`✓ ${groupTeamCount} group team records created\n`);

  // ==================== STEP 5: Create Playoff Rounds ====================
  console.log('Step 5: Creating playoff rounds...');

  const playoffRoundMap: PlayoffRoundMap = {};

  for (const playoffData of FIFA_2026_TOURNAMENT.playoffs) {
    const roundId = randomUUID();

    await db
      .insertInto('tournament_playoff_rounds')
      .values({
        id: roundId,
        tournament_id: tournamentId,
        round_name: playoffData.stage,
        round_order: playoffData.order,
        total_games: playoffData.games,
        is_final: playoffData.is_final || false,
        is_third_place: playoffData.is_third_place || false,
        is_first_stage: playoffData.stage === 'Round of 32',
      })
      .execute();

    playoffRoundMap[playoffData.stage] = roundId;
  }

  console.log(`✓ ${FIFA_2026_TOURNAMENT.playoffs.length} playoff rounds created\n`);

  // ==================== STEP 6: Create Games ====================
  console.log('Step 6: Creating games...');

  const gameMap: GameMap = {};

  for (const gameData of FIFA_2026_TOURNAMENT.games) {
    const gameId = randomUUID();

    // Get team IDs (may be null for playoff games with unknown teams)
    const homeTeamId = gameData.home_team ? teamMap[gameData.home_team] : null;
    const awayTeamId = gameData.away_team ? teamMap[gameData.away_team] : null;

    await db
      .insertInto('games')
      .values({
        id: gameId,
        game_number: gameData.game_number,
        tournament_id: tournamentId,
        game_date: gameData.date,
        location: gameData.location,
        home_team: homeTeamId,
        away_team: awayTeamId,
        home_team_rule: gameData.home_team_rule ? gameData.home_team_rule as any : null,
        away_team_rule: gameData.away_team_rule ? gameData.away_team_rule as any : null,
      })
      .execute();

    gameMap[gameData.game_number] = gameId;
  }

  console.log(`✓ ${FIFA_2026_TOURNAMENT.games.length} games created\n`);

  // ==================== STEP 7: Link Games to Groups/Playoff Rounds ====================
  console.log('Step 7: Linking games to groups and playoff rounds...');

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

  // ==================== STEP 8: Import Third-Place Rules ====================
  console.log('Step 8: Importing third-place assignment rules...');
  console.log(`Found ${FIFA_2026_THIRD_PLACE_RULES.length} rules to import`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < FIFA_2026_THIRD_PLACE_RULES.length; i++) {
    const rule = FIFA_2026_THIRD_PLACE_RULES[i];

    try {
      await upsertThirdPlaceRule(
        tournamentId,
        rule.combination,
        rule.matchups
      );
      successCount++;

      if ((i + 1) % 100 === 0) {
        console.log(`  Progress: ${i + 1}/${FIFA_2026_THIRD_PLACE_RULES.length} rules imported`);
      }
    } catch (error) {
      console.error(`  Error importing rule ${rule.combination}:`, error);
      errorCount++;
    }
  }

  console.log(`✓ ${successCount} third-place rules imported`);
  if (errorCount > 0) {
    console.log(`⚠ ${errorCount} errors occurred`);
  }

  // ==================== SUMMARY ====================
  console.log('\n=== Import Complete ===\n');
  console.log('Tournament Summary:');
  console.log(`  ID: ${tournamentId}`);
  console.log(`  Name: ${FIFA_2026_TOURNAMENT.tournament_name}`);
  console.log(`  Short Name: ${FIFA_2026_TOURNAMENT.tournament_short_name}`);
  console.log(`  Teams: ${FIFA_2026_TOURNAMENT.teams.length}`);
  console.log(`  Groups: ${FIFA_2026_TOURNAMENT.groups.length}`);
  console.log(`  Playoff Rounds: ${FIFA_2026_TOURNAMENT.playoffs.length}`);
  console.log(`  Total Games: ${FIFA_2026_TOURNAMENT.games.length}`);
  console.log(`  Group Games: ${groupGameCount}`);
  console.log(`  Playoff Games: ${playoffGameCount}`);
  console.log(`  Third-Place Rules: ${successCount}`);
  console.log(`  Status: dev_only=true, is_active=false`);
  console.log('\nNext Steps:');
  console.log('  1. Add tournament logo via admin console (S3)');
  console.log('  2. Set is_active=true when ready to activate');
  console.log('  3. Verify data loaded correctly');
  console.log('');
}

// Execute the import
importFifa2026Tournament()
  .then(() => {
    console.log('✓ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
