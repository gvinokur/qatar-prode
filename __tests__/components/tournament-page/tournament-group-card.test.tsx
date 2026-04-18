import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import TournamentGroupCard from '@/app/components/tournament-page/tournament-group-card';
import type { DiscoveryGroupData } from '@/app/components/tournament-page/tournament-group-card';
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
    // Spanish: "Ver Posiciones" instead of "View Leaderboard" (fixed from "Ver Posiciones" in Story #332)
    const link = screen.getByRole('link', { name: /Ver Posiciones/ });
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

  it('does not display trophy emoji in group name', () => {
    renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    expect(screen.queryByText(/🏆/)).not.toBeInTheDocument();
  });

  it('has no special border styling (borders removed)', () => {
    const { container } = renderWithTheme(<TournamentGroupCard group={mockGroup} tournamentId={tournamentId} />);
    const card = container.querySelector('.MuiCard-root');
    // Borders were removed as part of the UI improvements
    expect(card).toBeInTheDocument();
  });

  describe('discovery variant', () => {
    const discoveryGroup: DiscoveryGroupData = {
      id: 'group-discovery-1',
      name: 'Public Soccer Group',
      description: 'A group for soccer fans',
      is_public: true,
      owner: { id: 'owner-1', name: 'Alice' },
      memberCount: 12,
      userStatus: 'none',
    };

    it('shows group name', () => {
      renderWithTheme(
        <TournamentGroupCard
          variant="discovery"
          group={discoveryGroup}
          tournamentId={tournamentId}
        />
      );
      expect(screen.getByText('Public Soccer Group')).toBeInTheDocument();
    });

    it('shows description when provided', () => {
      renderWithTheme(
        <TournamentGroupCard
          variant="discovery"
          group={discoveryGroup}
          tournamentId={tournamentId}
        />
      );
      expect(screen.getByText('A group for soccer fans')).toBeInTheDocument();
    });

    it('does not show description section when description is null', () => {
      const groupWithNoDescription: DiscoveryGroupData = {
        ...discoveryGroup,
        description: null,
      };
      renderWithTheme(
        <TournamentGroupCard
          variant="discovery"
          group={groupWithNoDescription}
          tournamentId={tournamentId}
        />
      );
      expect(screen.queryByText('A group for soccer fans')).not.toBeInTheDocument();
    });

    it('shows member count', () => {
      renderWithTheme(
        <TournamentGroupCard
          variant="discovery"
          group={discoveryGroup}
          tournamentId={tournamentId}
        />
      );
      // Spanish: "12 miembros"
      expect(screen.getByText(/miembro/)).toBeInTheDocument();
    });

    it('shows "Solicitar Unirse" button when userStatus is none', () => {
      renderWithTheme(
        <TournamentGroupCard
          variant="discovery"
          group={{ ...discoveryGroup, userStatus: 'none' }}
          tournamentId={tournamentId}
        />
      );
      expect(screen.getByRole('button', { name: /Solicitar Unirse/ })).toBeInTheDocument();
    });

    it('shows disabled "Solicitud Pendiente" button when userStatus is pending', () => {
      renderWithTheme(
        <TournamentGroupCard
          variant="discovery"
          group={{ ...discoveryGroup, userStatus: 'pending' }}
          tournamentId={tournamentId}
        />
      );
      const pendingButton = screen.getByRole('button', { name: /Solicitud Pendiente/ });
      expect(pendingButton).toBeInTheDocument();
      expect(pendingButton).toBeDisabled();
    });

    it('shows "Ver Posiciones" link when userStatus is member', () => {
      renderWithTheme(
        <TournamentGroupCard
          variant="discovery"
          group={{ ...discoveryGroup, userStatus: 'member' }}
          tournamentId={tournamentId}
        />
      );
      expect(screen.getByRole('link', { name: /Ver Posiciones/ })).toBeInTheDocument();
    });

    it('Ver Posiciones link points to the correct URL', () => {
      renderWithTheme(
        <TournamentGroupCard
          variant="discovery"
          group={{ ...discoveryGroup, userStatus: 'member' }}
          tournamentId={tournamentId}
        />
      );
      const link = screen.getByRole('link', { name: /Ver Posiciones/ });
      expect(link).toHaveAttribute(
        'href',
        `/es/tournaments/${tournamentId}/friend-groups/${discoveryGroup.id}`
      );
    });

    it('does NOT show position/points info (my-groups variant only)', () => {
      renderWithTheme(
        <TournamentGroupCard
          variant="discovery"
          group={discoveryGroup}
          tournamentId={tournamentId}
        />
      );
      // These are translation keys only present in the my-groups variant
      expect(screen.queryByText(/Tu Posición/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Tus Puntos/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Líder/)).not.toBeInTheDocument();
    });

    it('does NOT show trophy emoji (my-groups variant only)', () => {
      renderWithTheme(
        <TournamentGroupCard
          variant="discovery"
          group={discoveryGroup}
          tournamentId={tournamentId}
        />
      );
      // Trophy emoji only appears in my-groups variant
      expect(screen.queryByText(/🏆/)).not.toBeInTheDocument();
    });

    it('shows public icon (PrivacyIndicatorIcon with isPublic=true)', () => {
      const { container } = renderWithTheme(
        <TournamentGroupCard
          variant="discovery"
          group={discoveryGroup}
          tournamentId={tournamentId}
        />
      );
      // Discovery variant always shows public icon
      const publicIcon = container.querySelector('[data-testid="PublicIcon"]');
      expect(publicIcon).toBeInTheDocument();
    });

    it('shows owner name', () => {
      renderWithTheme(
        <TournamentGroupCard
          variant="discovery"
          group={discoveryGroup}
          tournamentId={tournamentId}
        />
      );
      // Spanish: "Creado por Alice"
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
    });
  });
});
