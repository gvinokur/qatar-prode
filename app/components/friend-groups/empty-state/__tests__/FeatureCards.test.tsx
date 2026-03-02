import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import FeatureCards from '../FeatureCards';
import { renderWithProviders } from '@/__tests__/utils/test-utils';

describe('FeatureCards', () => {
  it('renders the headline and subtitle', () => {
    renderWithProviders(<FeatureCards />);

    expect(screen.getByText('¿Por Qué Unirse o Crear un Grupo?')).toBeInTheDocument();
    expect(screen.getByText('Todo lo que necesitas para competir y conectar')).toBeInTheDocument();
  });

  it('renders all 6 feature cards', () => {
    renderWithProviders(<FeatureCards />);

    expect(screen.getByText('Grupos Privados')).toBeInTheDocument();
    expect(screen.getByText('Competencias Públicas')).toBeInTheDocument();
    expect(screen.getByText('Tablas de Clasificación en Vivo')).toBeInTheDocument();
    expect(screen.getByText('Chat del Grupo')).toBeInTheDocument();
    expect(screen.getByText('Premios Personalizados')).toBeInTheDocument();
    expect(screen.getByText('Estadísticas Detalladas')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    renderWithProviders(<FeatureCards />);

    expect(screen.getByText(/Crea grupos solo por invitación/)).toBeInTheDocument();
    expect(screen.getByText(/Únete a grupos abiertos/)).toBeInTheDocument();
    expect(screen.getByText(/Sigue las clasificaciones en tiempo real/)).toBeInTheDocument();
  });

  it('displays Material-UI icons for each feature', () => {
    renderWithProviders(<FeatureCards />);

    expect(screen.getByTestId('LockIcon')).toBeInTheDocument();
    expect(screen.getByTestId('PublicIcon')).toBeInTheDocument();
    expect(screen.getByTestId('BarChartIcon')).toBeInTheDocument();
    expect(screen.getByTestId('ChatIcon')).toBeInTheDocument();
    expect(screen.getByTestId('EmojiEventsIcon')).toBeInTheDocument();
    expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
  });
});
