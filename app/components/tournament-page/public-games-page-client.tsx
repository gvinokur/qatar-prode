'use client'

import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import PublicCTABar from './public-cta-bar'
import ReadOnlyGameCard from './read-only-game-card'
import { ScrollShadowContainer } from '../common/scroll-shadow-container'
import { ExtendedGameData } from '../../definitions'
import { Team, TournamentGroup, PlayoffRound } from '../../db/tables-definition'
import { useMemo } from 'react'

interface PublicGamesPageClientProps {
  readonly games: ExtendedGameData[]
  readonly teamsMap: Record<string, Team>
  readonly groups: TournamentGroup[]
  readonly rounds: PlayoffRound[]
}

export default function PublicGamesPageClient({
  games,
  teamsMap,
  groups,
  rounds,
}: PublicGamesPageClientProps) {
  const t = useTranslations('tournament.public')

  // Sort games by date and game number
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => {
      const dateCompare = a.game_date.getTime() - b.game_date.getTime()
      if (dateCompare !== 0) return dateCompare
      return a.game_number - b.game_number
    })
  }, [games])

  // Show loading state if no games
  if (!games || games.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {t('noGames')}
        </Typography>
      </Box>
    )
  }

  // Helper to get group/playoff text for a game
  const getGroupOrPlayoffText = (game: ExtendedGameData): string => {
    if (game.playoffStage) {
      const round = rounds.find(r => r.id === game.playoff_stage_id)
      return round?.name || t('playoff')
    }
    if (game.group_id) {
      const group = groups.find(g => g.id === game.group_id)
      return group ? `${t('group')} ${group.group_letter}` : ''
    }
    return ''
  }

  return (
    <ScrollShadowContainer
      id="public-games-container"
      direction="vertical"
      hideScrollbar={true}
      sx={{
        height: '100%',
      }}
      scrollContainerSx={{
        pb: { xs: '56px', md: 0 }, // Account for fixed bottom nav on mobile
        pt: 2,
      }}
    >
      <Stack spacing={2}>
        {/* Public CTA Bar */}
        <PublicCTABar />

        {/* Games List */}
        <Stack spacing={1.5}>
          {sortedGames.map((game) => {
            const homeTeam = game.home_team_id ? teamsMap[game.home_team_id] : null
            const awayTeam = game.away_team_id ? teamsMap[game.away_team_id] : null

            return (
              <ReadOnlyGameCard
                key={game.id}
                gameNumber={game.game_number}
                gameDate={game.game_date}
                location={game.location}
                gameTimezone={game.game_timezone}
                homeTeamNameOrDescription={game.home_team_description || homeTeam?.short_name || homeTeam?.name || ''}
                homeTeamShortNameOrDescription={homeTeam?.short_name}
                homeTeamTheme={homeTeam?.theme}
                awayTeamNameOrDescription={game.away_team_description || awayTeam?.short_name || awayTeam?.name || ''}
                awayTeamShortNameOrDescription={awayTeam?.short_name}
                awayTeamTheme={awayTeam?.theme}
                homeScore={game.home_score}
                awayScore={game.away_score}
                isPlayoffGame={!!game.playoffStage}
                groupOrPlayoffText={getGroupOrPlayoffText(game)}
              />
            )
          })}
        </Stack>
      </Stack>
    </ScrollShadowContainer>
  )
}
