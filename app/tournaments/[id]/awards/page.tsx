'use server'

import {Box, Alert, AlertTitle} from "../../../components/mui-wrappers";
import {findAllPlayersInTournamentWithTeamData} from "../../../db/player-repository";
import {DebugObject} from "../../../components/debug";
import {findTournamentGuessByUserIdTournament} from "../../../db/tournament-guess-repository";
import {getLoggedInUser} from "../../../actions/user-actions";
import {redirect} from "next/navigation";
import {TournamentGuessNew} from "../../../db/tables-definition";
import AwardsPanel from "../../../components/awards/award-panel";
import {getTournamentStartDate} from "../../../actions/tournament-actions";
import {debug} from "node:util";

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

  return (
    <Box pt={2}>
      {searchParams.hasOwnProperty('debug') && (
        <DebugObject object={{
          allPlayers,
          tournamentGuesses,
          tournamentStartDate
        }}/>
      )}
      {allPlayers.length === 0 && (
        <Alert variant={'filled'} severity={'warning'}>
          <AlertTitle>Premios Inviduales no disponibles</AlertTitle>
          Esta seccion estara disponible una vez que se den a conocer las nominas de los equipos participantes en el torneo
        </Alert>
      )}
      {allPlayers.length > 0 && (
        <AwardsPanel allPlayers={allPlayers} tournamentGuesses={tournamentGuesses} tournamentStartDate={tournamentStartDate}/>
      )}

    </Box>
  )
}
