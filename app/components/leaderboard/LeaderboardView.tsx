'use client'

import type { LeaderboardViewProps } from './types'
import LeaderboardCards from './LeaderboardCards'

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
  materializedRanks,
}: LeaderboardViewProps) {
  const tournamentId = (tournament as any)?.id as string | undefined

  return (
    <LeaderboardCards
      scores={scores}
      currentUserId={currentUserId}
      tournamentId={tournamentId}
      groupName={groupName}
      joinUrl={joinUrl}
      themeColor={themeColor}
      shareRef={shareRef}
      tournamentBadgeConfig={tournamentBadgeConfig}
      historyData={historyData}
      materializedRanks={materializedRanks}
    />
  )
}
