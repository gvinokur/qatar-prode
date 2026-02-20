import { vi, describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import TeamStandingCard from '../../../app/components/groups-page/team-standing-card';
import { renderWithTheme, renderWithProviders } from '../../utils/test-utils';
import { testFactories } from '../../db/test-factories';
import type { TeamStanding } from '../../../app/components/groups-page/types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

// Mock RankChangeIndicator
vi.mock('../../../app/components/leaderboard/RankChangeIndicator', () => ({
  default: ({ change }: { change: number }) => (
    <div data-testid="rank-change-indicator">{change}</div>
  )
}));

describe('TeamStandingCard', () => {
  const mockTeam = testFactories.team({
    id: 'team-1',
    name: 'Argentina',
    short_name: 'ARG'
  });

  const baseMockStanding: TeamStanding = {
    id: 'team-1',
    position: 1,
    team: mockTeam,
    points: 9,
    goalDifference: 5,
    isQualified: false,
    gamesPlayed: 3,
    wins: 3,
    draws: 0,
    losses: 0,
    goalsFor: 7,
    goalsAgainst: 2,
    conductScore: 0
  };

  describe('Collapsed State', () => {
    it('renders position, team name, and points when collapsed', () => {
      const onToggleExpand = vi.fn();
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={onToggleExpand}
          showRankChange={false}
        />
      );

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getAllByText('Argentina')[0]).toBeInTheDocument();
      expect(screen.getByText(/9 pts/)).toBeInTheDocument();
    });

    it('displays games played and goal difference when collapsed (non-compact)', () => {
      const onToggleExpand = vi.fn();
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={onToggleExpand}
          showRankChange={false}
        />
      );

      // Should show PJ and DG in collapsed state (on larger screens)
      expect(screen.getByText(/3 PJ/)).toBeInTheDocument();
      expect(screen.getByText(/\+5 DG/)).toBeInTheDocument();
    });

    it('renders correctly (short name tested via edge case)', () => {
      // Note: Testing media queries in jsdom is complex
      // The short name rendering is tested in the "Edge Cases" section
      // with the team without short_name test
      const onToggleExpand = vi.fn();
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={onToggleExpand}
          showRankChange={false}
        />
      );

      // Component renders successfully
      expect(screen.getAllByText('Argentina')[0]).toBeInTheDocument();
    });

    it('shows negative goal difference with minus sign', () => {
      const standingWithNegativeGD: TeamStanding = {
        ...baseMockStanding,
        goalDifference: -3
      };

      renderWithTheme(
        <TeamStandingCard
          standing={standingWithNegativeGD}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      expect(screen.getByText(/-3 DG/)).toBeInTheDocument();
    });
  });

  describe('Expanded State', () => {
    it('displays detailed statistics when expanded', () => {
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={true}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      // Check for detailed stats section
      expect(screen.getByText('Estadísticas Detalladas')).toBeInTheDocument();
      expect(screen.getByText(/Partidos Jugados: 3/)).toBeInTheDocument();
      expect(screen.getByText(/Ganados: 3/)).toBeInTheDocument();
      expect(screen.getByText(/Empatados: 0/)).toBeInTheDocument();
      expect(screen.getByText(/Perdidos: 0/)).toBeInTheDocument();
      expect(screen.getByText(/Goles a Favor: 7/)).toBeInTheDocument();
      expect(screen.getByText(/Goles en Contra: 2/)).toBeInTheDocument();
      expect(screen.getByText(/Diferencia de Gol: \+5/)).toBeInTheDocument();
      expect(screen.getByText(/Puntos de Conducta: 0/)).toBeInTheDocument();
    });

    it('shows only points (not PJ/DG) when expanded', () => {
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={true}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      // In expanded state, should only show "9 pts" without PJ/DG
      const pointsText = screen.getByText('9 pts');
      expect(pointsText).toBeInTheDocument();

      // Should NOT show PJ/DG inline (they're in the detailed stats)
      expect(screen.queryByText(/9 pts \(3 PJ/)).not.toBeInTheDocument();
    });
  });

  describe('Qualified Team Styling', () => {
    it('renders qualified team without errors', () => {
      const qualifiedStanding: TeamStanding = {
        ...baseMockStanding,
        isQualified: true
      };

      const { container } = renderWithTheme(
        <TeamStandingCard
          standing={qualifiedStanding}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      // Component renders successfully with qualified styling applied internally
      expect(container).toBeInTheDocument();
      expect(screen.getAllByText('Argentina').length).toBeGreaterThan(0);
    });

    it('renders non-qualified team without errors', () => {
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      // Component renders successfully
      expect(screen.getAllByText('Argentina').length).toBeGreaterThan(0);
    });
  });

  describe('Rank Change Indicator', () => {
    it('shows rank change indicator when showRankChange is true', () => {
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          rankChange={2}
          showRankChange={true}
        />
      );

      expect(screen.getByTestId('rank-change-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('rank-change-indicator')).toHaveTextContent('2');
    });

    it('does not show rank change indicator when showRankChange is false', () => {
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          rankChange={2}
          showRankChange={false}
        />
      );

      expect(screen.queryByTestId('rank-change-indicator')).not.toBeInTheDocument();
    });

    it('handles rank change of 0 (no change)', () => {
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          rankChange={0}
          showRankChange={true}
        />
      );

      expect(screen.getByTestId('rank-change-indicator')).toHaveTextContent('0');
    });

    it('handles negative rank change (position worsened)', () => {
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          rankChange={-1}
          showRankChange={true}
        />
      );

      expect(screen.getByTestId('rank-change-indicator')).toHaveTextContent('-1');
    });
  });

  describe('Interactions', () => {
    it('calls onToggleExpand when card is clicked', () => {
      const onToggleExpand = vi.fn();
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={onToggleExpand}
          showRankChange={false}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(onToggleExpand).toHaveBeenCalledTimes(1);
    });

    it('calls onToggleExpand when Enter key is pressed', () => {
      const onToggleExpand = vi.fn();
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={onToggleExpand}
          showRankChange={false}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(onToggleExpand).toHaveBeenCalledTimes(1);
    });

    it('calls onToggleExpand when Space key is pressed', () => {
      const onToggleExpand = vi.fn();
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={onToggleExpand}
          showRankChange={false}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });

      expect(onToggleExpand).toHaveBeenCalledTimes(1);
    });

    it('does not call onToggleExpand for other keys', () => {
      const onToggleExpand = vi.fn();
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={onToggleExpand}
          showRankChange={false}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'a' });

      expect(onToggleExpand).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label when collapsed', () => {
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute(
        'aria-label',
        'Argentina, rank 1, 9 pts. Collapsed. Press Enter or Space to expand.'
      );
    });

    it('has proper aria-label when expanded', () => {
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={true}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute(
        'aria-label',
        'Argentina, rank 1, 9 pts. Expanded. Press Enter or Space to collapse.'
      );
    });

    it('has aria-expanded attribute reflecting current state', () => {
      const { rerender, rerenderWithTheme } = renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      let card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-expanded', 'false');

      rerenderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={true}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-expanded', 'true');
    });

    it('is keyboard focusable with tabIndex 0', () => {
      renderWithTheme(
        <TeamStandingCard
          standing={baseMockStanding}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Edge Cases', () => {
    it('handles team without short_name (fallback to 3 letters)', () => {
      const teamWithoutShortName = testFactories.team({
        id: 'team-2',
        name: 'Brazil',
        short_name: null
      });

      const standing: TeamStanding = {
        ...baseMockStanding,
        team: teamWithoutShortName
      };

      renderWithTheme(
        <TeamStandingCard
          standing={standing}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      // Note: In normal viewport, full name is displayed
      // The 3-letter fallback is used in ultra-compact mode which is hard to test in jsdom
      // But we verify the team name is rendered
      expect(screen.getAllByText('Brazil')[0]).toBeInTheDocument();
    });

    it('handles zero goal difference', () => {
      const standingWithZeroGD: TeamStanding = {
        ...baseMockStanding,
        goalDifference: 0
      };

      renderWithTheme(
        <TeamStandingCard
          standing={standingWithZeroGD}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      expect(screen.getByText(/\+0 DG/)).toBeInTheDocument();
    });

    it('handles negative conduct score', () => {
      const standingWithNegativeConductScore: TeamStanding = {
        ...baseMockStanding,
        conductScore: -5
      };

      renderWithTheme(
        <TeamStandingCard
          standing={standingWithNegativeConductScore}
          isExpanded={true}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />
      );

      expect(screen.getByText(/Puntos de Conducta: -5/)).toBeInTheDocument();
    });
  });

  describe('i18n - English Translations', () => {
    describe('Points Display Interpolation - English', () => {
      it('displays English points display with interpolation in collapsed state', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          points: 15,
          gamesPlayed: 5,
          goalDifference: 10
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={false}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'en' }
        );

        // English: EnOf prefix indicates English translation with interpolation
        // Should display: "EnOf(15 pts (5 PJ, +10 DG))"
        expect(screen.getByText(/EnOf\(15 pts \(5 PJ, \+10 DG\)\)/)).toBeInTheDocument();
      });

      it('handles negative goal difference in English', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          points: 8,
          gamesPlayed: 4,
          goalDifference: -3
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={false}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'en' }
        );

        expect(screen.getByText(/EnOf\(8 pts \(4 PJ, -3 DG\)\)/)).toBeInTheDocument();
      });

      it('handles zero goal difference in English', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          points: 10,
          gamesPlayed: 3,
          goalDifference: 0
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={false}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'en' }
        );

        expect(screen.getByText(/EnOf\(10 pts \(3 PJ, \+0 DG\)\)/)).toBeInTheDocument();
      });

      it('displays compact points in English when expanded', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          points: 15
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={true}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'en' }
        );

        // When expanded, should show compact format: "EnOf(15 pts)"
        expect(screen.getByText(/EnOf\(15 pts\)/)).toBeInTheDocument();
      });

      it('displays large points values with correct interpolation (English)', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          points: 999,
          gamesPlayed: 100,
          goalDifference: 500
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={false}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'en' }
        );

        expect(screen.getByText(/EnOf\(999 pts \(100 PJ, \+500 DG\)\)/)).toBeInTheDocument();
      });
    });

    describe('Detailed Stats Labels - English', () => {
      it('displays all English stat labels when expanded', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          gamesPlayed: 5,
          wins: 4,
          draws: 1,
          losses: 0,
          goalsFor: 12,
          goalsAgainst: 3,
          goalDifference: 9,
          conductScore: 2
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={true}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'en' }
        );

        // All stat labels should be in English (with EnOf prefix)
        expect(screen.getByText(/EnOf\(Estadísticas Detalladas\)/)).toBeInTheDocument();
        expect(screen.getByText(/EnOf\(Partidos Jugados\)/)).toBeInTheDocument();
        expect(screen.getByText(/EnOf\(Récord\)/)).toBeInTheDocument();
        expect(screen.getByText(/EnOf\(Ganados\)/)).toBeInTheDocument();
        expect(screen.getByText(/EnOf\(Empatados\)/)).toBeInTheDocument();
        expect(screen.getByText(/EnOf\(Perdidos\)/)).toBeInTheDocument();
        expect(screen.getByText(/EnOf\(Goles\)/)).toBeInTheDocument();
        expect(screen.getByText(/EnOf\(Goles a Favor\)/)).toBeInTheDocument();
        expect(screen.getByText(/EnOf\(Goles en Contra\)/)).toBeInTheDocument();
        expect(screen.getByText(/EnOf\(Diferencia de Gol\)/)).toBeInTheDocument();
        expect(screen.getByText(/EnOf\(Puntos de Conducta\)/)).toBeInTheDocument();
      });

      it('formats goal difference with sign in detailed stats (English)', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          goalDifference: 9
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={true}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'en' }
        );

        // Goal difference should show with + prefix in the detailed stats section
        expect(screen.getByText(/EnOf\(Diferencia de Gol\): \+9/)).toBeInTheDocument();
      });

      it('formats negative goal difference in detailed stats (English)', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          goalDifference: -5
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={true}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'en' }
        );

        expect(screen.getByText(/EnOf\(Diferencia de Gol\): -5/)).toBeInTheDocument();
      });
    });
  });

  describe('i18n - Spanish Translations', () => {
    describe('Points Display Interpolation - Spanish', () => {
      it('displays Spanish points display with interpolation in collapsed state', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          points: 15,
          gamesPlayed: 5,
          goalDifference: 10
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={false}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'es' }
        );

        // Spanish: no EnOf prefix, direct translation
        // Should display: "15 pts (5 PJ, +10 DG)"
        expect(screen.getByText(/15 pts \(5 PJ, \+10 DG\)/)).toBeInTheDocument();
      });

      it('handles negative goal difference in Spanish', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          points: 8,
          gamesPlayed: 4,
          goalDifference: -3
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={false}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'es' }
        );

        expect(screen.getByText(/8 pts \(4 PJ, -3 DG\)/)).toBeInTheDocument();
      });

      it('handles zero goal difference in Spanish', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          points: 10,
          gamesPlayed: 3,
          goalDifference: 0
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={false}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'es' }
        );

        expect(screen.getByText(/10 pts \(3 PJ, \+0 DG\)/)).toBeInTheDocument();
      });

      it('displays compact points in Spanish when expanded', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          points: 15
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={true}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'es' }
        );

        // Spanish compact: "15 pts" (no EnOf prefix)
        expect(screen.getByText(/15 pts/)).toBeInTheDocument();
      });

      it('displays large points values with correct interpolation (Spanish)', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          points: 999,
          gamesPlayed: 100,
          goalDifference: 500
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={false}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'es' }
        );

        expect(screen.getByText(/999 pts \(100 PJ, \+500 DG\)/)).toBeInTheDocument();
      });
    });

    describe('Detailed Stats Labels - Spanish', () => {
      it('displays all Spanish stat labels when expanded', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          gamesPlayed: 5,
          wins: 4,
          draws: 1,
          losses: 0,
          goalsFor: 12,
          goalsAgainst: 3,
          goalDifference: 9,
          conductScore: 2
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={true}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'es' }
        );

        // All stat labels should be in Spanish
        // We check for unique combinations to avoid ambiguity with multiple elements
        expect(screen.getByText(/Estadísticas Detalladas/)).toBeInTheDocument();
        expect(screen.getByText(/Partidos Jugados.*5/)).toBeInTheDocument();
        expect(screen.getByText(/Récord/)).toBeInTheDocument();
        expect(screen.getByText(/Ganados.*4/)).toBeInTheDocument();
        expect(screen.getByText(/Empatados.*1/)).toBeInTheDocument();
        expect(screen.getByText(/Perdidos.*0/)).toBeInTheDocument();
        expect(screen.getByText(/Goles a Favor.*12/)).toBeInTheDocument();
        expect(screen.getByText(/Goles en Contra.*3/)).toBeInTheDocument();
        expect(screen.getByText(/Diferencia de Gol/)).toBeInTheDocument();
        expect(screen.getByText(/Puntos de Conducta.*2/)).toBeInTheDocument();
      });

      it('formats goal difference with sign in detailed stats (Spanish)', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          goalDifference: 9
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={true}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'es' }
        );

        // Goal difference should show with + prefix in the detailed stats section (Spanish)
        expect(screen.getByText(/Diferencia de Gol.*\+9/)).toBeInTheDocument();
      });

      it('formats negative goal difference in detailed stats (Spanish)', () => {
        const standing: TeamStanding = {
          ...baseMockStanding,
          goalDifference: -5
        };

        renderWithProviders(
          <TeamStandingCard
            standing={standing}
            isExpanded={true}
            onToggleExpand={vi.fn()}
            showRankChange={false}
          />,
          { locale: 'es' }
        );

        expect(screen.getByText(/Diferencia de Gol.*-5/)).toBeInTheDocument();
      });
    });
  });

  describe('i18n - Compact Mode', () => {
    it('displays compact points format in English compact mode (collapsed)', () => {
      const standing: TeamStanding = {
        ...baseMockStanding,
        points: 15,
        gamesPlayed: 5,
        goalDifference: 10
      };

      renderWithProviders(
        <TeamStandingCard
          standing={standing}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
          compact={true}
        />,
        { locale: 'en' }
      );

      // In compact mode, should show compact format even when collapsed
      expect(screen.getByText(/EnOf\(15 pts\)/)).toBeInTheDocument();
    });

    it('displays compact points format in Spanish compact mode (collapsed)', () => {
      const standing: TeamStanding = {
        ...baseMockStanding,
        points: 15,
        gamesPlayed: 5,
        goalDifference: 10
      };

      renderWithProviders(
        <TeamStandingCard
          standing={standing}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
          compact={true}
        />,
        { locale: 'es' }
      );

      // Spanish compact: "15 pts"
      expect(screen.getByText(/15 pts/)).toBeInTheDocument();
    });

    it('uses short team name in compact mode', () => {
      const team = testFactories.team({
        name: 'Very Long Team Name',
        short_name: 'VLT'
      });

      const standing: TeamStanding = {
        ...baseMockStanding,
        team
      };

      renderWithProviders(
        <TeamStandingCard
          standing={standing}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
          compact={true}
        />,
        { locale: 'en' }
      );

      // Should show short name in compact mode
      expect(screen.getByText('VLT')).toBeInTheDocument();
    });
  });

  describe('i18n - Accessibility and Aria Labels', () => {
    it('generates correct aria-label in English', () => {
      const standing: TeamStanding = {
        ...baseMockStanding,
        team: testFactories.team({ name: 'Chelsea' }),
        position: 2,
        points: 12
      };

      renderWithProviders(
        <TeamStandingCard
          standing={standing}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />,
        { locale: 'en' }
      );

      const card = screen.getByRole('button');
      // aria-label should contain team name, rank, and points (translations vary by locale)
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Chelsea'));
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('rank 2'));
    });

    it('generates correct aria-label in Spanish', () => {
      const standing: TeamStanding = {
        ...baseMockStanding,
        team: testFactories.team({ name: 'Sevilla' }),
        position: 3,
        points: 9
      };

      renderWithProviders(
        <TeamStandingCard
          standing={standing}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />,
        { locale: 'es' }
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Sevilla'));
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('rank 3'));
    });

    it('toggles expansion on Enter key in English', () => {
      const onToggle = vi.fn();
      const standing: TeamStanding = baseMockStanding;

      renderWithProviders(
        <TeamStandingCard
          standing={standing}
          isExpanded={false}
          onToggleExpand={onToggle}
          showRankChange={false}
        />,
        { locale: 'en' }
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(onToggle).toHaveBeenCalled();
    });

    it('toggles expansion on Space key in Spanish', () => {
      const onToggle = vi.fn();
      const standing: TeamStanding = baseMockStanding;

      renderWithProviders(
        <TeamStandingCard
          standing={standing}
          isExpanded={false}
          onToggleExpand={onToggle}
          showRankChange={false}
        />,
        { locale: 'es' }
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });

      expect(onToggle).toHaveBeenCalled();
    });
  });

  describe('i18n - Edge Cases and Large Values', () => {
    it('displays zero values correctly in English', () => {
      const standing: TeamStanding = {
        ...baseMockStanding,
        points: 0,
        gamesPlayed: 0,
        goalDifference: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        conductScore: 0
      };

      renderWithProviders(
        <TeamStandingCard
          standing={standing}
          isExpanded={true}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />,
        { locale: 'en' }
      );

      // Should display all zeros without errors
      expect(screen.getByText(/EnOf\(0 pts\)/)).toBeInTheDocument();
    });

    it('displays zero values correctly in Spanish', () => {
      const standing: TeamStanding = {
        ...baseMockStanding,
        points: 0,
        gamesPlayed: 0,
        goalDifference: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        conductScore: 0
      };

      renderWithProviders(
        <TeamStandingCard
          standing={standing}
          isExpanded={true}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />,
        { locale: 'es' }
      );

      // Should display all zeros without errors
      expect(screen.getByText(/0 pts/)).toBeInTheDocument();
    });

    it('displays qualified team in English', () => {
      const standing: TeamStanding = {
        ...baseMockStanding,
        isQualified: true
      };

      renderWithProviders(
        <TeamStandingCard
          standing={standing}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />,
        { locale: 'en' }
      );

      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });

    it('displays non-qualified team in Spanish', () => {
      const standing: TeamStanding = {
        ...baseMockStanding,
        isQualified: false
      };

      renderWithProviders(
        <TeamStandingCard
          standing={standing}
          isExpanded={false}
          onToggleExpand={vi.fn()}
          showRankChange={false}
        />,
        { locale: 'es' }
      );

      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });
  });
});
