import { Grid, Skeleton, Paper, Box } from '@mui/material'

/**
 * Loading skeleton for results page.
 * Shows placeholder cards while data is being fetched.
 */
export default function LoadingSkeleton() {
  // Show 8 skeleton cards (typical number of groups)
  const skeletonCards = Array.from({ length: 8 }, (_, index) => index)

  return (
    <Grid container spacing={2}>
      {skeletonCards.map((index) => (
        <Grid
          key={index}
          size={{ xs: 12, sm: 6, md: 4 }}
        >
          <Paper elevation={2} sx={{ p: 2 }}>
            {/* Header skeleton */}
            <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />

            {/* Games list skeleton */}
            <Box sx={{ mb: 2 }}>
              <Skeleton variant="text" width="100%" height={24} />
              <Skeleton variant="text" width="100%" height={24} />
              <Skeleton variant="text" width="100%" height={24} />
              <Skeleton variant="text" width="90%" height={24} />
            </Box>

            {/* Standings table skeleton */}
            <Box>
              <Skeleton variant="text" width="50%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={120} />
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  )
}
