'use client'

import { useMemo } from 'react';
import { Box, Grid, Skeleton } from "@mui/material";
import TournamentGroupCardSkeleton from "./tournament-group-card-skeleton";
import { getSkeletonA11yProps } from './skeleton-utils';

interface FriendGroupListSkeletonProps {
  readonly count?: number
}

export default function FriendGroupListSkeleton({ count = 3 }: FriendGroupListSkeletonProps) {
  // Generate stable unique keys for skeleton elements
  const skeletonKeys = useMemo(
    () => Array.from({ length: count }, () => crypto.randomUUID()),
    [count]
  );

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
        {skeletonKeys.map((key) => (
          <Grid size={{ xs: 12, sm: 12, md: 6 }} key={key}>
            <TournamentGroupCardSkeleton />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
