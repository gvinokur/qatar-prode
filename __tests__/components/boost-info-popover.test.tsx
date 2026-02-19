import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BoostInfoPopover from '../../app/components/boost-info-popover';
import { renderWithTheme } from '../utils/test-utils';

// Mock the server action
vi.mock('../../app/actions/game-boost-actions', () => ({
  getBoostAllocationBreakdownAction: vi.fn(),
}));

import { getBoostAllocationBreakdownAction } from '../../app/actions/game-boost-actions';

const mockGetBoostAllocationBreakdownAction = vi.mocked(getBoostAllocationBreakdownAction);

// Mock anchor element for popover positioning
const mockAnchorEl = document.createElement('div');

// Helper to render popover with default props
const renderPopover = (overrides?: Partial<React.ComponentProps<typeof BoostInfoPopover>>) => {
  const defaultProps: React.ComponentProps<typeof BoostInfoPopover> = {
    boostType: 'silver',
    used: 2,
    max: 5,
    tournamentId: 'tournament-1',
    open: true,
    anchorEl: mockAnchorEl,
    onClose: () => {},
    ...overrides,
  };
  return renderWithTheme(<BoostInfoPopover {...defaultProps} />);
};

describe('BoostInfoPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header and Description', () => {
    const emptyBreakdown = {
      byGroup: [],
      playoffCount: 0,
      totalBoosts: 0,
      scoredGamesCount: 0,
      totalPointsEarned: 0,
    };

    it('renders silver boost header and description', () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue(emptyBreakdown);
      renderPopover();

      expect(screen.getByText(/Multiplicador x2/i)).toBeInTheDocument();
      expect(screen.getByText(/Duplica los puntos obtenidos/i)).toBeInTheDocument();
    });

    it('renders golden boost header and description', () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue(emptyBreakdown);
      renderPopover({ boostType: 'golden', used: 1, max: 2 });

      expect(screen.getByText(/Multiplicador x3/i)).toBeInTheDocument();
      expect(screen.getByText(/Triplica los puntos obtenidos/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator while fetching data', async () => {
      mockGetBoostAllocationBreakdownAction.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderPopover();

      expect(screen.getByText(/Cargando.../i)).toBeInTheDocument();
    });
  });

  describe('Distribution Section', () => {
    it('renders group breakdown correctly', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [
          { groupLetter: 'A', count: 2 },
          { groupLetter: 'B', count: 1 },
        ],
        playoffCount: 0,
        totalBoosts: 3,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });

      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={3}
          max={5}
          tournamentId="tournament-1"
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Grupo A: 2 partidos/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Grupo B: 1 partido/i)).toBeInTheDocument();
      expect(screen.getByText(/Total: 3 de 5 usados/i)).toBeInTheDocument();
    });

    it('renders playoff boosts correctly', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [],
        playoffCount: 2,
        totalBoosts: 2,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });

      renderPopover({ boostType: 'golden', used: 2, max: 2 });

      await waitFor(() => {
        expect(screen.getByText(/Playoffs: 2 partidos/i)).toBeInTheDocument();
      });
    });

    it('shows message when no boosts allocated', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [],
        playoffCount: 0,
        totalBoosts: 0,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });

      renderPopover({ used: 0 });

      await waitFor(() => {
        expect(screen.getByText(/Aún no has usado boosts de este tipo/i)).toBeInTheDocument();
      });
    });

    it('handles singular partido correctly', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [{ groupLetter: 'A', count: 1 }],
        playoffCount: 1,
        totalBoosts: 2,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });

      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={2}
          max={5}
          tournamentId="tournament-1"
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Grupo A: 1 partido/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Playoffs: 1 partido/i)).toBeInTheDocument();
    });

    it('shows error message on fetch failure', async () => {
      mockGetBoostAllocationBreakdownAction.mockRejectedValue(new Error('Network error'));

      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={2}
          max={5}
          tournamentId="tournament-1"
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Error al cargar datos/i)).toBeInTheDocument();
      });
    });

    it('shows error when tournamentId is missing', () => {
      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={2}
          max={5}
          tournamentId={undefined}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      expect(screen.getByText(/Información no disponible/i)).toBeInTheDocument();
    });
  });

  describe('Performance Section', () => {
    it('shows performance section when scored games exist', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [{ groupLetter: 'A', count: 3 }],
        playoffCount: 0,
        totalBoosts: 3,
        scoredGamesCount: 2,
        totalPointsEarned: 5,
      });

      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={3}
          max={5}
          tournamentId="tournament-1"
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/RENDIMIENTO/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Ganaste 5 puntos extra/i)).toBeInTheDocument();
      expect(screen.getByText(/2 partidos boosteados calificados/i)).toBeInTheDocument();
    });

    it('hides performance section when no scored games', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [{ groupLetter: 'A', count: 2 }],
        playoffCount: 0,
        totalBoosts: 2,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });

      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={2}
          max={5}
          tournamentId="tournament-1"
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText(/RENDIMIENTO/i)).not.toBeInTheDocument();
      });
    });

    it('handles singular punto extra correctly', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [{ groupLetter: 'A', count: 1 }],
        playoffCount: 0,
        totalBoosts: 1,
        scoredGamesCount: 1,
        totalPointsEarned: 1,
      });

      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={1}
          max={5}
          tournamentId="tournament-1"
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Ganaste 1 punto extra/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/1 partido boosteado calificado/i)).toBeInTheDocument();
    });

    it('handles large performance numbers', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [
          { groupLetter: 'A', count: 5 },
          { groupLetter: 'B', count: 5 },
        ],
        playoffCount: 5,
        totalBoosts: 15,
        scoredGamesCount: 15,
        totalPointsEarned: 30,
      });

      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={15}
          max={15}
          tournamentId="tournament-1"
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Ganaste 30 puntos extra/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/15 partidos boosteados calificados/i)).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('renders all sections together correctly', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [{ groupLetter: 'A', count: 2 }],
        playoffCount: 1,
        totalBoosts: 3,
        scoredGamesCount: 2,
        totalPointsEarned: 4,
      });

      renderWithTheme(
        <BoostInfoPopover
          boostType="golden"
          used={3}
          max={5}
          tournamentId="tournament-1"
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      // Header
      expect(screen.getByText(/Multiplicador x3/i)).toBeInTheDocument();

      // Distribution section
      await waitFor(() => {
        expect(screen.getByText(/Grupo A: 2 partidos/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Playoffs: 1 partido/i)).toBeInTheDocument();

      // Performance
      expect(screen.getByText(/RENDIMIENTO/i)).toBeInTheDocument();
      expect(screen.getByText(/Ganaste 4 puntos extra/i)).toBeInTheDocument();
    });

    it('does not fetch data when popover is closed', () => {
      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={2}
          max={5}
          tournamentId="tournament-1"
          open={false}
          anchorEl={null}
          onClose={() => {}}
        />
      );

      expect(mockGetBoostAllocationBreakdownAction).not.toHaveBeenCalled();
    });

    it('fetches data when popover opens', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [],
        playoffCount: 0,
        totalBoosts: 0,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });

      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={2}
          max={5}
          tournamentId="tournament-1"
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(mockGetBoostAllocationBreakdownAction).toHaveBeenCalledWith('tournament-1', 'silver', 'es');
      });
    });
  });
});
