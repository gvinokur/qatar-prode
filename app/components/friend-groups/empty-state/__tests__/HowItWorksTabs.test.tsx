import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import HowItWorksTabs from '../HowItWorksTabs';
import { renderWithProviders } from '@/__tests__/utils/test-utils';

describe('HowItWorksTabs', () => {
  it('renders the headline and subtitle', () => {
    renderWithProviders(<HowItWorksTabs />);

    expect(screen.getByText('Cómo Funciona')).toBeInTheDocument();
    expect(screen.getByText('Elige tu camino y comienza en minutos')).toBeInTheDocument();
  });

  it('renders all 3 tabs', () => {
    renderWithProviders(<HowItWorksTabs />);

    expect(screen.getByText('Crear un Grupo')).toBeInTheDocument();
    expect(screen.getByText('Unirse a un Grupo Privado')).toBeInTheDocument();
    expect(screen.getByText('Unirse a un Grupo Público')).toBeInTheDocument();
  });

  it('displays the first tab content by default', () => {
    renderWithProviders(<HowItWorksTabs />);

    expect(screen.getByText('Crea Tu Grupo')).toBeInTheDocument();
    expect(screen.getByText('Comparte el Enlace de Invitación')).toBeInTheDocument();
    expect(screen.getByText('Aprueba Miembros')).toBeInTheDocument();
    expect(screen.getByText('Comienza a Competir')).toBeInTheDocument();
  });

  it('switches to second tab when clicked', () => {
    renderWithProviders(<HowItWorksTabs />);

    const joinPrivateTab = screen.getByText('Unirse a un Grupo Privado');
    fireEvent.click(joinPrivateTab);

    expect(screen.getByText('Obtén un Enlace de Invitación')).toBeInTheDocument();
    expect(screen.getByText('Solicitar Unirse')).toBeInTheDocument();
    expect(screen.getByText('Espera la Aprobación')).toBeInTheDocument();
    expect(screen.getByText("¡Estás Dentro!")).toBeInTheDocument();
  });

  it('switches to third tab when clicked', () => {
    renderWithProviders(<HowItWorksTabs />);

    const joinPublicTab = screen.getByText('Unirse a un Grupo Público');
    fireEvent.click(joinPublicTab);

    expect(screen.getByText('Explora Grupos Públicos')).toBeInTheDocument();
    expect(screen.getByText('Solicitar Unirse')).toBeInTheDocument();
    expect(screen.getByText('Espera la Aprobación')).toBeInTheDocument();
    expect(screen.getByText('¡Comienza a Competir!')).toBeInTheDocument();
  });

  it('renders 4 steps for each tab', () => {
    renderWithProviders(<HowItWorksTabs />);

    // Check first tab
    expect(screen.getAllByText(/Tip:/).length).toBe(4);

    // Switch to second tab
    fireEvent.click(screen.getByText('Unirse a un Grupo Privado'));
    expect(screen.getAllByText(/Tip:/).length).toBe(4);

    // Switch to third tab
    fireEvent.click(screen.getByText('Unirse a un Grupo Público'));
    expect(screen.getAllByText(/Tip:/).length).toBe(4);
  });

  it('renders step numbers for each step', () => {
    renderWithProviders(<HowItWorksTabs />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
