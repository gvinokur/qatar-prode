'use server'

import {Box, Alert, AlertTitle} from "../../../components/mui-wrappers";
import {findAllPlayersInTournamentWithTeamData} from "../../../db/player-repository";
import {DebugObject} from "../../../components/debug";
import {findTournamentGuessByUserIdTournament, updateTournamentGuess} from "../../../db/tournament-guess-repository";
import {getLoggedInUser} from "../../../actions/user-actions";
import {redirect} from "next/navigation";
import {TournamentGuessNew} from "../../../db/tables-definition";
import AwardsPanel from "../../../components/awards/award-panel";
import {
  getPlayoffRounds,
  getTeamsMap,
  getTournamentStartDate
} from "../../../actions/tournament-actions";


type Props = {
  params: {
    id: string
  }
  searchParams: {[k:string]:string}
}

const buildTournamentGuesses = (userId: string, tournamentId: string) => ({
  user_id: userId,
  tournament_id: tournamentId
} as TournamentGuessNew)

export default async function Awards({ params, searchParams}: Props) {
  const user = await getLoggedInUser()
  if(!user) {
    redirect(`/tournaments/${params.id}`)
  }

  const tournamentGuesses =
    await findTournamentGuessByUserIdTournament(user.id, params.id) || buildTournamentGuesses(user.id, params.id)
  const allPlayers = await findAllPlayersInTournamentWithTeamData(params.id)
  const tournamentStartDate = await getTournamentStartDate(params.id)
  const teamsMap = await getTeamsMap(params.id)
  const teams = Object.values(teamsMap).sort((a, b) => a.name.localeCompare(b.name))

  // Check if tournament has a third place game
  const playoffStages = await getPlayoffRounds(params.id)
  const hasThirdPlaceGame = playoffStages.some(stage => stage.is_third_place)

  // Get tournament start time to check if predictions are still allowed
  const currentTime = new Date()
  const isPredictionLocked = currentTime > tournamentStartDate

  return (
    <Box pt={2}>
      {searchParams.hasOwnProperty('debug') && (
        <DebugObject object={{
          allPlayers,
          tournamentGuesses,
          tournamentStartDate,
          hasThirdPlaceGame,
          isPredictionLocked
        }}/>
      )}

      <AwardsPanel
        allPlayers={allPlayers}
        tournamentGuesses={tournamentGuesses}
        teams={teams}
        hasThirdPlaceGame={hasThirdPlaceGame}
        isPredictionLocked={isPredictionLocked}
      />
    </Box>
  )
}
