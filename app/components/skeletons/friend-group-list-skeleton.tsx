'use client'

import { Box, Grid } from "@mui/material";
import { Skeleton } from "@mui/material";
import TournamentGroupCardSkeleton from "./tournament-group-card-skeleton";

interface FriendGroupListSkeletonProps {
  count?: number
}

export default function FriendGroupListSkeleton({ count = 3 }: FriendGroupListSkeletonProps) {
  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label="Loading tournament groups"
      sx={{ py: 3, px: { xs: 2, sm: 3 } }}
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
          <Grid size={{ xs: 12, sm: 12, md: 6 }} key={index}>
            <TournamentGroupCardSkeleton />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
