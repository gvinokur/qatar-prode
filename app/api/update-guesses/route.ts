import {NextRequest, NextResponse} from 'next/server';
import {findAllGamesWithPublishedResultsAndGameGuesses} from "../../db/game-repository";
import {calculateScoreForGame} from "../../utils/game-score-calculator";
import {findAllGuessesForGamesWithResultsInDraft, updateGameGuess} from "../../db/game-guess-repository";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const object = searchParams.get('object')
    const forceAll = searchParams.has('forceAll')
    const forceDrafts = searchParams.has('forceDrafts') || forceAll
    const forceAllGuesses = searchParams.has('forceAllGuesses') || forceAll
    if (object === 'groups') {

    } else if (object === 'tournament') {

    } else if (object === 'awards') {

    } else {
        const gamesWithResultAndGuesses = await findAllGamesWithPublishedResultsAndGameGuesses(forceDrafts, forceAllGuesses)
        const gameGuessesToClean = await findAllGuessesForGamesWithResultsInDraft()
        console.log('New games to update:', gamesWithResultAndGuesses.length )
        const updatedGameGuesses = await Promise.all(gamesWithResultAndGuesses.map(game => {
            console.log('updating all score for game', game.game_number, 'with result', game.gameResult)
            const gameGuesses = game.gameGuesses
            return Promise.all(gameGuesses.map(gameGuess => {
                const score = calculateScoreForGame(game, gameGuess)
                console.log('updating score for game guess on game', game.game_number, 'for user', gameGuess.user_id,
                  'with guess', gameGuess, 'to score', score)
                return updateGameGuess(gameGuess.id, {
                    score
                })
            }))
        }))
        console.log('Updated all scores for games')
        console.log('Cleaning scores for games', gameGuessesToClean.length)
        const cleanedGameGuesses = await Promise.all(gameGuessesToClean.map(async (gameGuess) => {
            return updateGameGuess(gameGuess.id, {
                // @ts-ignore - setting to null to remove value
                score: null
            })
        }))

        return NextResponse.json({ ok: true, updatedGameGuesses });
    }
}
