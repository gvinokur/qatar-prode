'use client'

import { Box, Button, Typography } from '@mui/material'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { LayoutGroup } from 'framer-motion'
import ShareIcon from '@mui/icons-material/Share'
import { useTranslations } from 'next-intl'
import type { LeaderboardCardsProps, LeaderboardUser, Badge } from './types'
import LeaderboardCard from './LeaderboardCard'
import HeadToHeadDialog from './HeadToHeadDialog'
import { calculateRanks, calculateRanksWithChange } from '../../utils/rank-calculator'
import { calculateBadges, UserBadgeInput } from '../../utils/badge-calculator'
import SharePreviewModal from '../friend-groups/sharing/SharePreviewModal'
import LeaderboardTemplate, { type LeaderboardTemplateUser } from '../friend-groups/sharing/LeaderboardTemplate'
import PersonalHighlightTemplate from '../friend-groups/sharing/PersonalHighlightTemplate'

// Helper function to transform UserScore to LeaderboardUser
function transformToLeaderboardUser(score: any): LeaderboardUser {
  return {
    id: score.userId,
    name: score.userName || 'Unknown User',
    totalPoints: score.totalPoints || 0,
    yesterdayTotalPoints: score.yesterdayTotalPoints,
    groupPoints: score.groupStagePoints ?? 0,
    knockoutPoints: score.knockoutPoints ?? 0,
    groupStageScore: score.groupStageScore || 0,
    groupStageQualifiersScore: score.groupStageQualifiersScore || 0,
    groupPositionScore: score.groupPositionScore,
    playoffScore: score.playoffScore || 0,
    groupBoostBonus: score.groupBoostBonus || 0,
    playoffBoostBonus: score.playoffBoostBonus || 0,
    honorRollScore: score.honorRollScore || 0,
    individualAwardsScore: score.individualAwardsScore || 0
  }
}

export default function LeaderboardCards({
  scores,
  currentUserId,
  previousScores,
  tournamentId,
  groupName,
  joinUrl,
  themeColor,
  shareRef,
  tournamentBadgeConfig,
}: LeaderboardCardsProps) {
  const t = useTranslations('groups.sharing')

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [compareUserId, setCompareUserId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'yesterday' | 'today'>('yesterday')
  const [leaderboardShareOpen, setLeaderboardShareOpen] = useState(false)
  const [highlightShareOpen, setHighlightShareOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const leaderboardTemplateRef = useRef<HTMLDivElement | null>(null)
  const highlightTemplateRef = useRef<HTMLDivElement | null>(null)

  const openLeaderboardShare = useCallback(() => setLeaderboardShareOpen(true), [])

  useEffect(() => {
    if (shareRef) {
      shareRef.current = { openLeaderboardShare }
      return () => { shareRef.current = null }
    }
  }, [shareRef, openLeaderboardShare])

  // Wait for client mount before rendering portals
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if we have yesterday data to enable animation
  const hasYesterdayData = scores.some((s: any) => s.yesterdayTotalPoints !== undefined && s.yesterdayTotalPoints !== null)

  // After initial render, animate to today's scores
  useEffect(() => {
    if (hasYesterdayData) {
      const timer = setTimeout(() => setSortBy('today'), 800)
      return () => clearTimeout(timer)
    } else {
      // If no yesterday data, immediately show today's scores
      setSortBy('today')
    }
  }, [hasYesterdayData])

  // Transform, sort, and calculate ranks with changes
  const leaderboardUsers = useMemo(() => {
    const transformed = scores.map(score => transformToLeaderboardUser(score))

    // Sort based on current sortBy state
    const scoreField = sortBy === 'yesterday' ? 'yesterdayTotalPoints' : 'totalPoints'
    const sorted = transformed.toSorted((a, b) => {
      const scoreA = a[scoreField] ?? 0
      const scoreB = b[scoreField] ?? 0

      if (scoreB !== scoreA) {
        return scoreB - scoreA
      }
      // Tie-breaking: sort by user ID alphabetically (deterministic)
      return a.id.localeCompare(b.id)
    })

    // Calculate ranks based on current sort field
    const usersWithCurrentRank = calculateRanks(sorted, scoreField)

    // Calculate rank changes only when showing today's scores
    if (sortBy === 'today' && hasYesterdayData) {
      return calculateRanksWithChange(usersWithCurrentRank, 'yesterdayTotalPoints')
    }

    // When showing yesterday's scores or no yesterday data, no rank change indicators
    return usersWithCurrentRank.map(u => ({ ...u, rankChange: 0 }))
  }, [scores, sortBy, hasYesterdayData])

  // Build badge map using pre-computed ranks + original score badge fields
  const badgeMap = useMemo(() => {
    if (!tournamentBadgeConfig) return new Map<string, Badge[]>()

    const scoreMap = new Map<string, any>()
    scores.forEach((s: any) => scoreMap.set(s.userId, s))

    const inputs: UserBadgeInput[] = leaderboardUsers.map((u) => {
      const s = scoreMap.get(u.id) ?? {}
      return {
        userId: u.id,
        rank: (u as any).currentRank ?? 1,
        rankChange: (u as any).rankChange ?? 0,
        totalExactGuesses: s.totalExactGuesses ?? 0,
        totalCorrectGuesses: s.totalCorrectGuesses ?? 0,
        qualifiedTeamsCorrect: s.qualifiedTeamsCorrect ?? 0,
        honorRollScore: s.honorRollScore ?? 0,
        individualAwardsScore: s.individualAwardsScore ?? 0,
        boostsUsed: s.boostsUsed ?? 0,
        scoredBoosts: s.scoredBoosts ?? 0,
      }
    })

    return calculateBadges(inputs, tournamentBadgeConfig)
  }, [leaderboardUsers, scores, tournamentBadgeConfig])

  // Handle card toggle (mutual exclusion - only one card expanded at a time)
  const handleCardToggle = (userId: string) => {
    setExpandedCardId(prev => (prev === userId ? null : userId))
  }

  // Empty state
  if (leaderboardUsers.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 2
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No leaderboard data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Check back after predictions close
        </Typography>
      </Box>
    )
  }

  const compareUser = compareUserId ? leaderboardUsers.find((u) => u.id === compareUserId) : null
  const currentUser = leaderboardUsers.find((u) => u.id === currentUserId)
  const currentUserRankChange = (currentUser as any)?.rankChange ?? 0
  const currentUserRank = (currentUser as any)?.currentRank ?? 0

  // Build template users (top 5, always include current user)
  const top5 = leaderboardUsers.slice(0, 5)
  const currentUserInTop5 = top5.some((u) => u.id === currentUserId)
  const templateUsers: LeaderboardTemplateUser[] = [
    ...top5.map((u) => ({
      rank: (u as any).currentRank,
      name: u.name,
      userId: u.id,
      points: u.totalPoints,
      isCurrentUser: u.id === currentUserId,
      badges: badgeMap.get(u.id) ?? [],
    })),
    ...(!currentUserInTop5 && currentUser
      ? [{
          rank: currentUserRank,
          name: currentUser.name,
          userId: currentUser.id,
          points: currentUser.totalPoints,
          isCurrentUser: true,
          badges: badgeMap.get(currentUser.id) ?? [],
        }]
      : []),
  ]

  const leaderboardShareText = t('leaderboardShareText', {
    groupName: groupName ?? '',
    url: joinUrl ?? 'qatar-prode.app',
  })

  const highlightShareText = t('highlightShareText', {
    count: currentUserRankChange,
    groupName: groupName ?? '',
    url: joinUrl ?? 'qatar-prode.app',
  })

  return (
    <>
      {/* Share Standings button — only shown when no external shareRef controls it */}
      {!shareRef && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: { xs: 2, sm: 3, md: 4 }, mb: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={openLeaderboardShare}
            sx={{ fontSize: '0.75rem' }}
          >
            {t('shareStandings')}
          </Button>
        </Box>
      )}

      <LayoutGroup>
        <Box
          role="list"
          aria-label="Leaderboard"
          sx={{
            maxWidth: '1000px',
            mx: { md: 'auto' },
            px: { xs: 2, sm: 3, md: 4 }
          }}
        >
          {leaderboardUsers.map((user) => {
            const isCurrentUser = user.id === currentUserId
            const isExpanded = expandedCardId === user.id
            const userRankChange = (user as any).rankChange ?? 0

            return (
              <LeaderboardCard
                key={user.id}
                user={user}
                rank={(user as any).currentRank}
                rankChange={userRankChange}
                isCurrentUser={isCurrentUser}
                isExpanded={isExpanded}
                onToggle={() => handleCardToggle(user.id)}
                onCompare={isCurrentUser ? undefined : () => setCompareUserId(user.id)}
                onShareHighlight={isCurrentUser && userRankChange > 0 ? () => setHighlightShareOpen(true) : undefined}
                badges={badgeMap.get(user.id) ?? []}
              />
            )
          })}
        </Box>
      </LayoutGroup>

      {tournamentId && compareUserId && (
        <HeadToHeadDialog
          open={!!compareUserId}
          onClose={() => setCompareUserId(null)}
          currentUserId={currentUserId}
          opponentId={compareUserId}
          tournamentId={tournamentId}
          currentUserName={currentUser?.name ?? 'You'}
          opponentName={compareUser?.name ?? ''}
          currentUserRank={currentUserRank}
          opponentRank={(compareUser as any)?.currentRank}
          groupName={groupName}
          joinUrl={joinUrl}
          themeColor={themeColor}
          currentUserBadges={badgeMap.get(currentUserId) ?? []}
          opponentBadges={badgeMap.get(compareUserId) ?? []}
        />
      )}

      {/* Off-screen portals for image templates */}
      {mounted && createPortal(
        <div
          style={{
            position: 'fixed',
            left: -9999,
            top: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <LeaderboardTemplate
            ref={leaderboardTemplateRef}
            groupName={groupName ?? ''}
            tournamentName=""
            users={templateUsers}
            currentUserRank={currentUserRank}
            totalUsers={leaderboardUsers.length}
            joinUrl={joinUrl}
            themeColor={themeColor}
          />
        </div>,
        document.body
      )}

      {mounted && currentUser && createPortal(
        <div
          style={{
            position: 'fixed',
            left: -9999,
            top: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <PersonalHighlightTemplate
            ref={highlightTemplateRef}
            groupName={groupName ?? ''}
            tournamentName=""
            userName={currentUser.name}
            userId={currentUser.id}
            currentRank={currentUserRank}
            previousRank={currentUserRank + currentUserRankChange}
            currentPoints={currentUser.totalPoints}
            themeColor={themeColor}
          />
        </div>,
        document.body
      )}

      {/* Share preview modals */}
      <SharePreviewModal
        open={leaderboardShareOpen}
        onClose={() => setLeaderboardShareOpen(false)}
        templateRef={leaderboardTemplateRef}
        shareText={leaderboardShareText}
        filename="leaderboard.png"
      />

      <SharePreviewModal
        open={highlightShareOpen}
        onClose={() => setHighlightShareOpen(false)}
        templateRef={highlightTemplateRef}
        shareText={highlightShareText}
        filename="highlight.png"
      />
    </>
  )
}
