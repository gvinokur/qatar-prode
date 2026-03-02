import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import UseCases from '../UseCases';
import { renderWithProviders } from '@/__tests__/utils/test-utils';

describe('UseCases', () => {
  it('renders the headline', () => {
    renderWithProviders(<UseCases />);

    expect(screen.getByText('Formas Populares de Usar Grupos')).toBeInTheDocument();
  });

  it('renders all 4 use case cards', () => {
    renderWithProviders(<UseCases />);

    expect(screen.getByText('Familia y Amigos')).toBeInTheDocument();
    expect(screen.getByText('Competencias de Oficina')).toBeInTheDocument();
    expect(screen.getByText('Bares y Clubes de Aficionados')).toBeInTheDocument();
    expect(screen.getByText('Residencias Universitarias')).toBeInTheDocument();
  });

  it('renders use case descriptions', () => {
    renderWithProviders(<UseCases />);

    expect(screen.getByText(/Mantén el contacto a través de las distancias/)).toBeInTheDocument();
    expect(screen.getByText(/Aumenta la moral del equipo/)).toBeInTheDocument();
    expect(screen.getByText(/Une a tus seguidores locales/)).toBeInTheDocument();
    expect(screen.getByText(/Reúne a tu piso o fraternidad/)).toBeInTheDocument();
  });

  it('displays emojis for each use case', () => {
    renderWithProviders(<UseCases />);

    const container = screen.getByText('Familia y Amigos').closest('div')?.parentElement;
    expect(container?.textContent).toContain('👨‍👩‍👧‍👦');

    const officeContainer = screen.getByText('Competencias de Oficina').closest('div')?.parentElement;
    expect(officeContainer?.textContent).toContain('💼');

    const barContainer = screen.getByText('Bares y Clubes de Aficionados').closest('div')?.parentElement;
    expect(barContainer?.textContent).toContain('🍺');

    const collegeContainer = screen.getByText('Residencias Universitarias').closest('div')?.parentElement;
    expect(collegeContainer?.textContent).toContain('🏫');
  });
});
