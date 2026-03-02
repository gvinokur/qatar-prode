import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import FriendGroupsLandingEmptyState from '../FriendGroupsLandingEmptyState';
import { renderWithProviders } from '@/__tests__/utils/test-utils';

// Mock ScrollShadowContainer to render children directly
vi.mock('../../common/scroll-shadow-container', () => ({
  ScrollShadowContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-shadow-container">{children}</div>
  ),
}));

describe('FriendGroupsLandingEmptyState', () => {
  const mockOnCreateGroup = vi.fn();
  const mockOnDiscoverGroups = vi.fn();

  const defaultProps = {
    onCreateGroup: mockOnCreateGroup,
    onDiscoverGroups: mockOnDiscoverGroups
  };

  // Wrapper component to provide height context for the component
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <div style={{ height: '800px' }}>
      {children}
    </div>
  );

  const renderComponent = (props = defaultProps) => {
    return renderWithProviders(
      <TestWrapper>
        <FriendGroupsLandingEmptyState {...props} />
      </TestWrapper>
    );
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Hero Section', () => {
    it('renders the headline', () => {
      renderComponent();

      expect(screen.getByText('Las Predicciones Son Mejores con Amigos')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      renderComponent();

      expect(screen.getByText(/Crea grupos privados para tu grupo/)).toBeInTheDocument();
    });

    it('renders both CTA buttons in hero', () => {
      renderComponent();

      // Hero buttons
      expect(screen.getByRole('button', { name: /Crea Tu Primer Grupo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Descubrir Grupos Públicos/i })).toBeInTheDocument();

      // Final CTA buttons
      expect(screen.getByRole('button', { name: /Crear un Grupo Privado/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Explorar Grupos Públicos/i })).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    it('renders the features headline', () => {
      renderComponent();

      expect(screen.getByText('¿Por Qué Unirse o Crear un Grupo?')).toBeInTheDocument();
    });

    it('renders feature cards', () => {
      renderComponent();

      expect(screen.getByText('Grupos Privados')).toBeInTheDocument();
      expect(screen.getByText('Competencias Públicas')).toBeInTheDocument();
      expect(screen.getByText('Tablas de Clasificación en Vivo')).toBeInTheDocument();
    });
  });

  describe('How It Works Section', () => {
    it('renders the how it works headline', () => {
      renderComponent();

      expect(screen.getByText('Cómo Funciona')).toBeInTheDocument();
    });

    it('renders tab controls', () => {
      renderComponent();

      expect(screen.getByText('Crear un Grupo')).toBeInTheDocument();
      expect(screen.getByText('Unirse a un Grupo Privado')).toBeInTheDocument();
      expect(screen.getByText('Unirse a un Grupo Público')).toBeInTheDocument();
    });
  });

  describe('Use Cases Section', () => {
    it('renders the use cases headline', () => {
      renderComponent();

      expect(screen.getByText('Formas Populares de Usar Grupos')).toBeInTheDocument();
    });

    it('renders use case cards', () => {
      renderComponent();

      expect(screen.getByText('Familia y Amigos')).toBeInTheDocument();
      expect(screen.getByText('Competencias de Oficina')).toBeInTheDocument();
      expect(screen.getByText('Bares y Clubes de Aficionados')).toBeInTheDocument();
      expect(screen.getByText('Residencias Universitarias')).toBeInTheDocument();
    });
  });

  describe('Final CTA Section', () => {
    it('renders the final CTA headline', () => {
      renderComponent();

      expect(screen.getByText('¿Listo para Comenzar?')).toBeInTheDocument();
    });

    it('renders final CTA buttons', () => {
      renderComponent();

      expect(screen.getByText(/Crear un Grupo Privado/)).toBeInTheDocument();
      expect(screen.getByText(/Explorar Grupos Públicos/)).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('calls onCreateGroup when hero Create button is clicked', () => {
      renderComponent();

      const createButton = screen.getByRole('button', { name: /Crea Tu Primer Grupo/i });
      fireEvent.click(createButton);

      expect(mockOnCreateGroup).toHaveBeenCalled();
    });

    it('calls onDiscoverGroups when hero Discover button is clicked', () => {
      renderComponent();

      const discoverButton = screen.getByRole('button', { name: /Descubrir Grupos Públicos/i });
      fireEvent.click(discoverButton);

      expect(mockOnDiscoverGroups).toHaveBeenCalled();
    });

    it('calls onCreateGroup when final CTA Create button is clicked', () => {
      renderComponent();

      const createButton = screen.getByRole('button', { name: /Crear un Grupo Privado/i });
      fireEvent.click(createButton);

      expect(mockOnCreateGroup).toHaveBeenCalled();
    });

    it('calls onDiscoverGroups when final CTA Discover button is clicked', () => {
      renderComponent();

      const discoverButton = screen.getByRole('button', { name: /Explorar Grupos Públicos/i });
      fireEvent.click(discoverButton);

      expect(mockOnDiscoverGroups).toHaveBeenCalled();
    });
  });

  describe('Scrollable Content', () => {
    it('has a scrollable content area for features, how it works, use cases, and final CTA', () => {
      const { container } = renderComponent();

      // Check that the scrollable content area exists
      const scrollableBox = container.querySelector('[style*="overflow"]');
      expect(scrollableBox).toBeInTheDocument();
    });
  });
});
