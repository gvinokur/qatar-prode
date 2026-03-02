'use client'

/**
 * @deprecated This component is deprecated and replaced by FriendGroupsLandingEmptyState.
 * It will be removed after Story #238 is merged.
 * Use FriendGroupsLandingEmptyState from app/components/friend-groups/FriendGroupsLandingEmptyState.tsx instead.
 */

import { Box, Typography, Button } from "../mui-wrappers/";
import { Stack } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { useTranslations } from 'next-intl';

interface EmptyGroupsStateProps {
  readonly onCreateGroup: () => void;
  readonly onDiscoverGroups: () => void;
}

export default function EmptyGroupsState({ onCreateGroup, onDiscoverGroups }: EmptyGroupsStateProps) {
  const t = useTranslations('groups');

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
        Create your first group or discover public groups to compete with friends!
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
          startIcon={<SearchIcon />}
          onClick={onDiscoverGroups}
          sx={{ minWidth: { xs: '100%', sm: '200px' } }}
        >
          {t('discovery.discoverGroups')}
        </Button>
      </Stack>
    </Box>
  );
}
