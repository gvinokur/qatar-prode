'use server'

import {Box} from "../../../components/mui-wrappers";
import {findAllPlayersInTournamentWithTeamData} from "../../../db/player-repository";
import {DebugObject} from "../../../components/debug";
import {findTournamentGuessByUserIdTournament} from "../../../db/tournament-guess-repository";
import {getLoggedInUser} from "../../../actions/user-actions";
import {redirect} from "next/navigation";
import {TournamentGuessNew} from "../../../db/tables-definition";
import AwardsPanel from "../../../components/awards/award-panel";
import {
  getPlayoffRounds,
  getTeamsMap,
  getTournamentStartDate
} from "../../../actions/tournament-actions";
import {findTournamentById} from "../../../db/tournament-repository";
import { unstable_ViewTransition as ViewTransition } from "react";

type Props = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{[k:string]:string}>
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
    redirect(`/tournaments/${params.id}`)
  }

  const tournamentGuesses =
    (await findTournamentGuessByUserIdTournament(user.id, params.id)) || buildTournamentGuesses(user.id, params.id)
  const allPlayers = await findAllPlayersInTournamentWithTeamData(params.id)
  const tournamentStartDate = await getTournamentStartDate(params.id)
  const teamsMap = await getTeamsMap(params.id)
  const teams = Object.values(teamsMap).sort((a, b) => a.name.localeCompare(b.name))
  const tournament = await findTournamentById(params.id)

  // Check if tournament has a third place game
  const playoffStages = await getPlayoffRounds(params.id)
  const hasThirdPlaceGame = playoffStages.some(stage => stage.is_third_place)

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
      <ViewTransition
        name={'group-page'}
        enter={'group-enter'}
        exit={'group-exit'}
      >
        {tournament && <AwardsPanel
          allPlayers={allPlayers}
          tournamentGuesses={tournamentGuesses}
          teams={teams}
          hasThirdPlaceGame={hasThirdPlaceGame}
          isPredictionLocked={isPredictionLocked}
          tournament={tournament}
        />}
      </ViewTransition>
    </Box>
  )
}
