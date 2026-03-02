'use client'

import { Box, Typography, Button, Stack } from "@mui/material";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useTranslations } from 'next-intl';

interface FriendGroupsSidebarEmptyStateProps {
  readonly onLearnMore: () => void;
}

export default function FriendGroupsSidebarEmptyState({
  onLearnMore
}: FriendGroupsSidebarEmptyStateProps) {
  const t = useTranslations('groups.emptyState.sidebar');

  const benefits = [
    t('benefits.privateLeaderboards'),
    t('benefits.braggingRights'),
    t('benefits.trackProgress')
  ];

  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 2,
        px: 1.5
      }}
    >
      {/* Headline */}
      <Typography
        variant="h6"
        component="h2"
        gutterBottom
        sx={{ fontWeight: 600, mb: 1.5 }}
      >
        {t('headline')}
      </Typography>

      {/* Description */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        {t('description')}
      </Typography>

      {/* Benefits List */}
      <Stack spacing={1} sx={{ mb: 2, alignItems: 'flex-start', width: '100%' }}>
        {benefits.map((benefit) => (
          <Box
            key={benefit}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              width: '100%'
            }}
          >
            <CheckCircleOutlineIcon
              sx={{
                fontSize: '1.25rem',
                color: 'success.main',
                flexShrink: 0,
                mt: 0.25
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                flex: 1,
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {benefit}
            </Typography>
          </Box>
        ))}
      </Stack>

      {/* Learn More Link */}
      <Box>
        <Button
          variant="text"
          onClick={onLearnMore}
          sx={{
            textTransform: 'none',
            fontSize: '0.875rem'
          }}
        >
          {t('learnMore')} →
        </Button>
      </Box>
    </Box>
  );
}
