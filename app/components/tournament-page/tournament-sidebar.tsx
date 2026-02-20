'use client'

import { Grid } from '@mui/material'
import { usePathname } from 'next/navigation'
import { ScrollShadowContainer } from '@/app/components/common/scroll-shadow-container'
import Rules, { ScoringConfig } from './rules'
import { UserTournamentStatistics } from './user-tournament-statistics'
import GroupStandingsSidebar from './group-standings-sidebar'
import FriendGroupsList from './friend-groups-list'
import type { GameStatisticForUser } from '@/types/definitions'
import type { TournamentGuess } from '@/app/db/tables-definition'
import type { User } from 'next-auth'

interface TournamentSidebarProps {
  readonly tournamentId: string
  readonly scoringConfig?: ScoringConfig
  readonly userGameStatistics?: GameStatisticForUser
  readonly tournamentGuess?: TournamentGuess
  readonly groupStandings?: {
    groups: any[]
    defaultGroupId: string
    qualifiedTeams: any[]
  }
  readonly prodeGroups?: {
    userGroups: any[]
    participantGroups: any[]
  }
  readonly user?: User
}

// Helper to determine current section from pathname
function getCurrentSection(pathname: string, tournamentId: string): string | null {
  // Remove locale prefix if present (pathname could be /en/tournaments/... or /tournaments/...)
  // Only strip if first segment is a 2-letter locale code
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');

  if (pathWithoutLocale === `/tournaments/${tournamentId}/rules`) return 'rules'
  if (pathWithoutLocale.startsWith(`/tournaments/${tournamentId}/stats`)) return 'stats'
  if (pathWithoutLocale === `/tournaments/${tournamentId}/results`) return 'results'
  if (pathWithoutLocale.startsWith(`/tournaments/${tournamentId}/friend-groups`)) return 'friend-groups'
  return null
}

export default function TournamentSidebar({
  tournamentId,
  scoringConfig,
  userGameStatistics,
  tournamentGuess,
  groupStandings,
  prodeGroups,
  user,
}: TournamentSidebarProps) {
  const pathname = usePathname()
  const currentSection = getCurrentSection(pathname, tournamentId)

  return (
    <Grid
      size={{ xs: 12, md: 4 }}
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <ScrollShadowContainer
        direction="vertical"
        hideScrollbar={true}
        sx={{
          flexGrow: 1,
          minHeight: 0,
          pt: 2,
        }}
      >
        <Grid container rowSpacing={2}>
          <Grid size={12}>
            <Rules
              expanded={false}
              scoringConfig={scoringConfig}
              tournamentId={tournamentId}
              isActive={currentSection === 'rules'}
            />
          </Grid>
          {user && (
            <Grid size={12}>
              <UserTournamentStatistics
                userGameStatistics={userGameStatistics}
                tournamentGuess={tournamentGuess}
                tournamentId={tournamentId}
                isActive={currentSection === 'stats'}
              />
            </Grid>
          )}
          {groupStandings && groupStandings.groups.length > 0 && (
            <Grid size={12}>
              <GroupStandingsSidebar
                groups={groupStandings.groups}
                defaultGroupId={groupStandings.defaultGroupId}
                qualifiedTeams={groupStandings.qualifiedTeams}
                tournamentId={tournamentId}
                isActive={currentSection === 'results'}
              />
            </Grid>
          )}
          {prodeGroups && (
            <Grid size={12}>
              <FriendGroupsList
                userGroups={prodeGroups.userGroups}
                participantGroups={prodeGroups.participantGroups}
                tournamentId={tournamentId}
                isActive={currentSection === 'friend-groups'}
              />
            </Grid>
          )}
        </Grid>
      </ScrollShadowContainer>
    </Grid>
  )
}
