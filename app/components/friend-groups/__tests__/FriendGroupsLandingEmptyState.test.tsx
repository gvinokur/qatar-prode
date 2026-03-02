import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import FriendGroupsLandingEmptyState from '../FriendGroupsLandingEmptyState';
import { renderWithProviders } from '@/__tests__/utils/test-utils';

describe('FriendGroupsLandingEmptyState', () => {
  const mockOnCreateGroup = vi.fn();
  const mockOnDiscoverGroups = vi.fn();

  const defaultProps = {
    onCreateGroup: mockOnCreateGroup,
    onDiscoverGroups: mockOnDiscoverGroups
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Hero Section', () => {
    it('renders the trophy emoji', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('renders the headline', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      expect(screen.getByText('Las Predicciones Son Mejores con Amigos')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      expect(screen.getByText(/Crea grupos privados para tu grupo/)).toBeInTheDocument();
    });

    it('renders both CTA buttons in hero', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      const createButtons = screen.getAllByRole('button', { name: /Create/i });
      const discoverButtons = screen.getAllByRole('button', { name: /Discover/i });

      expect(createButtons.length).toBeGreaterThanOrEqual(2);
      expect(discoverButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Features Section', () => {
    it('renders the features headline', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      expect(screen.getByText('¿Por Qué Unirse o Crear un Grupo?')).toBeInTheDocument();
    });

    it('renders feature cards', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      expect(screen.getByText('Grupos Privados')).toBeInTheDocument();
      expect(screen.getByText('Competencias Públicas')).toBeInTheDocument();
      expect(screen.getByText('Tablas de Clasificación en Vivo')).toBeInTheDocument();
    });
  });

  describe('How It Works Section', () => {
    it('renders the how it works headline', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      expect(screen.getByText('Cómo Funciona')).toBeInTheDocument();
    });

    it('renders tab controls', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      expect(screen.getByText('Crear un Grupo')).toBeInTheDocument();
      expect(screen.getByText('Unirse a un Grupo Privado')).toBeInTheDocument();
      expect(screen.getByText('Unirse a un Grupo Público')).toBeInTheDocument();
    });
  });

  describe('Use Cases Section', () => {
    it('renders the use cases headline', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      expect(screen.getByText('Formas Populares de Usar Grupos')).toBeInTheDocument();
    });

    it('renders use case cards', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      expect(screen.getByText('Familia y Amigos')).toBeInTheDocument();
      expect(screen.getByText('Competencias de Oficina')).toBeInTheDocument();
      expect(screen.getByText('Bares y Clubes de Aficionados')).toBeInTheDocument();
      expect(screen.getByText('Residencias Universitarias')).toBeInTheDocument();
    });
  });

  describe('Final CTA Section', () => {
    it('renders the final CTA headline', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      expect(screen.getByText('¿Listo para Comenzar?')).toBeInTheDocument();
    });

    it('renders final CTA buttons', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      expect(screen.getByText(/Crear un Grupo Privado/)).toBeInTheDocument();
      expect(screen.getByText(/Explorar Grupos Públicos/)).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('calls onCreateGroup when hero Create button is clicked', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      const createButtons = screen.getAllByRole('button', { name: /Create/i });
      fireEvent.click(createButtons[0]);

      expect(mockOnCreateGroup).toHaveBeenCalled();
    });

    it('calls onDiscoverGroups when hero Discover button is clicked', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      const discoverButtons = screen.getAllByRole('button', { name: /Discover/i });
      fireEvent.click(discoverButtons[0]);

      expect(mockOnDiscoverGroups).toHaveBeenCalled();
    });

    it('calls onCreateGroup when final CTA Create button is clicked', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /Create a Private Group/i });
      fireEvent.click(createButton);

      expect(mockOnCreateGroup).toHaveBeenCalled();
    });

    it('calls onDiscoverGroups when final CTA Discover button is clicked', () => {
      renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      const discoverButton = screen.getByRole('button', { name: /Browse Public Groups/i });
      fireEvent.click(discoverButton);

      expect(mockOnDiscoverGroups).toHaveBeenCalled();
    });
  });

  describe('ScrollShadowContainer Integration', () => {
    it('uses ScrollShadowContainer for scrollable content', () => {
      const { container } = renderWithProviders(<FriendGroupsLandingEmptyState {...defaultProps} />);

      // ScrollShadowContainer renders with specific structure
      // Check that features, how it works, use cases, and final CTA are within scrollable area
      expect(container.querySelector('[style*="overflow"]')).toBeInTheDocument();
    });
  });
});
