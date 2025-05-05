'use server'

import {Grid, AppBar, Box} from "../../components/mui-wrappers";
import GroupSelector from "../../components/groups-page/group-selector";
import {getTournamentAndGroupsData, getTournamentStartDate} from "../../actions/tournament-actions";
import {findTournamentGuessByUserIdTournament} from "../../db/tournament-guess-repository";
import {getLoggedInUser} from "../../actions/user-actions";
import Link from "next/link";
import EmptyAwardsSnackbar from "../../components/awards/empty-award-notification";
import {getPlayersInTournament} from "../../db/player-repository";
import EnvironmentIndicator from "../../components/environment-indicator";
import {Typography} from "@mui/material";

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
  const playersInTournament = await getPlayersInTournament(params.id)

  // Calculate 5 days in milliseconds
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

  // Current time
  const currentTime = new Date().getTime();

  // Check if we're within 5 days before the tournament or if the tournament hasn't started yet
  const isWithin5DaysOfTournamentStart =
    (tournamentStartDate.getTime() > currentTime &&
      tournamentStartDate.getTime() - currentTime <= FIVE_DAYS_MS) ||
    (tournamentStartDate.getTime() < currentTime &&
      currentTime - tournamentStartDate.getTime() <= FIVE_DAYS_MS);

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
            <Link
              href={`/tournaments/${layoutData.tournament.id}`}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  alignContent: 'center',
                  height: '100%',
                  margin: {
                    xs: 'auto',
                    md: '0'
                  },
                  width: {
                    xs: 'auto',
                    md: '100%'
                  },
                  justifyContent: {
                    xs: 'center',
                    md: 'flex-start'
                  }
                }}>
                <img src={layoutData.tournament?.theme?.logo || ''} alt={layoutData.tournament.long_name} style={{
                  maxHeight: '48px'
                }}/>
                {(layoutData.tournament?.display_name && layoutData.tournament.long_name) && (
                  <Typography
                    noWrap
                    variant={'h6'}
                    ml={2}
                    color={layoutData.tournament.theme?.secondary_color}>
                    {layoutData.tournament.long_name}
                  </Typography>
                )}
              </Box>

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
      <Box px={2} pb={2}>
        {children}
      </Box>
      {user &&
        (((!tournamentGuesses?.best_player_id ||
          !tournamentGuesses?.best_young_player_id ||
          !tournamentGuesses?.best_goalkeeper_player_id ||
          !tournamentGuesses?.top_goalscorer_player_id
        ) &&
        playersInTournament > 0) ||
          !tournamentGuesses?.champion_team_id ||
          !tournamentGuesses?.runner_up_team_id
        ) &&
        isWithin5DaysOfTournamentStart && (
        <EmptyAwardsSnackbar tournamentId={params.id}/>
      )}
      <EnvironmentIndicator isDev={layoutData.tournament.dev_only || false}/>
    </>

  )
 }
