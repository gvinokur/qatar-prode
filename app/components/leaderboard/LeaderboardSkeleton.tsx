'use client'

import { Box, Card, CardContent, Skeleton } from '@mui/material'

interface LeaderboardSkeletonProps {
  readonly count?: number
}

export default function LeaderboardSkeleton({ count = 5 }: LeaderboardSkeletonProps) {
  // Generate stable keys based on the count to avoid using array indices
  const skeletonKeys = Array.from({ length: count }, (_, i) => `skeleton-card-${count}-${i}`)

  return (
    <Box
      sx={{
        maxWidth: '868px',
        mx: { md: 'auto' },
        px: { xs: 2, sm: 3 }
      }}
    >
      {skeletonKeys.map((key) => (
        <Card
          key={key}
          sx={{
            py: 1.5,
            px: 2,
            mb: 1.5,
            borderRadius: 2
          }}
        >
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Rank */}
              <Skeleton variant="text" width={32} height={32} />

              {/* Avatar */}
              <Skeleton variant="circular" width={32} height={32} />

              {/* Name */}
              <Skeleton variant="text" sx={{ flex: 1 }} height={24} />

              {/* Points and Rank Change */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                <Skeleton variant="text" width={80} height={24} />
                <Skeleton variant="rounded" width={40} height={20} />
              </Box>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mt: 1.5 }}>
              <Skeleton variant="text" width="100%" height={6} sx={{ borderRadius: 3 }} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
