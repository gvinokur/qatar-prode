'use client'

import { Box, Grid, Skeleton } from "@mui/material";
import TournamentGroupCardSkeleton from "./tournament-group-card-skeleton";
import { getSkeletonA11yProps } from './skeleton-utils';

interface FriendGroupListSkeletonProps {
  readonly count?: number
}

export default function FriendGroupListSkeleton({ count = 3 }: FriendGroupListSkeletonProps) {
  return (
    <Box
      sx={{ py: 3, px: { xs: 2, sm: 3 } }}
      {...getSkeletonA11yProps('Loading tournament groups')}
    >
      {/* Title */}
      <Skeleton
        variant="rectangular"
        width="60%"
        height={32}
        sx={{ mb: 3 }}
      />

      {/* Grid of group cards */}
      <Grid container spacing={3}>
        {Array.from({ length: count }).map((_, index) => (
          <Grid size={{ xs: 12, sm: 12, md: 6 }} key={`group-skeleton-${index}`}>
            <TournamentGroupCardSkeleton />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
