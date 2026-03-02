'use client'

import { Box, Typography, Card, CardContent, Grid } from "@mui/material";
import { useTranslations } from 'next-intl';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import BarChartIcon from '@mui/icons-material/BarChart';
import ChatIcon from '@mui/icons-material/Chat';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface FeatureCardProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent
        sx={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Box
          sx={{
            color: 'primary.main',
            '& > svg': {
              fontSize: '3rem'
            }
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function FeatureCards() {
  const t = useTranslations('groups.emptyState.landing.features');

  const features = [
    {
      icon: <LockIcon />,
      title: t('privateGroups.title'),
      description: t('privateGroups.description')
    },
    {
      icon: <PublicIcon />,
      title: t('publicCompetitions.title'),
      description: t('publicCompetitions.description')
    },
    {
      icon: <BarChartIcon />,
      title: t('liveLeaderboards.title'),
      description: t('liveLeaderboards.description')
    },
    {
      icon: <ChatIcon />,
      title: t('groupChat.title'),
      description: t('groupChat.description')
    },
    {
      icon: <EmojiEventsIcon />,
      title: t('customPrizes.title'),
      description: t('customPrizes.description')
    },
    {
      icon: <TrendingUpIcon />,
      title: t('detailedStats.title'),
      description: t('detailedStats.description')
    }
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
          {t('headline')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('subtitle')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.title}>
            <FeatureCard
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
