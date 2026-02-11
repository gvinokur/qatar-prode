'use client'

import { Box, Typography } from '@mui/material';

interface EmptyGamesStateProps {
  readonly filterType: 'all' | 'groups' | 'playoffs' | 'unpredicted' | 'closingSoon';
}

export function EmptyGamesState({ filterType }: EmptyGamesStateProps) {
  const getMessage = () => {
    switch (filterType) {
      case 'unpredicted':
        return {
          emoji: '🎉',
          title: '¡Todo Listo!',
          description: 'Ya predijiste todos los partidos disponibles.'
        };
      case 'closingSoon':
        return {
          emoji: '⏰',
          title: 'No hay partidos próximos',
          description: 'No hay partidos cerrando en las próximas 48 horas.'
        };
      case 'groups':
        return {
          emoji: '🔍',
          title: 'No hay partidos de grupos',
          description: 'No se encontraron partidos en esta fase.'
        };
      case 'playoffs':
        return {
          emoji: '🔍',
          title: 'No hay partidos de playoffs',
          description: 'No se encontraron partidos en esta fase.'
        };
      default:
        return {
          emoji: '🔍',
          title: 'No hay partidos',
          description: 'No se encontraron partidos con los filtros seleccionados.'
        };
    }
  };

  const { emoji, title, description } = getMessage();

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
        minHeight: '300px'
      }}
    >
      <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
        {emoji}
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '500px' }}>
        {description}
      </Typography>
    </Box>
  );
}
