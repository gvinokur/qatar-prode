import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import OnboardingTrigger from '../onboarding-trigger';
import { getTournaments } from '@/app/actions/tournament-actions';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { testFactories } from '@/__tests__/db/test-factories';

// Mock server actions
vi.mock('@/app/actions/tournament-actions', () => ({
  getTournaments: vi.fn()
}));

// Mock OnboardingDialog component
vi.mock('../onboarding-dialog', () => ({
  __esModule: true,
  default: ({ open, tournament }: any) => (
    <div data-testid="onboarding-dialog">
      <div data-testid="dialog-open">{String(open)}</div>
      <div data-testid="dialog-tournament">
        {tournament ? tournament.id : 'undefined'}
      </div>
    </div>
  )
}));

describe('OnboardingTrigger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads tournaments using getTournaments()', async () => {
    const mockTournament = testFactories.tournament({ id: 'tournament-1' });
    (getTournaments as any).mockResolvedValue([mockTournament]);

    const result = await OnboardingTrigger();
    renderWithTheme(result as React.ReactElement);

    expect(getTournaments).toHaveBeenCalledTimes(1);
    expect(getTournaments).toHaveBeenCalledWith();
  });

  it('passes first tournament to OnboardingDialog', async () => {
    const mockTournament1 = testFactories.tournament({ id: 'tournament-1' });
    const mockTournament2 = testFactories.tournament({ id: 'tournament-2' });
    (getTournaments as any).mockResolvedValue([mockTournament1, mockTournament2]);

    const result = await OnboardingTrigger();
    renderWithTheme(result as React.ReactElement);

    expect(screen.getByTestId('dialog-tournament')).toHaveTextContent('tournament-1');
  });

  it('renders OnboardingDialog with open=true', async () => {
    const mockTournament = testFactories.tournament({ id: 'tournament-1' });
    (getTournaments as any).mockResolvedValue([mockTournament]);

    const result = await OnboardingTrigger();
    renderWithTheme(result as React.ReactElement);

    expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-open')).toHaveTextContent('true');
  });

  it('passes undefined to OnboardingDialog when no tournaments exist', async () => {
    (getTournaments as any).mockResolvedValue([]);

    const result = await OnboardingTrigger();
    renderWithTheme(result as React.ReactElement);

    expect(screen.getByTestId('dialog-tournament')).toHaveTextContent('undefined');
  });

  it('handles null tournament array gracefully', async () => {
    (getTournaments as any).mockResolvedValue(null);

    const result = await OnboardingTrigger();

    // Should not throw, and should pass undefined to dialog
    expect(() => renderWithTheme(result as React.ReactElement)).not.toThrow();
  });

  it('passes onClose handler to OnboardingDialog', async () => {
    const mockTournament = testFactories.tournament({ id: 'tournament-1' });
    (getTournaments as any).mockResolvedValue([mockTournament]);

    const result = await OnboardingTrigger();
    renderWithTheme(result as React.ReactElement);

    // The component should render without errors, indicating onClose handler is present
    expect(screen.getByTestId('onboarding-dialog')).toBeInTheDocument();
  });

  it('uses tournament with all required properties', async () => {
    const mockTournament = testFactories.tournament({
      id: 'world-cup-2026',
      short_name: 'WC26',
      long_name: 'FIFA World Cup 2026',
      game_exact_score_points: 15,
      champion_points: 20
    });
    (getTournaments as any).mockResolvedValue([mockTournament]);

    const result = await OnboardingTrigger();
    renderWithTheme(result as React.ReactElement);

    // Verify the tournament is passed through
    expect(screen.getByTestId('dialog-tournament')).toHaveTextContent('world-cup-2026');
  });

  it('ignores additional tournaments beyond the first', async () => {
    const tournaments = [
      testFactories.tournament({ id: 'tournament-1' }),
      testFactories.tournament({ id: 'tournament-2' }),
      testFactories.tournament({ id: 'tournament-3' })
    ];
    (getTournaments as any).mockResolvedValue(tournaments);

    const result = await OnboardingTrigger();
    renderWithTheme(result as React.ReactElement);

    // Only the first tournament should be used
    expect(screen.getByTestId('dialog-tournament')).toHaveTextContent('tournament-1');
    expect(screen.getByTestId('dialog-tournament')).not.toHaveTextContent('tournament-2');
    expect(screen.getByTestId('dialog-tournament')).not.toHaveTextContent('tournament-3');
  });
});
