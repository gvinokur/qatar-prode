'use client'

import { Box, Typography, Button, Stack } from "@mui/material";
import { useTranslations } from 'next-intl';
import ScrollShadowContainer from '../common/scroll-shadow-container';
import FeatureCards from './empty-state/FeatureCards';
import HowItWorksTabs from './empty-state/HowItWorksTabs';
import UseCases from './empty-state/UseCases';

interface FriendGroupsLandingEmptyStateProps {
  readonly onCreateGroup: () => void;
  readonly onDiscoverGroups: () => void;
}

export default function FriendGroupsLandingEmptyState({
  onCreateGroup,
  onDiscoverGroups
}: FriendGroupsLandingEmptyStateProps) {
  const t = useTranslations('groups.emptyState.landing');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* Hero Section - Fixed at top */}
      <Box
        sx={{
          flexShrink: 0,
          textAlign: 'center',
          py: 6,
          px: { xs: 2, sm: 3 }
        }}
      >
        {/* Trophy Emoji */}
        <Box sx={{ fontSize: '4rem', mb: 3 }}>
          🏆
        </Box>

        {/* Headline */}
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            mb: 2,
            fontSize: { xs: '1.75rem', sm: '2.5rem' }
          }}
        >
          {t('hero.headline')}
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            maxWidth: '600px',
            mx: 'auto',
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' },
            fontWeight: 400
          }}
        >
          {t('hero.subtitle')}
        </Typography>

        {/* CTAs */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{ maxWidth: '500px', mx: 'auto' }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={onCreateGroup}
            sx={{ minWidth: { xs: '100%', sm: '200px' } }}
          >
            {t('hero.actions.createGroup')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={onDiscoverGroups}
            sx={{ minWidth: { xs: '100%', sm: '200px' } }}
          >
            {t('hero.actions.discoverGroups')}
          </Button>
        </Stack>
      </Box>

      {/* Scrollable Content with Shadow Indicators */}
      <ScrollShadowContainer
        direction="vertical"
        sx={{
          flex: 1,
          minHeight: 0
        }}
        scrollContainerSx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          px: { xs: 2, sm: 3 },
          pb: 6
        }}
      >
        {/* Features Section */}
        <FeatureCards />

        {/* How It Works Section */}
        <HowItWorksTabs />

        {/* Use Cases Section */}
        <UseCases />

        {/* Final CTA Section */}
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            px: 3,
            borderRadius: 2,
            bgcolor: 'action.hover',
            border: 1,
            borderColor: 'divider'
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 600, mb: 3 }}
          >
            {t('finalCta.headline')}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              onClick={onCreateGroup}
              sx={{ minWidth: { xs: '100%', sm: '200px' } }}
            >
              {t('finalCta.actions.createGroup')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={onDiscoverGroups}
              sx={{ minWidth: { xs: '100%', sm: '200px' } }}
            >
              {t('finalCta.actions.discoverGroups')}
            </Button>
          </Stack>
        </Box>
      </ScrollShadowContainer>
    </Box>
  );
}
