'use server'

import type { Metadata } from 'next'
import {Grid, AppBar, Box} from "../../../components/mui-wrappers";
import GroupSelector from "../../../components/groups-page/group-selector";
import {getTournamentAndGroupsData, getTournamentStartDate, getGroupStandingsForTournament, getTournaments} from "../../../actions/tournament-actions";
import TournamentSwitcher from "../../../components/tournament/tournament-switcher";
import NewTournamentSnackbar from "../../../components/tournament/new-tournament-snackbar";
import {getGroupsForUser} from "../../../actions/prode-group-actions";
import {findTournamentGuessByUserIdTournament} from "../../../db/tournament-guess-repository";
import {getLoggedInUser} from "../../../actions/user-actions";
import {findUserById} from "../../../db/users-repository";
import VerificationBanner from "../../../components/verification/verification-banner";
import {VerificationOverlay} from "../../../components/verification/verification-overlay";
import Link from "next/link";
import EmptyAwardsSnackbar from "../../../components/awards/empty-award-notification";
import {getPlayersInTournament} from "../../../db/player-repository";
import EnvironmentIndicator from "../../../components/environment-indicator";
import {Typography, Avatar} from "@mui/material";
import ScrollableContentArea from '../../../components/tournament-page/scrollable-content-area';
import {getThemeLogoUrl} from "../../../utils/theme-utils";
import { isDevelopmentMode } from '../../../utils/environment-utils';
import { getGroupRankingForUser } from '../../../actions/group-ranking-actions';
import { hasUserPermission } from '../../../db/tournament-view-permission-repository';
import { redirect, notFound } from 'next/navigation';
import { DevTournamentBadge } from '../../../components/common/dev-tournament-badge';
import TournamentBottomNavWrapper from '../../../components/tournament-bottom-nav/tournament-bottom-nav-wrapper';
import ThemeSwitcher from '../../../components/header/theme-switcher';
import LanguageSwitcher from '../../../components/header/language-switcher';
import UserActions from '../../../components/header/user-actions';
import TournamentSidebar from '../../../components/tournament-page/tournament-sidebar';
import { findTournamentById } from '../../../db/tournament-repository';
import { getGameGuessStatisticsForUsers } from '../../../db/game-guess-repository';
import type { ScoringConfig } from '../../../components/tournament-page/rules';
import { getLocale, getTranslations } from 'next-intl/server'
import { buildTournamentMetadata } from '../../../utils/metadata-utils'
import JsonLd from '../../../components/shared/json-ld'
import { buildSportsEventJsonLd } from '../../../utils/json-ld-utils';

type TournamentLayoutProps = {
  readonly params: Promise<{
    id: string
  }>
  readonly children: React.ReactNode
}

// Helper: Check dev tournament permissions
async function checkDevTournamentPermission(
  tournamentId: string,
  tournament: any,
  user: any,
  locale: string
) {
  const isDevTournamentInProduction = tournament?.dev_only && !isDevelopmentMode()
  if (!isDevTournamentInProduction) return

  // Require authentication for dev tournaments in production
  if (!user) {
    redirect(`/${locale}?openSignin=true&returnUrl=/${locale}/tournaments/${tournamentId}`)
  }

  // Check if user has explicit permission
  const hasPermission = await hasUserPermission(tournamentId, user.id)
  if (!hasPermission) {
    notFound()
  }
}

// Helper: Extract scoring config from tournament
function extractScoringConfig(tournament: any): ScoringConfig | undefined {
  if (!tournament) return undefined

  return {
    game_exact_score_points: tournament.game_exact_score_points ?? 3,
    game_correct_goal_difference_points: tournament.game_correct_goal_difference_points ?? 2,
    game_correct_outcome_points: tournament.game_correct_outcome_points ?? 1,
    champion_points: tournament.champion_points ?? 5,
    runner_up_points: tournament.runner_up_points ?? 3,
    third_place_points: tournament.third_place_points ?? 1,
    individual_award_points: tournament.individual_award_points ?? 3,
    qualified_team_points: tournament.qualified_team_points ?? 1,
    exact_position_qualified_points: tournament.exact_position_qualified_points ?? 2,
    max_silver_games: tournament.max_silver_games ?? 0,
    max_golden_games: tournament.max_golden_games ?? 0,
  }
}

// Helper: Check if within 5 days of tournament start
function isWithinFiveDaysOfStart(startDate: Date): boolean {
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000
  const currentTime = Date.now()
  const startTime = startDate.getTime()
  const timeDiff = Math.abs(startTime - currentTime)

  return timeDiff <= FIVE_DAYS_MS
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const locale = await getLocale()
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tTournament = await getTranslations({ locale, namespace: 'tournament' })
  const appName = tCommon('app.name')

  return buildTournamentMetadata(
    id,
    appName,
    (t) => `${t.long_name} | ${appName}`,
    (t) => tTournament('metadata.description', { name: t.long_name })
  )
}

export default async function TournamentLayout(props: TournamentLayoutProps) {
  const params = await props.params
  const children = props.children
  const locale = await getLocale()
  const user = await getLoggedInUser()
  const isVerified = user &&
    (user.emailVerified || (await findUserById(user.id))?.email_verified)
  const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
  const isUnverified = requireEmailVerification && !!user && !isVerified

  const layoutData = await getTournamentAndGroupsData(params.id)

  // Get all active tournaments for switcher
  const activeTournaments = await getTournaments()

  // Check dev tournament permissions
  await checkDevTournamentPermission(params.id, layoutData.tournament, user, locale)

  const tournamentGuesses = user && (await findTournamentGuessByUserIdTournament(user.id, params.id))
  const tournamentStartDate = await getTournamentStartDate(params.id)
  const playersInTournament = await getPlayersInTournament(params.id)

  // Fetch sidebar data
  const tournament = await findTournamentById(params.id)
  const prodeGroups = user ? await getGroupsForUser() : undefined
  const groupStandings = await getGroupStandingsForTournament(params.id)
  const userGameStatistics = user ? await getGameGuessStatisticsForUsers([user.id], params.id) : []

  // Fetch rank for each group the user belongs to (parallel)
  let groupRanks: Record<string, number> = {}
  if (user && prodeGroups) {
    const allGroups = [...prodeGroups.userGroups, ...prodeGroups.participantGroups]
    const rankResults = await Promise.all(
      allGroups.map((g) => getGroupRankingForUser(user.id, g.id, params.id))
    )
    allGroups.forEach((g, i) => {
      const result = rankResults[i]
      if (result !== null) {
        groupRanks[g.id] = result.currentRank
      }
    })
  }

  // Extract scoring config
  const scoringConfig = extractScoringConfig(tournament)

  // Check if within 5 days of tournament start
  const isWithin5DaysOfTournamentStart = isWithinFiveDaysOfStart(tournamentStartDate)

  const logoUrl = getThemeLogoUrl(layoutData.tournament?.theme)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const tournamentUrl = `${appUrl}/${locale}/tournaments/${params.id}`

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      // Use dvh (dynamic viewport height) for Safari iOS - adjusts as address bar shows/hides
      // Fallback to vh for older browsers
      // Both mobile and desktop need to subtract 56px for fixed bottom element
      // Mobile: bottom nav (56px)
      // Desktop: footer (56px)
      height: 'calc(100vh - 56px)',
      '@supports (height: 100dvh)': {
        height: 'calc(100dvh - 56px)'
      }
    }}>
      {layoutData.tournament && (
        <JsonLd data={buildSportsEventJsonLd(layoutData.tournament.long_name, tournamentUrl, tournamentStartDate, tournament?.locations)} />
      )}
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
            {/* Logo button (home navigation) */}
            <Link href={`/${locale}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Avatar
                variant="rounded"
                src="/logo.png"
                alt="Prode Mundial"
                sx={{
                  width: { xs: 32, md: 48 },
                  height: { xs: 32, md: 48 },
                  backgroundColor: 'white',
                  mr: 1
                }}
              />
            </Link>

            {/* Tournament info with switcher */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '1 1 auto',
                minWidth: 0,
                gap: 1
              }}>
              <Link
                href={`/${locale}/tournaments/${layoutData.tournament?.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  minWidth: 0
                }}
              >
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
              </Link>

              {/* Tournament switcher - outside Link to prevent navigation interference */}
              <TournamentSwitcher
                currentTournamentId={params.id}
                tournaments={activeTournaments}
              />
            </Box>
            {/* User actions container */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 0.5,
              flexShrink: 0
            }}>
              <ThemeSwitcher />
              <LanguageSwitcher />
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
                  }
                  user={user}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </AppBar>
      {isUnverified && <VerificationBanner />}
      {/* Main content area */}
      <Box position="relative" sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {isUnverified && <VerificationOverlay />}
        <Box sx={{
          ...(isUnverified ? { pointerEvents: 'none', userSelect: 'none' } : {}),
          display: 'flow-root',
          flexGrow: 1,
          minHeight: 0,
          px: 2
        }}>
          {/* Centered max-width container */}
          <Box sx={{
            maxWidth: '1200px',
            mx: 'auto',
            height: '100%'
          }}>
            <Grid container spacing={2} sx={{ height: '100%' }}>
              {/* Main content - 9/12 on desktop, full on mobile */}
              <Grid size={{ xs: 12, md: 9 }} sx={{ height: '100%' }}>
                <ScrollableContentArea>
                  {children}
                </ScrollableContentArea>
              </Grid>

              {/* Sidebar - 4/12 on desktop, hidden on mobile */}
              <TournamentSidebar
                tournamentId={params.id}
                scoringConfig={scoringConfig}
                userGameStatistics={userGameStatistics?.[0]}
                tournamentGuess={tournamentGuesses || undefined}
                groupStandings={groupStandings}
                prodeGroups={prodeGroups}
                user={user ?? undefined}
                groupRanks={groupRanks}
              />
            </Grid>
          </Box>
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
      <TournamentBottomNavWrapper tournamentId={params.id} user={user ?? undefined} />

      {/* New tournament notification snackbar */}
      <NewTournamentSnackbar
        tournamentId={params.id}
        tournamentName={layoutData.tournament?.long_name || ''}
        otherTournaments={activeTournaments.filter(t => t.id !== params.id)}
      />
    </Box>
  )
 }
