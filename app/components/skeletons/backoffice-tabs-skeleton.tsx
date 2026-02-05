'use client'

import { Box, Card, CardHeader, CardContent, Grid, Skeleton } from "@mui/material";
import { getSkeletonA11yProps } from './skeleton-utils';

export default function BackofficeTabsSkeleton() {
  return (
    <Box
      pt={2}
      {...getSkeletonA11yProps('Loading backoffice data')}
    >
      <Card sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <CardHeader
          title={<Skeleton variant="rectangular" width={200} height={32} />}
        />
        <CardContent>
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 12, sm: 6 }} key={i}>
                <Skeleton
                  variant="rectangular"
                  height={56}
                  sx={{ borderRadius: 1 }}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
