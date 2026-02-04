'use client'

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Skeleton } from "@mui/material";
import { getSkeletonA11yProps } from './skeleton-utils';

interface LeaderboardSkeletonProps {
  readonly rows?: number
}

export default function LeaderboardSkeleton({ rows = 10 }: LeaderboardSkeletonProps) {
  return (
    <TableContainer
      sx={{
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider'
      }}
      {...getSkeletonA11yProps('Loading leaderboard')}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '10%' }}>Rank</TableCell>
            <TableCell sx={{ width: '45%' }}>Player</TableCell>
            <TableCell sx={{ width: '25%' }}>Points</TableCell>
            <TableCell sx={{ width: '15%' }}>Trend</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={`leaderboard-row-${index}`}>
              <TableCell>
                <Skeleton variant="rectangular" width="10%" height={20} />
              </TableCell>
              <TableCell>
                <Skeleton variant="rectangular" width="45%" height={20} />
              </TableCell>
              <TableCell>
                <Skeleton variant="rectangular" width="25%" height={20} />
              </TableCell>
              <TableCell>
                <Skeleton variant="rectangular" width="15%" height={20} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
