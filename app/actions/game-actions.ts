'use server'
import {
  createGame,
  deleteGame,
  findGamesInTournament,
  updateGame
} from "../db/game-repository";
import {Game, GameNew, GameUpdate} from "../db/tables-definition";
import {getLoggedInUser} from "./user-actions";
import {createTournamentGroupGame, deleteTournamentGroupGame} from "../db/tournament-group-repository";
import {createPlayoffRoundGame, deletePlayoffRoundGame} from "../db/tournament-playoff-repository";

/**
 * Creates a new game in a tournament group
 * @param gameData - The game data to create
 * @returns The created game
 */
export async function createGroupGame(gameData: GameNew, groupId: string) {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can manage tournament games');
  }
  const game = await createGame({
    ...gameData,
    game_type: 'group'
  });

  return await createTournamentGroupGame({
    tournament_group_id: groupId,
    game_id: game.id,
    // Add other necessary fields
  });
}

/**
 * Updates an existing game in a tournament group
 * @param gameId - The ID of the game to update
 * @param gameData - The updated game data
 * @returns The updated game
 */
export async function updateGroupGame(gameId: string, gameData: GameUpdate) {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can manage tournament games');
  }

  // Update the game
  // This would need to be implemented in your game repository
  return await updateGame(gameId, gameData);
}

/**
 * Deletes a game from a tournament group
 * @param gameId - The ID of the game to delete
 * @returns A promise that resolves when the deletion is complete
 */
export async function deleteGroupGame(gameId: string) {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can manage tournament games');
  }

  // Delete the game
  // This would need to be implemented in your game repository
  await deleteTournamentGroupGame(gameId);
  await deleteGame(gameId);
}

export async function createOrUpdateGame(gameData: GameNew | GameUpdate, groupId?: string, playoffRoundId?: string) {
  let game: Game | undefined;
  if(gameData.id) {
    console.log('update game', gameData);
    game = await updateGame(gameData.id, gameData);
  } else {
    game = await createGame(gameData as GameNew);
    console.log('create game', gameData);
  }

  if(game) {
    console.log('game', game);
    console.log('groupId', groupId);
    console.log('playoffRoundId', playoffRoundId);
    await deleteTournamentGroupGame(game.id);
    await deletePlayoffRoundGame(game.id);
    if (groupId) {
      await createTournamentGroupGame({
        tournament_group_id: groupId,
        game_id: game.id,
      });
    } else if (playoffRoundId) {
      await createPlayoffRoundGame({
        tournament_playoff_round_id: playoffRoundId,
        game_id: game.id,
      });
    }
  }
}

export async function getGamesInTournament(tournamentId: string) {
  return await findGamesInTournament(tournamentId);
}
