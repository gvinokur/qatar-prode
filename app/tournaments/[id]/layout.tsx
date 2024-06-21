'use server'

import {Grid, AppBar, Box} from "../../components/mui-wrappers";
import GroupSelector from "../../components/groups-page/group-selector";
import {getTournamentAndGroupsData, getTournamentStartDate} from "../../actions/tournament-actions";
import {findTournamentGuessByUserIdTournament} from "../../db/tournament-guess-repository";
import {getLoggedInUser} from "../../actions/user-actions";
import Link from "next/link";
import EmptyAwardsSnackbar from "../../components/awards/empty-award-notification";

type TournamentLayoutProps = {
  params: {
    id: string
  }
  searchParams: {[k:string]:string}
  children: React.ReactNode
}

export default async function TournamentLayout({children, params}: TournamentLayoutProps) {
  const user = await getLoggedInUser()
  const layoutData = await getTournamentAndGroupsData(params.id)
  const tournamentGuesses = user && await findTournamentGuessByUserIdTournament(user.id, params.id)
  const tournamentStartDate = await getTournamentStartDate(params.id)

  return (
    <>
      <AppBar position={'sticky'}>
        <Grid container xs={12}>
          <Grid item xs={12} md={3} pt={2} pb={1} pl={2} sx={{
            backgroundColor: layoutData.tournament?.theme?.primary_color,
            textAlign: {
              xs: 'center',
              md: 'left'
            }
          }}>
            <Link href={`/tournaments/${layoutData.tournament.id}`}>
              <img src={layoutData.tournament?.theme?.logo || ''} alt={layoutData.tournament.long_name} style={{
                maxHeight: '48px'
              }}/>
            </Link>
          </Grid>
          <Grid item xs={12} md={9} pt={2} pb={1} pl={1} pr={1} sx={{
            backgroundColor: layoutData.tournament?.theme?.primary_color
          }}>
            <GroupSelector
              tournamentId={params.id}
              groups={layoutData.allGroups
                .sort((a, b) => a.group_letter.localeCompare(b.group_letter))
              }/>
          </Grid>
        </Grid>
      </AppBar>
      <Box ml={2} mr={2} mb={2}>
        {children}
      </Box>
      {user && !tournamentGuesses?.best_player_id && tournamentStartDate.getTime() > new Date().getTime() && (
        <EmptyAwardsSnackbar tournamentId={params.id}/>
      )}
    </>

  )
 }
