'use client'

import { Box, Typography, Card, CardContent, Grid } from "@mui/material";
import { useTranslations } from 'next-intl';

interface UseCaseCardProps {
  readonly emoji: string;
  readonly title: string;
  readonly description: string;
}

function UseCaseCard({ emoji, title, description }: UseCaseCardProps) {
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
      <CardContent sx={{ textAlign: 'center' }}>
        <Box sx={{ fontSize: '3rem', mb: 2 }}>
          {emoji}
        </Box>
        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function UseCases() {
  const t = useTranslations('groups.emptyState.landing.useCases');

  const useCases = [
    {
      emoji: '👨‍👩‍👧‍👦',
      title: t('familyFriends.title'),
      description: t('familyFriends.description')
    },
    {
      emoji: '💼',
      title: t('officeCompetitions.title'),
      description: t('officeCompetitions.description')
    },
    {
      emoji: '🍺',
      title: t('barFanClubs.title'),
      description: t('barFanClubs.description')
    },
    {
      emoji: '🏫',
      title: t('collegeDorms.title'),
      description: t('collegeDorms.description')
    }
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h2"
        gutterBottom
        sx={{
          textAlign: 'center',
          fontWeight: 600,
          mb: 4
        }}
      >
        {t('headline')}
      </Typography>

      <Grid container spacing={3}>
        {useCases.map((useCase, index) => (
          <Grid size={{ xs: 12, sm: 6 }} key={index}>
            <UseCaseCard
              emoji={useCase.emoji}
              title={useCase.title}
              description={useCase.description}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
