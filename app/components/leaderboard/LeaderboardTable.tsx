'use client'

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useMediaQuery,
} from "@mui/material"
import type { LeaderboardUser } from './types'

interface LeaderboardTableProps {
  readonly scores: LeaderboardUser[]
  readonly currentUserId: string
}

export default function LeaderboardTable({
  scores,
  currentUserId
}: LeaderboardTableProps) {
  const isNotExtraSmallScreen = useMediaQuery('(min-width:900px)')

  // Sort by total points descending
  const sortedScores = [...scores].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints
    }
    // Tie-breaking: sort by user ID alphabetically (deterministic)
    return a.id.localeCompare(b.id)
  })

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Player</TableCell>
            <TableCell>Total Points</TableCell>
            {isNotExtraSmallScreen && <TableCell>Group Stage</TableCell>}
            {isNotExtraSmallScreen && <TableCell>Knockout</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedScores.map((userScore, index) => {
            const rank = index + 1
            const isCurrentUser = userScore.id === currentUserId

            return (
              <TableRow
                key={userScore.id}
                selected={isCurrentUser}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    }
                  }
                }}
              >
                <TableCell sx={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>
                  {rank}
                </TableCell>
                <TableCell
                  sx={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    maxWidth: '200px',
                    fontWeight: isCurrentUser ? 'bold' : 'normal'
                  }}
                >
                  {isCurrentUser ? 'You' : userScore.name}
                </TableCell>
                <TableCell sx={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>
                  {userScore.totalPoints.toLocaleString()}
                </TableCell>
                {isNotExtraSmallScreen && (
                  <TableCell sx={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>
                    {userScore.groupPoints}
                  </TableCell>
                )}
                {isNotExtraSmallScreen && (
                  <TableCell sx={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>
                    {userScore.knockoutPoints}
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Box>
  )
}
