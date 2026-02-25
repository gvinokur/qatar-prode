'use server'

import {Box} from "../../../../components/mui-wrappers";
import {findAllPlayersInTournamentWithTeamData} from "../../../../db/player-repository";
import {DebugObject} from "../../../../components/debug";
import {findTournamentGuessByUserIdTournament} from "../../../../db/tournament-guess-repository";
import {getLoggedInUser} from "../../../../actions/user-actions";
import {redirect} from "next/navigation";
import {TournamentGuessNew} from "../../../../db/tables-definition";
import AwardsPanel from "../../../../components/awards/award-panel";
import {
  getPlayoffRounds,
  getTeamsMap,
  getTournamentStartDate,
  getGamesClosingWithin48Hours
} from "../../../../actions/tournament-actions";
import {findTournamentById} from "../../../../db/tournament-repository";
import { getTournamentGameCounts } from '../../../../db/game-repository';
import { findGameGuessesByUserId } from '../../../../db/game-guess-repository';
import { getTournamentPredictionCompletion } from '../../../../db/tournament-prediction-completion-repository';

type Props = {
  readonly params: Promise<{
    id: string
  }>
  readonly searchParams: Promise<{[k:string]:string}>
}

const buildTournamentGuesses = (userId: string, tournamentId: string) => ({
  user_id: userId,
  tournament_id: tournamentId
} as TournamentGuessNew)

export default async function Awards(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams

  const user = await getLoggedInUser()
  if(!user) {
    redirect(`/es/tournaments/${params.id}`)
  }

  // Fetch all required data in parallel
  const [tournamentGuesses, allPlayers, tournamentStartDate, teamsMap, tournament, playoffStages, closingGames, gameCounts, gameGuessesArray] = await Promise.all([
    findTournamentGuessByUserIdTournament(user.id, params.id).then(result => result || buildTournamentGuesses(user.id, params.id)),
    findAllPlayersInTournamentWithTeamData(params.id),
    getTournamentStartDate(params.id),
    getTeamsMap(params.id),
    findTournamentById(params.id),
    getPlayoffRounds(params.id),
    getGamesClosingWithin48Hours(params.id),
    getTournamentGameCounts(user.id, params.id),
    findGameGuessesByUserId(user.id, params.id)
  ]);

  const teams = Object.values(teamsMap).sort((a, b) => a.name.localeCompare(b.name))

  // Check if tournament has a third place game
  const hasThirdPlaceGame = playoffStages.some(stage => stage.is_third_place)

  // Fetch tournament prediction completion (needs tournament object)
  const tournamentPredictionCompletion = tournament
    ? await getTournamentPredictionCompletion(user.id, params.id, tournament)
    : null

  // Get tournament start time to check if predictions are still allowed
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
  const currentTime = new Date()
  const isPredictionLocked = (currentTime.getTime() - tournamentStartDate.getTime()) >= FIVE_DAYS_MS;

  return (
    <Box pt={2}>
      {searchParams.hasOwnProperty('debug') && (
        <DebugObject object={{
          allPlayers,
          tournamentGuesses,
          tournamentStartDate,
          hasThirdPlaceGame,
          isPredictionLocked,
          tournament
        }}/>
      )}
      {tournament && <AwardsPanel
        allPlayers={allPlayers}
        tournamentGuesses={tournamentGuesses}
        teams={teams}
        hasThirdPlaceGame={hasThirdPlaceGame}
        isPredictionLocked={isPredictionLocked}
        tournament={tournament}
        closingGames={closingGames}
        allGamesCount={gameCounts.total}
        gameGuessesArray={gameGuessesArray}
        tournamentPredictionCompletion={tournamentPredictionCompletion}
        tournamentStartDate={tournamentStartDate}
        teamsMap={teamsMap}
      />}
    </Box>
  )
}
