import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    expect(screen.getByText(/#3 of 10/)).toBeInTheDocument();
  });

  it('displays user points', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    expect(screen.getByText(/45/)).toBeInTheDocument();
  });

  it('displays leader name and points when user is not leader', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    expect(screen.getByText(/John Doe \(52 pts\)/)).toBeInTheDocument();
  });

  it('displays "You!" when user is the leader', () => {
    const leaderGroup: TournamentGroupStats = {
      ...mockGroup,
      userPosition: 1,
      userPoints: 52,
      leaderPoints: 52
    };
    renderWithTheme(<TournamentGroupCard group={leaderGroup} tournamentId={tournamentId} />);
    expect(screen.getByText(/You! \(52 pts\)/)).toBeInTheDocument();
  });

  it('shows Owner badge when user is owner', () => {
    const ownerGroup: TournamentGroupStats = {
      ...mockGroup,
      isOwner: true
    };
    renderWithTheme(<TournamentGroupCard group={ownerGroup} tournamentId={tournamentId} />);
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('does not show Owner badge when user is not owner', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    expect(screen.queryByText('Owner')).not.toBeInTheDocument();
  });

  it('has link to tournament-scoped friend group detail page', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    const link = screen.getByRole('link', { name: /View Details/ });
    expect(link).toHaveAttribute('href', `/tournaments/${tournamentId}/friend-groups/${mockGroup.groupId}`);
  });

  it('applies theme color as left border when present', () => {
    const themedGroup: TournamentGroupStats = {
      ...mockGroup,
      themeColor: '#FF5733'
    };
    const { container } = renderWithTheme(<TournamentGroupCard group={themedGroup} tournamentId={tournamentId} />);
    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveStyle({ borderLeft: '4px solid #FF5733' });
  });

  it('does not apply theme color left border when user is leader', () => {
    const leaderWithTheme: TournamentGroupStats = {
      ...mockGroup,
      userPosition: 1,
      themeColor: '#FF5733'
    };
    const { container } = renderWithTheme(<TournamentGroupCard group={leaderWithTheme} tournamentId={tournamentId} />);
    const card = container.querySelector('.MuiCard-root');
    // Leader cards should not have theme color border
    expect(card).not.toHaveStyle({ borderLeft: '4px solid #FF5733' });
  });

  it('displays trophy emoji in group name', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    expect(screen.getByText(/🏆/)).toBeInTheDocument();
  });
});
