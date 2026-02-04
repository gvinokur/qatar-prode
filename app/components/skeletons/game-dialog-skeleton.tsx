'use client'

import { Box, Stack, DialogContent } from "@mui/material";
import { Skeleton } from "@mui/material";

interface GameDialogSkeletonProps {
  isGameGuess?: boolean
}

export default function GameDialogSkeleton({ isGameGuess = false }: GameDialogSkeletonProps) {
  return (
    <DialogContent
      role="status"
      aria-busy="true"
      aria-label="Loading game dialog"
      sx={{ py: 3 }}
    >
      <Stack spacing={3} alignItems="center">
        {/* Team names (vs format) */}
        <Skeleton
          variant="rectangular"
          width="80%"
          height={20}
          sx={{ mx: 'auto' }}
        />

        {/* Home Score */}
        <Box sx={{ width: '100%' }}>
          <Skeleton
            variant="rectangular"
            width="60%"
            height={40}
            sx={{ mx: 'auto' }}
          />
        </Box>

        {/* Away Score */}
        <Box sx={{ width: '100%' }}>
          <Skeleton
            variant="rectangular"
            width="60%"
            height={40}
            sx={{ mx: 'auto' }}
          />
        </Box>

        {/* Boost info (only for game guess) */}
        {isGameGuess && (
          <Stack spacing={1.5} sx={{ width: '100%', mt: 2 }}>
            <Skeleton
              variant="rectangular"
              width="70%"
              height={16}
              sx={{ mx: 'auto' }}
            />
            <Skeleton
              variant="rectangular"
              width="70%"
              height={16}
              sx={{ mx: 'auto' }}
            />
          </Stack>
        )}

        {/* Action buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Skeleton
            variant="rectangular"
            width={100}
            height={36}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width={100}
            height={36}
            sx={{ borderRadius: 1 }}
          />
        </Stack>
      </Stack>
    </DialogContent>
  )
}
