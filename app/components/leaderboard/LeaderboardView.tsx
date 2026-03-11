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
}: LeaderboardViewProps) {
  const previousScores = undefined
  const tournamentId = (tournament as any)?.id as string | undefined

  return (
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
      historyData={historyData}
    />
  )
}
