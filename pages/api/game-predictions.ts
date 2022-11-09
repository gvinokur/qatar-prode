import type { NextApiRequest, NextApiResponse } from 'next'
import {
  createRecord,
  createRecords,
  deleteRecords,
  GameGuess,
  getCurrentUser,
  initThinBackend,
  query,
  getCurrentUserId,
} from 'thin-backend';
import {GameGuess as FeGameGuess} from "../../types/definitions";

var crypto = require('crypto');
global.crypto = crypto;

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<GameGuess[] | any>
) => {
  initThinBackend({ host: process.env.NEXT_PUBLIC_BACKEND_URL });
  const userData = await getCurrentUser();
  if (req.method === 'POST') {
    const gameGuesses: FeGameGuess[] = req.body
    console.log((req.body))
    console.log((gameGuesses))
    console.log(userData)
    try {
      const currentGameGuesses: GameGuess[] =
        await query('game_guesses')
          .where('userId', getCurrentUserId())
          .whereIn('gameId', gameGuesses.map(gameGuess => gameGuess.gameId)).fetch();
      console.log(currentGameGuesses)
      await deleteRecords('game_guesses', currentGameGuesses.map(gameGuess => gameGuess.id))
      console.log('deletion completed')
      await Promise.all(gameGuesses.map(async gameGuess => {
        return await createRecord('game_guesses', {...gameGuess, userId: getCurrentUserId() });
      }))
      res.status(200).send('ok')
    } catch (e) {
      console.log(e)
      res.status(400).send(e)
    }
  } else if (req.method === 'GET') {
    // Handle any other HTTP method
    let gameIds = req.query.ids || [];
    gameIds = typeof gameIds === 'string' ? [gameIds] : gameIds;
    const currentGameGuesses: GameGuess[] =
      await query('game_guesses')
        .where('userId', getCurrentUserId())
        .whereIn('gameId', gameIds.map(idString => Number.parseInt(idString, 10))).fetch();
    res.status(200).send(currentGameGuesses);
  }
}

export default handler;
