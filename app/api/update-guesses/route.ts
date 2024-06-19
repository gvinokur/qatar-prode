import {NextRequest, NextResponse} from 'next/server';
import {findAllGamesWithPublishedResultsAndGameGuesses} from "../../db/game-repository";
import {calculateScoreForGame} from "../../utils/game-score-calculator";
import {findAllGuessesForGamesWithResultsInDraft, updateGameGuess} from "../../db/game-guess-repository";
import {calculateGameScores} from "../../actions/backoffice-actions";

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
        const result = await calculateGameScores(forceDrafts, forceAllGuesses)

        return NextResponse.json({ ok: true, result });
    }
}
