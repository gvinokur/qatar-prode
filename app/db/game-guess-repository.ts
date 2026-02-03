import {db} from './database'
import {createBaseFunctions} from "./base-repository";
import {GameGuessTable, GameGuess, GameGuessNew} from "./tables-definition";
import {GameStatisticForUser} from "../../types/definitions";
import {cache} from "react";
import {sql, ExpressionBuilder} from 'kysely';

const tableName = 'game_guesses'

const baseFunctions = createBaseFunctions<GameGuessTable, GameGuess>(tableName)

export const findGameGuessById = baseFunctions.findById
export const createGameGuess = baseFunctions.create
export const updateGameGuess = baseFunctions.update
export const deleteGameGuess = baseFunctions.delete

export const findGameGuessesByUserId = cache(async function (userId: string, tournamentId: string) {
  return db.selectFrom(tableName)
    .innerJoin('games', "games.id", 'game_guesses.game_id')
    .where('game_guesses.user_id', '=', userId)
    .where('games.tournament_id', '=', tournamentId)
    .selectAll(tableName)
    .execute()
})

export async function updateGameGuessByGameId(game_id: string, user_id: string, withUpdate: {home_team?: string | null, away_team?:string | null }) {

  return await db
    .updateTable(tableName)
    .set(withUpdate)
    .where("game_guesses.game_id", "=", game_id)
    .where("game_guesses.user_id", "=", user_id)
    .where(eb => eb.or([
      eb("game_guesses.home_team", "<>", withUpdate.home_team),
      eb("game_guesses.away_team", "<>", withUpdate.away_team)
    ]))
    .returningAll()
    .executeTakeFirst()
}

export async function updateOrCreateGuess(guess: GameGuessNew) {

   const existingGuess = await db
     .selectFrom(tableName)
     .selectAll()
     .where("game_guesses.game_id", "=", guess.game_id)
     .where("game_guesses.user_id", "=", guess.user_id)
     .executeTakeFirst()

   if(existingGuess) {
     //Always recreate the guess
     await deleteGameGuess(existingGuess.id)
   }

   return createGameGuess(guess)

}

export async function getGameGuessStatisticsForUsers(userIds: string[], tournamentId: string) {
  const statisticsForUsers = await db.selectFrom('game_guesses')
    .innerJoin('games', 'games.id', 'game_guesses.game_id')
    .where('game_guesses.user_id', 'in', userIds)
    .where('games.tournament_id', '=', tournamentId)
    .select('user_id')
    .select(eb => [
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('game_guesses.score', '>', 0)
            .then(1)
            .else(0)
            .end()
        ),
        'integer'
      ).as('total_correct_guesses'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('game_guesses.score', '>', 1)
            .then(1)
            .else(0)
            .end()
        ),
        'integer'
      ).as('total_exact_guesses'),
      eb.cast<number>(
        eb.fn.sum(eb.cast<number>('game_guesses.score', 'integer'))
        ,'integer'
      ).as('total_score'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('game_guesses.final_score', 'is not', null)
            .then(
              sql<number>`COALESCE(game_guesses.final_score, 0) - COALESCE(game_guesses.score, 0)`
            )
            .else(0)
            .end()
        ),
        'integer'
      ).as('total_boost_bonus'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '<>', 'group')
            .then(0)
            .when('game_guesses.score', '>', 0)
            .then(1)
            .else(0)
            .end()
        ),
        'integer'
      ).as('group_correct_guesses'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '<>', 'group')
            .then(0)
            .when('game_guesses.score', '>', 1)
            .then(1)
            .else(0)
            .end()
        ),
        'integer'
      ).as('group_exact_guesses'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '<>', 'group')
            .then(0)
            .else(eb.cast<number>('game_guesses.score', 'integer'))
            .end()
        ),
        'integer'
      ).as('group_score'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '<>', 'group')
            .then(0)
            .when('game_guesses.final_score', 'is not', null)
            .then(
              sql<number>`COALESCE(game_guesses.final_score, 0) - COALESCE(game_guesses.score, 0)`
            )
            .else(0)
            .end()
        ),
        'integer'
      ).as('group_boost_bonus'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '=', 'group')
            .then(0)
            .when('game_guesses.score', '>', 0)
            .then(1)
            .else(0)
            .end()
        ),
        'integer'
      ).as('playoff_correct_guesses'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '=', 'group')
            .then(0)
            .when('game_guesses.score', '>', 1)
            .then(1)
            .else(0)
            .end()
        ),
        'integer'
      ).as('playoff_exact_guesses'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '=', 'group')
            .then(0)
            .else(eb.cast<number>('game_guesses.score', 'integer'))
            .end()
        ),
        'integer'
      ).as('playoff_score'),
      eb.cast<number>(
        eb.fn.sum(
          eb.case()
            .when('games.game_type', '=', 'group')
            .then(0)
            .when('game_guesses.final_score', 'is not', null)
            .then(
              sql<number>`COALESCE(game_guesses.final_score, 0) - COALESCE(game_guesses.score, 0)`
            )
            .else(0)
            .end()
        ),
        'integer'
      ).as('playoff_boost_bonus'),
    ])
    .groupBy('game_guesses.user_id')
    .execute()

  return statisticsForUsers as GameStatisticForUser[]
}

//--------------------------------------------------------------------------------------
export async function findAllGuessesForGamesWithResultsInDraft() {
  return db.selectFrom('game_guesses')
    .selectAll()
    .where('score', 'is not', null)
    .where((eb) =>
      eb.exists(
        eb.selectFrom('game_results')
          .selectAll()
          .whereRef('game_results.game_id', '=', 'game_guesses.game_id')
          .where('is_draft', '=', true)
      )
    ).execute()
}

export async function deleteAllUserGameGuesses(userId: string) {
  return db.deleteFrom(tableName)
    .where('user_id', '=', userId)
    .execute()
}

export async function deleteAllGameGuessesByTournamentId(tournamentId: string) {
  const gameIds = db.selectFrom('games').select('id').where('tournament_id', '=', tournamentId);
  return db.deleteFrom(tableName).where('game_id', 'in', gameIds).execute();
}

/**
 * Update game guess with calculated score and boost
 */
export async function updateGameGuessWithBoost(
  guessId: string,
  baseScore: number,
  boostType: 'silver' | 'golden' | null
): Promise<GameGuess> {
  const boostMultiplier = boostType === 'golden' ? 3.0 : boostType === 'silver' ? 2.0 : 1.0;
  const finalScore = Math.round(baseScore * boostMultiplier);

  return db
    .updateTable(tableName)
    .set({
      score: baseScore,
      boost_multiplier: boostMultiplier,
      final_score: finalScore,
    })
    .where('id', '=', guessId)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Set boost type for a game guess
 */
export async function setGameGuessBoost(
  userId: string,
  gameId: string,
  boostType: 'silver' | 'golden' | null
): Promise<GameGuess> {
  return db
    .updateTable(tableName)
    .set({ boost_type: boostType })
    .where('user_id', '=', userId)
    .where('game_id', '=', gameId)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Count user's boosts by type for tournament
 */
export async function countUserBoostsByType(
  userId: string,
  tournamentId: string
): Promise<{ silver: number; golden: number }> {
  const result = await db
    .selectFrom(tableName)
    .innerJoin('games', 'games.id', 'game_guesses.game_id')
    .where('game_guesses.user_id', '=', userId)
    .where('games.tournament_id', '=', tournamentId)
    .where('game_guesses.boost_type', 'is not', null)
    .select(['game_guesses.boost_type'])
    .execute();

  return {
    silver: result.filter(r => r.boost_type === 'silver').length,
    golden: result.filter(r => r.boost_type === 'golden').length,
  };
}

/**
 * Get game guess with boost info (for a specific user/game)
 */
export async function getGameGuessWithBoost(
  userId: string,
  gameId: string
): Promise<GameGuess | undefined> {
  return db
    .selectFrom(tableName)
    .where('user_id', '=', userId)
    .where('game_id', '=', gameId)
    .selectAll()
    .executeTakeFirst();
}

/**
 * Get prediction dashboard statistics for user and tournament
 * Returns aggregated counts for total games, predicted games, boost usage, and urgency warnings
 * All in a single optimized query
 */
export async function getPredictionDashboardStats(
  userId: string,
  tournamentId: string
): Promise<{
  totalGames: number;
  predictedGames: number;
  silverUsed: number;
  goldenUsed: number;
}> {
  const stats = await db
    .selectFrom('games')
    .leftJoin('game_guesses', (join) =>
      join
        .onRef('game_guesses.game_id', '=', 'games.id')
        .on('game_guesses.user_id', '=', userId)
    )
    .where('games.tournament_id', '=', tournamentId)
    .select((eb) => [
      // Total games count
      eb.fn.countAll<number>().as('total_games'),

      // Predicted games count (both scores filled)
      eb.fn
        .count<number>('game_guesses.id')
        .filterWhere('game_guesses.home_score', 'is not', null)
        .filterWhere('game_guesses.away_score', 'is not', null)
        .as('predicted_games'),

      // Boost usage counts
      eb.fn
        .count<number>('game_guesses.id')
        .filterWhere('game_guesses.boost_type', '=', 'silver')
        .as('silver_used'),
      eb.fn
        .count<number>('game_guesses.id')
        .filterWhere('game_guesses.boost_type', '=', 'golden')
        .as('golden_used'),
    ])
    .executeTakeFirstOrThrow();

  return {
    totalGames: Number(stats.total_games),
    predictedGames: Number(stats.predicted_games),
    silverUsed: Number(stats.silver_used),
    goldenUsed: Number(stats.golden_used),
  };
}

/**
 * Get boost allocation breakdown by group and playoff stages
 * Returns how boosts are distributed across tournament groups and playoff games
 * Also includes performance metrics (scored games and points earned)
 */
// Helper function to build boost aggregation select expressions
function buildBoostAggregateSelect(eb: ExpressionBuilder<any, any>) {
  return [
    eb.fn.countAll().as('count'),
    eb.fn
      .count('gg.id')
      .filterWhere('gg.final_score', 'is not', null)
      .as('scored_games'),
    eb.cast(
      eb.fn.sum(
        eb.case()
          .when('gg.final_score', 'is not', null)
          .then(
            sql<number>`COALESCE(gg.final_score, 0) - COALESCE(gg.score, 0)`
          )
          .else(0)
          .end()
      ),
      'integer'
    ).as('boost_bonus'),
  ];
}

export async function getBoostAllocationBreakdown(
  userId: string,
  tournamentId: string,
  boostType: 'silver' | 'golden'
): Promise<{
  byGroup: { groupLetter: string; count: number }[];
  playoffCount: number;
  totalBoosts: number;
  scoredGamesCount: number;
  totalPointsEarned: number;
}> {
  // Query 1: Group stage boosts
  const groupBoosts = await db
    .selectFrom('game_guesses as gg')
    .innerJoin('games as g', 'g.id', 'gg.game_id')
    .innerJoin('tournament_group_games as tgg', 'tgg.game_id', 'g.id')
    .innerJoin('tournament_groups as tg', 'tg.id', 'tgg.tournament_group_id')
    .where('gg.user_id', '=', userId)
    .where('g.tournament_id', '=', tournamentId)
    .where('gg.boost_type', '=', boostType)
    .select('tg.group_letter')
    .select(buildBoostAggregateSelect)
    .groupBy('tg.group_letter')
    .orderBy('tg.group_letter')
    .execute();

  // Query 2: Playoff boosts
  const playoffBoosts = await db
    .selectFrom('game_guesses as gg')
    .innerJoin('games as g', 'g.id', 'gg.game_id')
    .innerJoin('tournament_playoff_round_games as prg', 'prg.game_id', 'g.id')
    .where('gg.user_id', '=', userId)
    .where('g.tournament_id', '=', tournamentId)
    .where('gg.boost_type', '=', boostType)
    .select(buildBoostAggregateSelect)
    .executeTakeFirst();

  // Aggregate results
  const byGroup = groupBoosts.map((row) => ({
    groupLetter: row.group_letter,
    count: Number(row.count),
  }));

  const playoffCount = playoffBoosts ? Number(playoffBoosts.count) : 0;

  const totalBoosts = byGroup.reduce((sum, g) => sum + g.count, 0) + playoffCount;

  const scoredGamesCount =
    groupBoosts.reduce((sum, row) => sum + Number(row.scored_games), 0) +
    (playoffBoosts ? Number(playoffBoosts.scored_games) : 0);

  const totalPointsEarned =
    groupBoosts.reduce((sum, row) => sum + Number(row.boost_bonus || 0), 0) +
    (playoffBoosts ? Number(playoffBoosts.boost_bonus || 0) : 0);

  return {
    byGroup,
    playoffCount,
    totalBoosts,
    scoredGamesCount,
    totalPointsEarned,
  };
}
