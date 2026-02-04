'use client'

import { Box, Card, CardContent, Container, Skeleton } from "@mui/material";

export default function AuthPageSkeleton() {
  return (
    <Container
      maxWidth="sm"
      sx={{ mt: 8 }}
      role="status"
      aria-busy="true"
      aria-label="Loading authentication page"
    >
      <Card>
        <CardContent sx={{ p: 4 }}>
          {/* Title */}
          <Skeleton
            variant="text"
            width="60%"
            height={40}
            sx={{ mb: 3 }}
          />

          {/* Input fields */}
          <Skeleton
            variant="rectangular"
            height={56}
            sx={{ mb: 2, borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={56}
            sx={{ mb: 3, borderRadius: 1 }}
          />

          {/* Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Skeleton
              variant="rectangular"
              width={150}
              height={40}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}
