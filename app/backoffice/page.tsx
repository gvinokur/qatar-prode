'use server'

import {getLoggedInUser} from "../actions/user-actions";
import {redirect} from "next/navigation";
import {Alert, AlertTitle, Box} from "../components/mui-wrappers";
import {
  BackofficeTabs,
} from "../components/backoffice/backoffice-tabs";
import {findAllTournaments} from "../db/tournament-repository";
import tournaments from "../../data/tournaments";
import TournamentsCreate from "../components/backoffice/internal/tournaments-create-components";
import GroupsTab from "../components/backoffice/groups-backoffice-tab";
import TournamentBackofficeTab from "../components/backoffice/tournament-backoffice-tab";
import BackofficeAwardsTab from "../components/backoffice/awards-tab";
import TournamentMainDataTab from "../components/backoffice/tournament-main-data-tab";
import CreateTournamentButton from "../components/backoffice/internal/create-tournament-button";
import {createActionTab, createTab} from "../components/backoffice/backoffice-tab-utils";
import TournamentTeamsManagerTab from "../components/backoffice/tournament-teams-manager-tab";
import TournamentGroupsManagerTab from "../components/backoffice/tournament-groups-manager-tab";
import TournamentGameManagerTab from "../components/backoffice/tournament-game-manager-tab";
import PlayersTab from "../components/backoffice/PlayersTab";
import NotificationSender from "../components/backoffice/notification-sender";



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
        [
          ...activeTournaments.map(tournament =>
            createTab(
              tournament.short_name,
              (
                <BackofficeTabs key={tournament.short_name} tabs={[
                  createTab('Tournament Actions', <TournamentBackofficeTab tournament={tournament}/>),
                  createTab('Game Scores', <GroupsTab tournamentId={tournament.id}/>),
                  createTab('Awards', <BackofficeAwardsTab tournamentId={tournament.id}/>),
                  createTab('Teams', <TournamentTeamsManagerTab tournamentId={tournament.id}/>),
                  createTab('Tournament Data', <TournamentMainDataTab tournamentId={tournament.id}/>),
                  createTab('Tournament Groups', <TournamentGroupsManagerTab tournamentId={tournament.id}/>),
                  createTab('Games', <TournamentGameManagerTab tournamentId={tournament.id}/>),
                  createTab('Players', <PlayersTab tournamentId={tournament.id}/>),
                ]}/>
              ),
              tournament.dev_only
            ),
          ),
          ...inactiveTournaments.map(tournament =>
            createTab(
              tournament.short_name,
              (
                <BackofficeTabs key={tournament.short_name} tabs={[
                  createTab('Tournament Data', <TournamentMainDataTab tournamentId={tournament.id}/>),
                  createTab('Tournament Teams', <TournamentTeamsManagerTab tournamentId={tournament.id}/>),
                  createTab('Tournament Groups', <TournamentGroupsManagerTab tournamentId={tournament.id}/>),
                  createTab('Tournament Games', <TournamentGameManagerTab tournamentId={tournament.id}/>),
                  createTab('Players', <PlayersTab tournamentId={tournament.id}/>),
                ]}/>
              )),
          ),
          createActionTab(<CreateTournamentButton key='create-tournament' />),
          createTab('Notifications', <NotificationSender />)
        ]
      }/>
    </Box>
  )
}
