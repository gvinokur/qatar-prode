'use client'

import { Box, Stack, Skeleton } from "@mui/material";
import { getSkeletonA11yProps } from './skeleton-utils';

interface StatsCardSkeletonProps {
  readonly rows?: number
}

export default function StatsCardSkeleton({ rows = 3 }: StatsCardSkeletonProps) {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider'
      }}
      {...getSkeletonA11yProps('Loading statistics')}
    >
      {/* Title */}
      <Skeleton
        variant="rectangular"
        width="70%"
        height={28}
        sx={{ mb: 3 }}
      />

      {/* Stat rows */}
      <Stack spacing={2.5}>
        {Array.from({ length: rows }).map((_, index) => (
          <Box key={`stat-row-${index}`}>
            <Skeleton
              variant="rectangular"
              width="60%"
              height={16}
              sx={{ mb: 0.5 }}
            />
            <Skeleton
              variant="rectangular"
              width="35%"
              height={24}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
