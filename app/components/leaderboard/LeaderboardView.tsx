'use client'

import { useState } from 'react'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Tab } from '@mui/material'
import { useTranslations } from 'next-intl'
import type { LeaderboardViewProps } from './types'
import LeaderboardCards from './LeaderboardCards'
import HistoryTab from './HistoryTab'

export default function LeaderboardView({
  scores,
  currentUserId,
  tournament,
  groupName,
  joinUrl,
  themeColor,
  shareRef,
  tournamentBadgeConfig,
  historyData,
}: LeaderboardViewProps) {
  const t = useTranslations('groups.history')
  const [activeTab, setActiveTab] = useState<'standings' | 'history'>('standings')

  const previousScores = undefined
  const tournamentId = (tournament as any)?.id as string | undefined

  return (
    <TabContext value={activeTab}>
      <TabList
        onChange={(_, value) => setActiveTab(value)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
      >
        <Tab label={t('standingsTabLabel')} value="standings" />
        <Tab label={t('tabLabel')} value="history" />
      </TabList>

      <TabPanel value="standings" sx={{ p: 0 }} keepMounted>
        <LeaderboardCards
          scores={scores}
          currentUserId={currentUserId}
          previousScores={previousScores}
          tournamentId={tournamentId}
          groupName={groupName}
          joinUrl={joinUrl}
          themeColor={themeColor}
          shareRef={shareRef}
          tournamentBadgeConfig={tournamentBadgeConfig}
        />
      </TabPanel>

      <TabPanel value="history" sx={{ p: 0 }}>
        <HistoryTab historyData={historyData} themeColor={themeColor} />
      </TabPanel>
    </TabContext>
  )
}
