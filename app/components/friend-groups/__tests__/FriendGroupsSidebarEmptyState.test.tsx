import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import FriendGroupsSidebarEmptyState from '../FriendGroupsSidebarEmptyState';
import { renderWithProviders } from '@/__tests__/utils/test-utils';

describe('FriendGroupsSidebarEmptyState', () => {
  const mockOnCreateGroup = vi.fn();
  const mockOnDiscoverGroups = vi.fn();
  const mockOnLearnMore = vi.fn();

  const defaultProps = {
    onCreateGroup: mockOnCreateGroup,
    onDiscoverGroups: mockOnDiscoverGroups,
    onLearnMore: mockOnLearnMore
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the trophy emoji', () => {
    renderWithProviders(<FriendGroupsSidebarEmptyState {...defaultProps} />);

    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('renders the headline', () => {
    renderWithProviders(<FriendGroupsSidebarEmptyState {...defaultProps} />);

    expect(screen.getByText('¡Compite con Amigos!')).toBeInTheDocument();
  });

  it('renders the description', () => {
    renderWithProviders(<FriendGroupsSidebarEmptyState {...defaultProps} />);

    expect(screen.getByText(/Crea grupos privados o únete a competencias públicas/)).toBeInTheDocument();
  });

  it('renders all 3 benefits with checkmarks', () => {
    renderWithProviders(<FriendGroupsSidebarEmptyState {...defaultProps} />);

    expect(screen.getByText('Tablas de posiciones privadas')).toBeInTheDocument();
    expect(screen.getByText('Compite por derechos de fanfarronear')).toBeInTheDocument();
    expect(screen.getByText('Seguimiento del progreso juntos')).toBeInTheDocument();
  });

  it('renders the learn more link above CTAs', () => {
    const { container } = renderWithProviders(<FriendGroupsSidebarEmptyState {...defaultProps} />);

    const learnMoreLink = screen.getByText(/Learn more about groups/);
    const createButton = screen.getByRole('button', { name: /Create Group/i });

    // Check that learn more link appears before create button in DOM order
    const learnMorePosition = Array.from(container.querySelectorAll('*')).indexOf(learnMoreLink.closest('button')!);
    const createButtonPosition = Array.from(container.querySelectorAll('*')).indexOf(createButton);

    expect(learnMorePosition).toBeLessThan(createButtonPosition);
  });

  it('renders both action buttons', () => {
    renderWithProviders(<FriendGroupsSidebarEmptyState {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Crear Grupo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Descubrir Grupos Públicos/i })).toBeInTheDocument();
  });

  it('calls onCreateGroup when Create Group button is clicked', () => {
    renderWithProviders(<FriendGroupsSidebarEmptyState {...defaultProps} />);

    const createButton = screen.getByRole('button', { name: /Crear Grupo/i });
    fireEvent.click(createButton);

    expect(mockOnCreateGroup).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscoverGroups when Discover button is clicked', () => {
    renderWithProviders(<FriendGroupsSidebarEmptyState {...defaultProps} />);

    const discoverButton = screen.getByRole('button', { name: /Descubrir Grupos Públicos/i });
    fireEvent.click(discoverButton);

    expect(mockOnDiscoverGroups).toHaveBeenCalledTimes(1);
  });

  it('calls onLearnMore when learn more link is clicked', () => {
    renderWithProviders(<FriendGroupsSidebarEmptyState {...defaultProps} />);

    const learnMoreLink = screen.getByText(/Aprende más sobre los grupos/);
    fireEvent.click(learnMoreLink);

    expect(mockOnLearnMore).toHaveBeenCalledTimes(1);
  });
});
