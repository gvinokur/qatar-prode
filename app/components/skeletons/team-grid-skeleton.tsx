'use client'

import { Box, Paper, Grid, Card, Skeleton } from "@mui/material";
import { getSkeletonA11yProps } from './skeleton-utils';

export default function TeamGridSkeleton() {
  return (
    <Box
      sx={{ mt: 2 }}
      {...getSkeletonA11yProps('Loading teams')}
    >
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Header with title and button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Skeleton variant="rectangular" width={200} height={40} />
          <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
        </Box>

        {/* Team cards grid */}
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Card>
                <Skeleton
                  variant="rectangular"
                  height={140}
                  sx={{ borderRadius: 0 }}
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  )
}
