'use server'

import { sendNotification } from "./notifiaction-actions";
import { getLocalGameTime } from "../utils/date-utils";
import { findGamesInNext24Hours } from "../db/game-repository";

export async function sendGamesTomorrowNotification(tournamentId: string) {
  const games = await findGamesInNext24Hours(tournamentId);
  
  if (games.length === 0) {
    return { success: true, message: 'No hay partidos en las próximas 24 horas' };
  }

  const gameList = games.map(game => {
    const timeStr = getLocalGameTime(game.game_date, game.game_local_timezone);
    const teams = game.home_team && game.away_team 
      ? `${game.home_team} vs ${game.away_team}`
      : 'Equipos por definir';
    return `${teams} a las ${timeStr}`;
  }).join('\n');

  const title = `Partidos de Mañana (${games.length})`;
  const message = `Estos son los partidos programados para mañana:\n${gameList}`;
  const url = process.env.NEXT_PUBLIC_APP_URL + `/tournaments/${tournamentId}`;

  return await sendNotification(
    title,
    message,
    url,
    null, // userId
    true  // sendToAllUsers
  );
}

/**
 * Notifica a todos los usuarios con suscripción push cuando un partido ha finalizado.
 * @param game El partido finalizado, incluyendo el resultado.
 */
export async function notifyGameFinished(game: {
  id: string;
  game_number: number;
  home_team?: string;
  away_team?: string;
  home_score?: number;
  away_score?: number;
  home_penalty_score?: number;
  away_penalty_score?: number;
  game_date: Date;
  location?: string;
  game_local_timezone?: string;
  group_id?: string;
  tournament_id: string;
}) {
  const home = game.home_team || 'Equipo por definir';
  const away = game.away_team || 'Equipo por definir';
  const homeScore = typeof game.home_score === 'number' ? game.home_score : '-';
  const awayScore = typeof game.away_score === 'number' ? game.away_score : '-';
  const location = game.location ? ` en ${game.location}` : '';
  const date = new Date(game.game_date).toLocaleString('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: game.game_local_timezone || 'America/Argentina/Buenos_Aires',
  });

  // Determine winner
  let resultado = `${home} ${homeScore} - ${awayScore} ${away}`;
  let winnerText = '';
  if (typeof game.home_score === 'number' && typeof game.away_score === 'number') {
    if (game.home_score > game.away_score) {
      winnerText = `Ganó ${home}.`;
    } else if (game.away_score > game.home_score) {
      winnerText = `Ganó ${away}.`;
    } else {
      // Tie, check penalties
      if (
        typeof game.home_penalty_score === 'number' &&
        typeof game.away_penalty_score === 'number' &&
        (game.home_penalty_score !== game.away_penalty_score)
      ) {
        resultado += ` (Penales: ${home} ${game.home_penalty_score} - ${game.away_penalty_score} ${away})`;
        if (game.home_penalty_score > game.away_penalty_score) {
          winnerText = `Ganó ${home} por penales.`;
        } else {
          winnerText = `Ganó ${away} por penales.`;
        }
      } else {
        winnerText = 'Empate.';
      }
    }
  }

  const title = `Finalizó el partido #${game.game_number}`;
  const message = `El partido entre ${home} y ${away} ha finalizado.\n\nResultado: ${resultado}\n${winnerText}\nFecha: ${date}\n\n¡Revisa tus predicciones y posiciones en la tabla!`;
  let url = '';
  if (game.group_id) {
    url = `${process.env.NEXT_PUBLIC_APP_URL}/tournaments/${game.tournament_id}/groups/${game.group_id}`;
  } else {
    url = `${process.env.NEXT_PUBLIC_APP_URL}/tournaments/${game.tournament_id}/playoffs`;
  }

  return await sendNotification(
    title,
    message,
    url,
    null,
    true
  );
} 