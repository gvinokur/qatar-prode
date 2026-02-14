'use server'

import {Grid, AppBar, Box} from "../../components/mui-wrappers";
import GroupSelector from "../../components/groups-page/group-selector";
import {getTournamentAndGroupsData, getTournamentStartDate, getGroupStandingsForTournament, getGroupsForUser} from "../../actions/tournament-actions";
import {findTournamentGuessByUserIdTournament} from "../../db/tournament-guess-repository";
import {getLoggedInUser} from "../../actions/user-actions";
import Link from "next/link";
import EmptyAwardsSnackbar from "../../components/awards/empty-award-notification";
import {getPlayersInTournament} from "../../db/player-repository";
import EnvironmentIndicator from "../../components/environment-indicator";
import {Typography, Avatar} from "@mui/material";
import {getThemeLogoUrl} from "../../utils/theme-utils";
import { isDevelopmentMode } from '../../utils/environment-utils';
import { hasUserPermission } from '../../db/tournament-view-permission-repository';
import { redirect, notFound } from 'next/navigation';
import { DevTournamentBadge } from '../../components/common/dev-tournament-badge';
import TournamentBottomNavWrapper from '../../components/tournament-bottom-nav/tournament-bottom-nav-wrapper';
import ThemeSwitcher from '../../components/header/theme-switcher';
import UserActions from '../../components/header/user-actions';
import TournamentSidebar from '../../components/tournament-page/tournament-sidebar';
import { findTournamentById } from '../../db/tournament-repository';
import { getGameGuessStatisticsForUsers } from '../../db/game-guess-repository';
import type { ScoringConfig } from '../../components/tournament-page/rules';

type TournamentLayoutProps = {
  readonly params: Promise<{
    id: string
  }>
  readonly children: React.ReactNode
}

export default async function TournamentLayout(props: TournamentLayoutProps) {
  const params = await props.params
  const children = props.children
  const user = await getLoggedInUser()
  const layoutData = await getTournamentAndGroupsData(params.id)

  // Check if user has permission to view this dev tournament
  const isDevTournamentInProduction = layoutData.tournament?.dev_only && !isDevelopmentMode()
  if (isDevTournamentInProduction) {
    // Require authentication for dev tournaments in production
    if (!user) {
      redirect(`/?openSignin=true&returnUrl=/tournaments/${params.id}`)
    }

    // Check if user has explicit permission
    const hasPermission = await hasUserPermission(params.id, user.id)
    if (!hasPermission) {
      notFound()
    }
  }

  const tournamentGuesses = user && (await findTournamentGuessByUserIdTournament(user.id, params.id))
  const tournamentStartDate = await getTournamentStartDate(params.id)
  const playersInTournament = await getPlayersInTournament(params.id)

  // Fetch sidebar data
  const tournament = await findTournamentById(params.id)
  const prodeGroups = user ? await getGroupsForUser(user.id, params.id) : undefined
  const groupStandings = await getGroupStandingsForTournament(params.id)
  const userGameStatistics = user ? await getGameGuessStatisticsForUsers([user.id], params.id) : []

  // Extract scoring config
  const scoringConfig: ScoringConfig | undefined = tournament ? {
    game_exact_score_points: tournament.game_exact_score_points ?? 2,
    game_correct_outcome_points: tournament.game_correct_outcome_points ?? 1,
    champion_points: tournament.champion_points ?? 5,
    runner_up_points: tournament.runner_up_points ?? 3,
    third_place_points: tournament.third_place_points ?? 1,
    individual_award_points: tournament.individual_award_points ?? 3,
    qualified_team_points: tournament.qualified_team_points ?? 1,
    exact_position_qualified_points: tournament.exact_position_qualified_points ?? 2,
    max_silver_games: tournament.max_silver_games ?? 0,
    max_golden_games: tournament.max_golden_games ?? 0,
  } : undefined

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

  const logoUrl = getThemeLogoUrl(layoutData.tournament?.theme)

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      // Use dvh (dynamic viewport height) for Safari iOS - adjusts as address bar shows/hides
      // Fallback to vh for older browsers
      height: { xs: '100vh', md: 'calc(100vh - 56px)' },
      '@supports (height: 100dvh)': {
        height: { xs: '100dvh', md: 'calc(100dvh - 56px)' }
      }
    }}>
      <AppBar position={'sticky'} sx={{ top: 0, zIndex: 1100 }}>
        {/* Background color spans full width */}
        <Box sx={{
          backgroundColor: layoutData.tournament?.theme?.primary_color,
          display: 'flex',
          justifyContent: 'center',
          width: '100%'
        }}>
          {/* Content respects max-width */}
          <Box sx={{
            width: '100%',
            maxWidth: '1200px',
            px: 2
          }}>
            <Grid container>
              <Grid size={12} pt={2} pb={1} sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1
              }}>
            {/* La Maquina logo button (home navigation) */}
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Avatar
                variant="rounded"
                src="/logo.webp"
                alt="La Maquina"
                sx={{
                  width: { xs: 32, md: 48 },
                  height: { xs: 32, md: 48 },
                  backgroundColor: 'white',
                  mr: 1
                }}
              />
            </Link>
            <Link
              href={`/tournaments/${layoutData.tournament?.id}`}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  flex: '1 1 auto',
                  minWidth: 0,
                  justifyContent: 'flex-start'
                }}>
                <Box
                  component="img"
                  src={logoUrl || ''}
                  alt={layoutData.tournament?.long_name}
                  sx={{
                    maxHeight: { xs: '32px', md: '48px' },
                    maxWidth: { xs: '32px', md: '48px' },
                    objectFit: 'contain'
                  }}
                />
                {(layoutData.tournament?.short_name || layoutData.tournament?.long_name) && (
                  <Box display="flex" alignItems="center" gap={1}>
                    {layoutData.tournament?.dev_only && (
                      <DevTournamentBadge
                        color={layoutData.tournament.theme?.secondary_color || 'warning.main'}
                      />
                    )}
                    <Typography
                      noWrap
                      variant={'h6'}
                      ml={layoutData.tournament?.dev_only ? 0 : 2}
                      color={layoutData.tournament?.theme?.secondary_color}
                      sx={{
                        display: { xs: 'none', md: 'block' }
                      }}>
                      {layoutData.tournament?.long_name || layoutData.tournament?.short_name}
                    </Typography>
                    <Typography
                      noWrap
                      variant={'h6'}
                      ml={layoutData.tournament?.dev_only ? 0 : 2}
                      color={layoutData.tournament?.theme?.secondary_color}
                      sx={{
                        display: { xs: 'block', md: 'none' }
                      }}>
                      {layoutData.tournament?.short_name || layoutData.tournament?.long_name}
                    </Typography>
                  </Box>
                )}
              </Box>

            </Link>
            {/* User actions container */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0
            }}>
              <ThemeSwitcher />
              <UserActions user={user} />
            </Box>
              </Grid>
              <Grid size={12} pb={{ xs: 1, md: 0.5 }}>
                <GroupSelector
                  tournamentId={params.id}
                  backgroundColor={layoutData.tournament?.theme?.primary_color}
                  textColor={layoutData.tournament?.theme?.secondary_color}
                  groups={layoutData.allGroups
                    .toSorted((a, b) => a.group_letter.localeCompare(b.group_letter))
                  }/>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </AppBar>
      {/* Main content area with centered max-width container */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        minHeight: 0,
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        pb: 2
      }}>
        {/* Centered max-width container */}
        <Box sx={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          gap: 2
        }}>
          <Grid container spacing={2} sx={{ height: '100%', width: '100%' }}>
            {/* Main content - 8/12 on desktop, full on mobile */}
            <Grid size={{ xs: 12, md: 8 }} sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}>
              {children}
            </Grid>

            {/* Sidebar - 4/12 on desktop, hidden on mobile */}
            <TournamentSidebar
              tournamentId={params.id}
              scoringConfig={scoringConfig}
              userGameStatistics={userGameStatistics?.[0]}
              tournamentGuess={tournamentGuesses || undefined}
              groupStandings={groupStandings}
              prodeGroups={prodeGroups}
              user={user || undefined}
            />
          </Grid>
        </Box>
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
      <EnvironmentIndicator isDev={layoutData.tournament?.dev_only || false}/>

      {/* Mobile bottom navigation - only shown on mobile within tournament context */}
      <TournamentBottomNavWrapper tournamentId={params.id} />
    </Box>
  )
 }
