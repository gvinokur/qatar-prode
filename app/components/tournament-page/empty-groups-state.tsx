'use client'

import { Box, Typography, Button } from "../mui-wrappers/";
import { Stack } from "@mui/material";

interface EmptyGroupsStateProps {
  readonly onCreateGroup: () => void;
  readonly onJoinGroup: () => void;
}

export default function EmptyGroupsState({ onCreateGroup, onJoinGroup }: EmptyGroupsStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
        minHeight: '400px'
      }}
    >
      {/* Trophy Icon */}
      <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
        🏆
      </Typography>

      {/* Heading */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        No Groups Yet!
      </Typography>

      {/* Description */}
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '500px' }}>
        Create your first group or join an existing one to compete with friends!
      </Typography>

      {/* Action Buttons */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={onCreateGroup}
          sx={{ minWidth: { xs: '100%', sm: '200px' } }}
        >
          Create Your First Group
        </Button>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={onJoinGroup}
          sx={{ minWidth: { xs: '100%', sm: '200px' } }}
        >
          Join with Code
        </Button>
      </Stack>
    </Box>
  );
}
