'use client'

import React from 'react'
import { Box, Typography } from '@mui/material'
import ShareTemplateBase from './ShareTemplateBase'
import { getAvatarColor, getUserInitials } from '../../../utils/avatar-utils'

const WIN_COLOR = '#2e7d32'
const LOSE_COLOR = '#757575'

interface UserStats {
  readonly totalPoints: number
  readonly groupStagePoints: number
  readonly playoffStagePoints: number
  readonly accuracy: number
}

export interface HeadToHeadTemplateProps {
  readonly groupName: string
  readonly tournamentName: string
  readonly myName: string
  readonly myRank: number
  readonly myUserId: string
  readonly myStats: UserStats
  readonly theirName: string
  readonly theirRank: number
  readonly theirUserId: string
  readonly theirStats: UserStats
  readonly themeColor?: string
}

interface StatRowProps {
  readonly label: string
  readonly myValue: number
  readonly theirValue: number
  readonly unit?: string
}

function StatRow({ label, myValue, theirValue, unit = '' }: StatRowProps) {
  const myWins = myValue > theirValue
  const theyWin = theirValue > myValue

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 0.75,
        borderBottom: '1px solid #f5f5f5',
      }}
    >
      <Box sx={{ flex: 1, textAlign: 'right', pr: 1.5 }}>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: myWins ? 'bold' : 'normal',
            color: myWins ? WIN_COLOR : LOSE_COLOR,
            fontFamily: 'inherit',
          }}
        >
          {myValue.toLocaleString()}{unit}
        </Typography>
      </Box>
      <Box sx={{ width: 120, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 11, color: '#888888', fontFamily: 'inherit' }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, textAlign: 'left', pl: 1.5 }}>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: theyWin ? 'bold' : 'normal',
            color: theyWin ? WIN_COLOR : LOSE_COLOR,
            fontFamily: 'inherit',
          }}
        >
          {theirValue.toLocaleString()}{unit}
        </Typography>
      </Box>
    </Box>
  )
}

interface AvatarCircleProps {
  readonly userId: string
  readonly name: string
  readonly rank: number
  readonly align: 'left' | 'right'
}

function AvatarCircle({ userId, name, rank, align }: AvatarCircleProps) {
  const color = getAvatarColor(userId)
  const initials = getUserInitials(name)
  const truncated = name.length > 14 ? `${name.substring(0, 14)}…` : name

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'left' ? 'flex-start' : 'flex-end',
        gap: 0.5,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15, fontFamily: 'inherit' }}>
          {initials}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 13, fontWeight: 'bold', fontFamily: 'inherit', color: '#212121' }}>
        {truncated}
      </Typography>
      <Typography sx={{ fontSize: 11, color: '#888888', fontFamily: 'inherit' }}>
        #{rank}
      </Typography>
    </Box>
  )
}

function getSummaryMessage(myPts: number, theirPts: number, theirName: string): string {
  if (myPts > theirPts) {
    return `You lead by ${(myPts - theirPts).toLocaleString()} pts!`
  }
  if (theirPts > myPts) {
    return `${theirName} leads by ${(theirPts - myPts).toLocaleString()} pts – I'm coming!`
  }
  return "It's a tie!"
}

const HeadToHeadTemplate = React.forwardRef<HTMLDivElement, HeadToHeadTemplateProps>(
  function HeadToHeadTemplate(
    {
      groupName,
      tournamentName,
      myName,
      myRank,
      myUserId,
      myStats,
      theirName,
      theirRank,
      theirUserId,
      theirStats,
      themeColor = '#1976d2',
    },
    ref
  ) {
    const summary = getSummaryMessage(myStats.totalPoints, theirStats.totalPoints, theirName)

    return (
      <div ref={ref}>
        <ShareTemplateBase
          accentColor={themeColor}
          title="Head to Head"
          subtitle={`${groupName} – ${tournamentName}`}
          footerText="qatar-prode.app"
        >
          {/* User headers */}
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <AvatarCircle userId={myUserId} name={myName} rank={myRank} align="left" />
            </Box>
            <Typography sx={{ fontSize: 18, color: '#cccccc', fontWeight: 'bold', fontFamily: 'inherit' }}>
              vs
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <AvatarCircle userId={theirUserId} name={theirName} rank={theirRank} align="right" />
            </Box>
          </Box>

          {/* Stats */}
          <Box sx={{ px: 2.5, pb: 0.5 }}>
            <StatRow
              label="Total Points"
              myValue={myStats.totalPoints}
              theirValue={theirStats.totalPoints}
              unit=" pts"
            />
            <StatRow
              label="Group Stage"
              myValue={myStats.groupStagePoints}
              theirValue={theirStats.groupStagePoints}
              unit=" pts"
            />
            <StatRow
              label="Knockout"
              myValue={myStats.playoffStagePoints}
              theirValue={theirStats.playoffStagePoints}
              unit=" pts"
            />
            <StatRow
              label="Accuracy"
              myValue={myStats.accuracy}
              theirValue={theirStats.accuracy}
              unit="%"
            />
          </Box>

          {/* Summary */}
          <Box
            sx={{
              mx: 2.5,
              my: 1.5,
              p: 1.5,
              borderRadius: 1,
              bgcolor: '#f5f5f5',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: 13, color: '#424242', fontStyle: 'italic', fontFamily: 'inherit' }}>
              {summary}
            </Typography>
          </Box>
        </ShareTemplateBase>
      </div>
    )
  }
)

export default HeadToHeadTemplate
