'use client'

import { ExtendedGameData } from '@/app/definitions'
import { Team, TeamStats, PlayoffRound } from '@/app/db/tables-definition'
import { Box, Tabs, Tab } from '@mui/material'
import { EmojiEvents, AccountTree } from '@mui/icons-material'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import GroupsStageView from './groups-stage-view'
import PlayoffsBracketView from './playoffs-bracket-view'

interface ResultsPageClientProps {
  readonly groups: ReadonlyArray<{
    readonly id: string
    readonly letter: string
    readonly teamStats: TeamStats[]
    readonly teamsMap: { readonly [k: string]: Team }
  }>
  readonly qualifiedTeams: ReadonlyArray<{ readonly id: string }>
  readonly games: ExtendedGameData[]
  readonly teamsMap: { readonly [k: string]: Team }
  readonly playoffStages: ReadonlyArray<
    PlayoffRound & { readonly games: ReadonlyArray<{ readonly game_id: string }> }
  >
}

/**
 * Client wrapper component for Results & Tables page.
 * Provides tabs to switch between Groups and Playoffs views.
 */
export default function ResultsPageClient({
  groups,
  qualifiedTeams,
  games,
  teamsMap,
  playoffStages,
}: ResultsPageClientProps) {
  const t = useTranslations('tables')
  const [selectedTab, setSelectedTab] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Tabs navigation - always visible */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          aria-label="results tabs"
          variant="fullWidth"
        >
          <Tab
            icon={<EmojiEvents />}
            label={t('tabs.groups')}
            id="results-tab-0"
            aria-controls="results-tabpanel-0"
            iconPosition="start"
          />
          <Tab
            icon={<AccountTree />}
            label={t('tabs.playoffs')}
            id="results-tab-1"
            aria-controls="results-tabpanel-1"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab panels - scrollable content */}
      <Box
        role="tabpanel"
        hidden={selectedTab !== 0}
        id="results-tabpanel-0"
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          px: 2,
          py: 2,
        }}
      >
        {selectedTab === 0 && (
          <GroupsStageView groups={groups} games={games} qualifiedTeams={qualifiedTeams} />
        )}
      </Box>

      <Box
        role="tabpanel"
        hidden={selectedTab !== 1}
        id="results-tabpanel-1"
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          px: 2,
          py: 2,
        }}
      >
        {selectedTab === 1 && (
          <PlayoffsBracketView playoffStages={playoffStages} games={games} teamsMap={teamsMap} />
        )}
      </Box>
    </Box>
  )
}
