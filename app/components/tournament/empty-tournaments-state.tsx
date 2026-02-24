import { Box, Typography, Stack } from '@mui/material';
import { getTranslations } from 'next-intl/server';
import { getPastTournaments } from '@/app/actions/tournament-actions';

export default async function EmptyTournamentsState() {
  const t = await getTranslations('tournament.emptyState');
  const pastTournaments = await getPastTournaments(5);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center',
        gap: 2,
        p: 3,
      }}
    >
      <Typography variant="h1" sx={{ fontSize: '4rem' }}>
        🏆
      </Typography>

      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>

      <Typography variant="body1" color="text.secondary">
        {t('description')}
      </Typography>

      {pastTournaments.length > 0 && (
        <Stack spacing={1} sx={{ mt: 3, textAlign: 'left' }}>
          <Typography variant="h6">
            {t('pastTournaments.heading')}
          </Typography>
          {pastTournaments.map((tournament) => (
            <Typography key={tournament.id} variant="body2" color="text.secondary">
              • {tournament.long_name}
            </Typography>
          ))}
        </Stack>
      )}
    </Box>
  );
}
