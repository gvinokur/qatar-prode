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