import { Grid, Box, Skeleton, Card, CardHeader } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { getSkeletonA11yProps } from './skeleton-utils'

function SidebarCardSkeleton({ titleWidth = '60%', rows = 0 }: { readonly titleWidth?: string; readonly rows?: number }) {
  return (
    <Card>
      <CardHeader
        title={<Skeleton variant="rectangular" width={titleWidth} height={20} />}
        sx={{ pb: rows > 0 ? 1 : undefined }}
      />
      {rows > 0 && (
        <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from({ length: rows }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <Skeleton key={i} variant="rectangular" height={16} />
          ))}
        </Box>
      )}
    </Card>
  )
}

export default function TournamentSidebarSkeleton() {
  return (
    <Grid
      size={{ xs: 12, md: 3 }}
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
      }}
      {...getSkeletonA11yProps('Loading sidebar')}
    >
      <Box
        sx={{
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
          p: 2,
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          overflowY: 'auto',
        }}
      >
        {/* Friend groups */}
        <SidebarCardSkeleton titleWidth="70%" rows={3} />
        {/* Group standings */}
        <SidebarCardSkeleton titleWidth="80%" rows={4} />
        {/* Stats */}
        <SidebarCardSkeleton titleWidth="50%" rows={2} />
        {/* Rules */}
        <SidebarCardSkeleton titleWidth="40%" />
      </Box>
    </Grid>
  )
}
