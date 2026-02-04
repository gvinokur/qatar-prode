'use client'

import { Box, Divider, Stack } from "@mui/material";
import { Skeleton } from "@mui/material";

interface GameCardSkeletonProps {
  variant?: 'compact' | 'full'
}

export default function GameCardSkeleton({ variant = 'full' }: GameCardSkeletonProps) {
  const isCompact = variant === 'compact'

  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label="Loading game card"
      sx={{
        p: 2,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider'
      }}
    >
      {/* Game number/stage */}
      <Skeleton
        variant="rectangular"
        width="60%"
        height={isCompact ? 16 : 20}
        sx={{ mb: 1 }}
      />

      <Divider sx={{ my: 1 }} />

      {/* Teams section */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ my: 2 }}
      >
        {/* Home team */}
        <Stack direction="row" alignItems="center" spacing={1} flex={1}>
          <Skeleton
            variant="circular"
            width={isCompact ? 32 : 40}
            height={isCompact ? 32 : 40}
          />
          <Skeleton
            variant="rectangular"
            width="35%"
            height={isCompact ? 20 : 24}
          />
        </Stack>

        {/* Score */}
        <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: '20%' }}>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={isCompact ? 28 : 32}
          />
        </Box>

        {/* Away team */}
        <Stack direction="row" alignItems="center" spacing={1} flex={1} justifyContent="flex-end">
          <Skeleton
            variant="rectangular"
            width="35%"
            height={isCompact ? 20 : 24}
          />
          <Skeleton
            variant="circular"
            width={isCompact ? 32 : 40}
            height={isCompact ? 32 : 40}
          />
        </Stack>
      </Stack>

      {/* Location and date/time */}
      {variant === 'full' && (
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" width="40%" height={16} />
          <Skeleton variant="rectangular" width="50%" height={16} />
        </Stack>
      )}
    </Box>
  )
}
