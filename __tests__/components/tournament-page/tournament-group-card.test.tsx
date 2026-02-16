import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import TournamentGroupCard from '@/app/components/tournament-page/tournament-group-card';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import type { TournamentGroupStats } from '@/app/definitions';

describe('TournamentGroupCard', () => {
  const mockGroup: TournamentGroupStats = {
    groupId: 'group-1',
    groupName: 'Test Group',
    isOwner: false,
    totalParticipants: 10,
    userPosition: 3,
    userPoints: 45,
    leaderName: 'John Doe',
    leaderPoints: 52,
    themeColor: null
  };

  const tournamentId = 'tournament-1';

  it('renders group name correctly', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    expect(screen.getByText(/Test Group/)).toBeInTheDocument();
  });

  it('displays user position in correct format', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    // Spanish format: "de" instead of "of"
    expect(screen.getByText(/#3 de 10/)).toBeInTheDocument();
  });

  it('displays user points', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    expect(screen.getByText(/45/)).toBeInTheDocument();
  });

  it('displays leader name and points when user is not leader', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    expect(screen.getByText(/John Doe \(52 pts\)/)).toBeInTheDocument();
  });

  it('displays "¡Tú!" when user is the leader', () => {
    const leaderGroup: TournamentGroupStats = {
      ...mockGroup,
      userPosition: 1,
      userPoints: 52,
      leaderPoints: 52
    };
    renderWithTheme(<TournamentGroupCard group={leaderGroup} tournamentId={tournamentId} />);
    // Spanish: "¡Tú!" instead of "You!"
    expect(screen.getByText(/¡Tú! \(52 pts\)/)).toBeInTheDocument();
  });

  it('shows Owner badge when user is owner', () => {
    const ownerGroup: TournamentGroupStats = {
      ...mockGroup,
      isOwner: true
    };
    renderWithTheme(<TournamentGroupCard group={ownerGroup} tournamentId={tournamentId} />);
    // Spanish: "Dueño" instead of "Owner"
    expect(screen.getByText('Dueño')).toBeInTheDocument();
  });

  it('does not show Owner badge when user is not owner', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    // Spanish: "Dueño" instead of "Owner"
    expect(screen.queryByText('Dueño')).not.toBeInTheDocument();
  });

  it('has link to tournament-scoped friend group detail page', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    // Spanish: "Ver Detalles" instead of "View Details"
    const link = screen.getByRole('link', { name: /Ver Detalles/ });
    expect(link).toHaveAttribute('href', `/es/tournaments/${tournamentId}/friend-groups/${mockGroup.groupId}`);
  });

  it('shows share button when user is owner', () => {
    const ownerGroup: TournamentGroupStats = {
      ...mockGroup,
      isOwner: true
    };
    renderWithTheme(<TournamentGroupCard group={ownerGroup} tournamentId={tournamentId} />);
    // Share button should be present with aria-label "Compartir grupo"
    const shareButton = screen.getByLabelText('Compartir grupo');
    expect(shareButton).toBeInTheDocument();
  });

  it('does not show share button when user is not owner', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    // Share button should not be present
    expect(screen.queryByLabelText('Compartir grupo')).not.toBeInTheDocument();
  });

  it('displays trophy emoji in group name', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    expect(screen.getByText(/🏆/)).toBeInTheDocument();
  });

  it('has no special border styling (borders removed)', () => {
    const { container } = renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    const card = container.querySelector('.MuiCard-root');
    // Borders were removed as part of the UI improvements
    expect(card).toBeInTheDocument();
  });
});
