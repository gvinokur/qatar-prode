import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import FriendGroupsSidebarEmptyState from '../FriendGroupsSidebarEmptyState';
import { renderWithProviders } from '@/__tests__/utils/test-utils';

describe('FriendGroupsSidebarEmptyState', () => {
  const mockOnLearnMore = vi.fn();

  const defaultProps = {
    onLearnMore: mockOnLearnMore
  };

  afterEach(() => {
    vi.clearAllMocks();
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

  it('renders the learn more link', () => {
    renderWithProviders(<FriendGroupsSidebarEmptyState {...defaultProps} />);

    expect(screen.getByText(/Aprende más sobre los grupos/)).toBeInTheDocument();
  });

  it('calls onLearnMore when learn more link is clicked', () => {
    renderWithProviders(<FriendGroupsSidebarEmptyState {...defaultProps} />);

    const learnMoreLink = screen.getByText(/Aprende más sobre los grupos/);
    fireEvent.click(learnMoreLink);

    expect(mockOnLearnMore).toHaveBeenCalledTimes(1);
  });
});
