import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import QuickScoreWizardDialog from '../../../app/components/header/quick-score-wizard-dialog';
import { testFactories } from '../../db/test-factories';

// Mock server actions
vi.mock('../../../app/actions/backoffice-actions', () => ({
  getRecentUnscoredGames: vi.fn(),
  saveAndPublishSingleGameResult: vi.fn(),
}));

// Mock BackofficeGameResultEditControls
vi.mock('../../../app/components/backoffice/backoffice-game-result-edit-controls', () => ({
  default: ({ homeTeamName, awayTeamName, error, onSave, onCancel, loading }: any) => (
    <div data-testid="score-controls">
      <span data-testid="home-team">{homeTeamName}</span>
      <span data-testid="away-team">{awayTeamName}</span>
      {error && <span data-testid="save-error">{error}</span>}
      <button data-testid="save-btn" onClick={onSave} disabled={loading}>Guardar</button>
      <button data-testid="cancel-btn" onClick={onCancel} disabled={loading}>Cancelar</button>
    </div>
  ),
}));

import * as backofficeActions from '../../../app/actions/backoffice-actions';

const mockGetRecentUnscoredGames = vi.mocked(backofficeActions.getRecentUnscoredGames);
const mockSaveAndPublish = vi.mocked(backofficeActions.saveAndPublishSingleGameResult);

function makeGame(id: string) {
  return {
    ...testFactories.game({ id, home_team: 'team-1', away_team: 'team-2' }),
    group: { tournament_group_id: 'g1', group_letter: 'A' },
    playoffStage: null,
    gameResult: null,
  };
}

const teamsMap = {
  'team-1': testFactories.team({ id: 'team-1', name: 'Spain' }),
  'team-2': testFactories.team({ id: 'team-2', name: 'France' }),
};

describe('QuickScoreWizardDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state immediately on open before server action resolves', async () => {
    // Never resolves
    mockGetRecentUnscoredGames.mockReturnValue(new Promise(() => {}));

    render(<QuickScoreWizardDialog open={true} onClose={vi.fn()} />);

    expect(screen.getByText('Cargando partidos...')).toBeInTheDocument();
  });

  it('renders empty state when getRecentUnscoredGames returns no games', async () => {
    mockGetRecentUnscoredGames.mockResolvedValue({ games: [], teamsMap: {} });

    render(<QuickScoreWizardDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('¡Todo al día!')).toBeInTheDocument();
    });
    expect(screen.getByText('No hay partidos sin resultado en las últimas 24 horas.')).toBeInTheDocument();
  });

  it('renders score controls for first game when games are returned', async () => {
    const games = [makeGame('g1'), makeGame('g2')];
    mockGetRecentUnscoredGames.mockResolvedValue({ games, teamsMap });

    render(<QuickScoreWizardDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('score-controls')).toBeInTheDocument();
    });
  });

  it('renders home and away team names from teamsMap', async () => {
    const games = [makeGame('g1')];
    mockGetRecentUnscoredGames.mockResolvedValue({ games, teamsMap });

    render(<QuickScoreWizardDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('home-team')).toHaveTextContent('Spain');
      expect(screen.getByTestId('away-team')).toHaveTextContent('France');
    });
  });

  it('Skip advances to next game without calling saveAndPublishSingleGameResult', async () => {
    const games = [makeGame('g1'), makeGame('g2')];
    mockGetRecentUnscoredGames.mockResolvedValue({ games, teamsMap });

    render(<QuickScoreWizardDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-btn'));

    expect(mockSaveAndPublish).not.toHaveBeenCalled();
  });

  it('shows completion state after all games are skipped', async () => {
    const games = [makeGame('g1')];
    mockGetRecentUnscoredGames.mockResolvedValue({ games, teamsMap });

    render(<QuickScoreWizardDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cancel-btn'));

    await waitFor(() => {
      expect(screen.getByText('¡Todo al día!')).toBeInTheDocument();
    });
  });

  it('Save & Publish calls saveAndPublishSingleGameResult and advances to next game', async () => {
    const games = [makeGame('g1'), makeGame('g2')];
    mockGetRecentUnscoredGames.mockResolvedValue({ games, teamsMap });
    mockSaveAndPublish.mockResolvedValue(undefined);

    render(<QuickScoreWizardDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('save-btn')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('save-btn'));
    });

    expect(mockSaveAndPublish).toHaveBeenCalledTimes(1);
    // After save, should still show controls (now on game 2)
    await waitFor(() => {
      expect(screen.getByTestId('score-controls')).toBeInTheDocument();
    });
  });

  it('shows error from saveAndPublishSingleGameResult without advancing', async () => {
    const games = [makeGame('g1')];
    mockGetRecentUnscoredGames.mockResolvedValue({ games, teamsMap });
    mockSaveAndPublish.mockRejectedValue(new Error('Cannot publish incomplete result'));

    render(<QuickScoreWizardDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('save-btn')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('save-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('save-error')).toHaveTextContent('Cannot publish incomplete result');
    });
    // Still on same game (score controls still visible)
    expect(screen.getByTestId('score-controls')).toBeInTheDocument();
  });

  it('does not load games when dialog is closed', () => {
    render(<QuickScoreWizardDialog open={false} onClose={vi.fn()} />);

    expect(mockGetRecentUnscoredGames).not.toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked in empty state', async () => {
    const onClose = vi.fn();
    mockGetRecentUnscoredGames.mockResolvedValue({ games: [], teamsMap: {} });

    render(<QuickScoreWizardDialog open={true} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Cerrar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cerrar'));
    expect(onClose).toHaveBeenCalled();
  });
});
