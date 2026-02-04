'use client'

import { Box, Stack, Skeleton } from "@mui/material";

export default function TournamentGroupCardSkeleton() {
  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label="Loading tournament group"
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        height: '100%'
      }}
    >
      {/* Group name */}
      <Skeleton
        variant="rectangular"
        width="70%"
        height={28}
        sx={{ mb: 3 }}
      />

      {/* Stats sections */}
      <Stack spacing={2.5}>
        {/* Your Position */}
        <Box>
          <Skeleton
            variant="rectangular"
            width="60%"
            height={16}
            sx={{ mb: 0.5 }}
          />
          <Skeleton
            variant="rectangular"
            width="40%"
            height={24}
          />
        </Box>

        {/* Your Points */}
        <Box>
          <Skeleton
            variant="rectangular"
            width="60%"
            height={16}
            sx={{ mb: 0.5 }}
          />
          <Skeleton
            variant="rectangular"
            width="40%"
            height={24}
          />
        </Box>

        {/* Current Leader */}
        <Box>
          <Skeleton
            variant="rectangular"
            width="60%"
            height={16}
            sx={{ mb: 0.5 }}
          />
          <Skeleton
            variant="rectangular"
            width="40%"
            height={24}
          />
        </Box>

        {/* Members */}
        <Box>
          <Skeleton
            variant="rectangular"
            width="60%"
            height={16}
            sx={{ mb: 0.5 }}
          />
          <Skeleton
            variant="rectangular"
            width="40%"
            height={24}
          />
        </Box>
      </Stack>

      {/* Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Skeleton
          variant="rectangular"
          width="50%"
          height={36}
          sx={{ maxWidth: 120, borderRadius: 1 }}
        />
      </Box>
    </Box>
  )
}
