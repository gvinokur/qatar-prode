'use server'

import {getLoggedInUser} from "../actions/user-actions";
import {redirect} from "next/navigation";
import {Alert, AlertTitle, Box} from "../components/mui-wrappers";
import BackofficeTabs from "../components/backoffice/backoffice-tabs";
import {findAllTournaments} from "../db/tournament-repository";
import tournaments from "../../data/tournaments";
import {DebugObject} from "../components/debug";
import TournamentsCreate from "../components/backoffice/tournaments-create-components";
import GroupsTab from "../components/backoffice/groups-backoffice-tab";
import TournamentBackofficeTab from "../components/backoffice/tournament-backoffice-tab";
import BackofficeAwardsTab from "../components/backoffice/awards-tab";

export default async function Backoffice() {
  const user = await  getLoggedInUser()
  if(!user?.isAdmin) {
    redirect('/')
  }

  const dbTournaments = await findAllTournaments()
  const activeTournaments = dbTournaments.filter(({is_active}) => is_active)
  const inactiveTournaments = dbTournaments.filter(({is_active}) => !is_active)
  const newAvailableTournaments = tournaments
    .filter(({tournament_name}) =>
      (!dbTournaments.find(({long_name}) => (long_name === tournament_name))))

  return (
    <Box p={2} sx={{ width: '100%'}}>
      <Alert variant={'filled'} severity={"warning"}>
        <AlertTitle>Consola de administracion</AlertTitle>
        Estas en la consola de administracion, cualquie accion que tomes puede afectar la usabilidad general de la pagina.
      </Alert>
      {newAvailableTournaments.length > 1 && (
        <TournamentsCreate tournaments={newAvailableTournaments}/>
      )}
      <BackofficeTabs tabs={
        activeTournaments.map(tournament => ({
          label: tournament.short_name,
          component: (
            <BackofficeTabs key={tournament.short_name} tabs={[
              {
                label: 'Tournament Management',
                component: (
                  <TournamentBackofficeTab tournament={tournament}/>
                )
              },
              {
                label: 'Tournament Game Management',
                component: (
                  <GroupsTab tournamentId={tournament.id}/>
                )
              },
              {
                label: 'Overall Awards Management',
                component: (
                  <BackofficeAwardsTab tournamentId={tournament.id}/>
                )
              }
            ]}/>
          )
        }))
      }/>

    </Box>
  )
}
