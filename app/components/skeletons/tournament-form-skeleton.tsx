'use client'

import { Box, Paper, Grid, Skeleton } from "@mui/material";
import { getSkeletonA11yProps } from './skeleton-utils';

export default function TournamentFormSkeleton() {
  return (
    <Box
      component="form"
      sx={{ mt: 2 }}
      {...getSkeletonA11yProps('Loading tournament form')}
    >
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Title */}
        <Skeleton
          variant="text"
          width={250}
          height={40}
          sx={{ mb: 3 }}
        />

        {/* Form fields grid */}
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, md: 6 }} key={i}>
              <Skeleton
                variant="rectangular"
                height={56}
                sx={{ borderRadius: 1 }}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  )
}
