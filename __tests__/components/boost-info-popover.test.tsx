import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material';
import BoostInfoPopover from '../../app/components/boost-info-popover';

// Mock the server action
vi.mock('../../app/actions/game-boost-actions', () => ({
  getBoostAllocationBreakdownAction: vi.fn(),
}));

import { getBoostAllocationBreakdownAction } from '../../app/actions/game-boost-actions';

const mockGetBoostAllocationBreakdownAction = vi.mocked(getBoostAllocationBreakdownAction);

// Create test theme
const testTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Wrapper component for theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={testTheme}>
      {component}
    </ThemeProvider>
  );
};

// Mock anchor element for popover positioning
const mockAnchorEl = document.createElement('div');

describe('BoostInfoPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header and Description', () => {
    it('renders silver boost header and description', () => {
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
          totalGames={20}
          predictedGames={15}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      expect(screen.getByText(/Multiplicador x2/i)).toBeInTheDocument();
      expect(screen.getByText(/Duplica los puntos obtenidos/i)).toBeInTheDocument();
    });

    it('renders golden boost header and description', () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [],
        playoffCount: 0,
        totalBoosts: 0,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });

      renderWithTheme(
        <BoostInfoPopover
          boostType="golden"
          used={1}
          max={2}
          tournamentId="tournament-1"
          totalGames={20}
          predictedGames={15}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      expect(screen.getByText(/Multiplicador x3/i)).toBeInTheDocument();
      expect(screen.getByText(/Triplica los puntos obtenidos/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator while fetching data', async () => {
      mockGetBoostAllocationBreakdownAction.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={2}
          max={5}
          tournamentId="tournament-1"
          totalGames={20}
          predictedGames={15}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

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
          totalGames={20}
          predictedGames={15}
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

      renderWithTheme(
        <BoostInfoPopover
          boostType="golden"
          used={2}
          max={2}
          tournamentId="tournament-1"
          totalGames={20}
          predictedGames={15}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

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

      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={0}
          max={5}
          tournamentId="tournament-1"
          totalGames={20}
          predictedGames={15}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

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
          totalGames={20}
          predictedGames={15}
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
          totalGames={20}
          predictedGames={15}
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
          totalGames={20}
          predictedGames={15}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      expect(screen.getByText(/Información no disponible/i)).toBeInTheDocument();
    });
  });

  describe('Risk Warning Section', () => {
    it('shows risk warning when unused boosts > games left', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [],
        playoffCount: 0,
        totalBoosts: 0,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });

      // used=2, max=5, unused=3
      // totalGames=20, predictedGames=18, gamesLeft=2
      // 3 > 0 AND 2 < (3 + 3) = true
      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={2}
          max={5}
          tournamentId="tournament-1"
          totalGames={20}
          predictedGames={18}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/ALERTA DE RIESGO/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Tienes 3 boosts sin usar/i)).toBeInTheDocument();
      expect(screen.getByText(/quedan 2 partidos/i)).toBeInTheDocument();
    });

    it('hides risk warning when no risk', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [],
        playoffCount: 0,
        totalBoosts: 0,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });

      // used=2, max=5, unused=3
      // totalGames=20, predictedGames=10, gamesLeft=10
      // 3 > 0 AND 10 < (3 + 3) = false
      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={2}
          max={5}
          tournamentId="tournament-1"
          totalGames={20}
          predictedGames={10}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText(/ALERTA DE RIESGO/i)).not.toBeInTheDocument();
      });
    });

    it('hides risk warning when all boosts used', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [{ groupLetter: 'A', count: 5 }],
        playoffCount: 0,
        totalBoosts: 5,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });

      // used=5, max=5, unused=0
      // 0 > 0 = false, so no warning
      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={5}
          max={5}
          tournamentId="tournament-1"
          totalGames={20}
          predictedGames={18}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText(/ALERTA DE RIESGO/i)).not.toBeInTheDocument();
      });
    });

    it('handles singular boost correctly in warning', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [],
        playoffCount: 0,
        totalBoosts: 0,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });

      // used=1, max=2, unused=1
      // totalGames=10, predictedGames=9, gamesLeft=1
      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={1}
          max={2}
          tournamentId="tournament-1"
          totalGames={10}
          predictedGames={9}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Tienes 1 boost sin usar/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/queda 1 partido/i)).toBeInTheDocument();
    });

    it('handles zero games left correctly', async () => {
      mockGetBoostAllocationBreakdownAction.mockResolvedValue({
        byGroup: [],
        playoffCount: 0,
        totalBoosts: 0,
        scoredGamesCount: 0,
        totalPointsEarned: 0,
      });

      // used=2, max=5, unused=3
      // totalGames=20, predictedGames=20, gamesLeft=0
      renderWithTheme(
        <BoostInfoPopover
          boostType="silver"
          used={2}
          max={5}
          tournamentId="tournament-1"
          totalGames={20}
          predictedGames={20}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/no quedan/i)).toBeInTheDocument();
      });
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
          totalGames={20}
          predictedGames={15}
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
          totalGames={20}
          predictedGames={15}
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
          totalGames={20}
          predictedGames={15}
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
          totalGames={20}
          predictedGames={20}
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
          totalGames={20}
          predictedGames={18}
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

      // Risk warning (2 unused, 2 games left, 2 < 2 + 3 = true)
      expect(screen.getByText(/ALERTA DE RIESGO/i)).toBeInTheDocument();

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
          totalGames={20}
          predictedGames={15}
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
          totalGames={20}
          predictedGames={15}
          open={true}
          anchorEl={mockAnchorEl}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(mockGetBoostAllocationBreakdownAction).toHaveBeenCalledWith('tournament-1', 'silver');
      });
    });
  });
});
