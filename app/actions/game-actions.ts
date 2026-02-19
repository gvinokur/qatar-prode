'use server'
import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';
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
 * @param groupId - The tournament group ID
 * @param locale - The locale for error messages
 * @returns The created game
 */
export async function createGroupGame(gameData: GameNew, groupId: string, locale: Locale = 'es') {
  try {
    const t = await getTranslations({ locale, namespace: 'games' });
    // Check if user is admin
    const user = await getLoggedInUser();
    if (!user?.isAdmin) {
      return { success: false, error: t('unauthorized') };
    }
    const game = await createGame({
      ...gameData,
      game_type: 'group'
    });

    const result = await createTournamentGroupGame({
      tournament_group_id: groupId,
      game_id: game.id,
      // Add other necessary fields
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating group game:', error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
}

/**
 * Updates an existing game in a tournament group
 * @param gameId - The ID of the game to update
 * @param gameData - The updated game data
 * @param locale - The locale for error messages
 * @returns The updated game
 */
export async function updateGroupGame(gameId: string, gameData: GameUpdate, locale: Locale = 'es') {
  try {
    const t = await getTranslations({ locale, namespace: 'games' });
    // Check if user is admin
    const user = await getLoggedInUser();
    if (!user?.isAdmin) {
      return { success: false, error: t('unauthorized') };
    }

    // Update the game
    const result = await updateGame(gameId, gameData);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating group game:', error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
}

/**
 * Deletes a game from a tournament group
 * @param gameId - The ID of the game to delete
 * @param locale - The locale for error messages
 * @returns A promise that resolves when the deletion is complete
 */
export async function deleteGroupGame(gameId: string, locale: Locale = 'es') {
  try {
    const t = await getTranslations({ locale, namespace: 'games' });
    // Check if user is admin
    const user = await getLoggedInUser();
    if (!user?.isAdmin) {
      return { success: false, error: t('unauthorized') };
    }

    // Delete the game
    await deleteTournamentGroupGame(gameId);
    await deleteGame(gameId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting group game:', error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
}

export async function createOrUpdateGame(gameData: GameNew | GameUpdate, groupId?: string, playoffRoundId?: string) {
  let game: Game | undefined;
  if(gameData.id) {
    game = await updateGame(gameData.id, gameData);
  } else {
    game = await createGame(gameData as GameNew);
    }

  if(game) {
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
