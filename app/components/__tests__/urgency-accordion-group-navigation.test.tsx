import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UrgencyAccordionGroup } from '../urgency-accordion-group';
import * as nextNavigation from 'next/navigation';
import * as nextIntl from 'next-intl';
import { testFactories } from '@/__tests__/db/test-factories';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => 'en')
}));

// Mock countdown context
vi.mock('../context-providers/countdown-context-provider', () => ({
  useCountdownContext: vi.fn(() => ({
    currentTime: Date.now()
  }))
}));

describe('UrgencyAccordionGroup Navigation', () => {
  let mockPush: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPush = vi.fn();
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn()
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
  });

  it('should navigate to tournament page with edit parameter when edit button clicked', () => {
    const now = Date.now();
    const urgentGame = testFactories.game({
      id: 'game-123',
      tournament_id: 'tournament-456',
      game_date: new Date(now + 30 * 60 * 1000) // 30 minutes from now (< 2 hours)
    });

    const teamsMap = {
      [urgentGame.home_team!]: testFactories.team({ id: urgentGame.home_team! }),
      [urgentGame.away_team!]: testFactories.team({ id: urgentGame.away_team! })
    };

    render(
      <UrgencyAccordionGroup
        games={[urgentGame]}
        teamsMap={teamsMap}
        gameGuesses={{}}
        tournamentId="tournament-456"
        isPlayoffs={false}
      />
    );

    // Find and click the edit button
    const editButton = screen.getByLabelText('game.editPrediction');
    editButton.click();

    // Verify router.push was called with correct URL (games page, not hub page)
    expect(mockPush).toHaveBeenCalledWith('/en/tournaments/tournament-456/games?edit=game-123');
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('should include locale in navigation URL', () => {
    // Mock Spanish locale
    vi.mocked(nextIntl.useLocale).mockReturnValue('es');

    const now = Date.now();
    const urgentGame = testFactories.game({
      id: 'game-789',
      tournament_id: 'tournament-456',
      game_date: new Date(now + 30 * 60 * 1000)
    });

    const teamsMap = {
      [urgentGame.home_team!]: testFactories.team({ id: urgentGame.home_team! }),
      [urgentGame.away_team!]: testFactories.team({ id: urgentGame.away_team! })
    };

    render(
      <UrgencyAccordionGroup
        games={[urgentGame]}
        teamsMap={teamsMap}
        gameGuesses={{}}
        tournamentId="tournament-456"
        isPlayoffs={false}
      />
    );

    // Find and click the edit button
    const editButton = screen.getByLabelText('game.editPrediction');
    editButton.click();

    // Verify Spanish locale is used and routes to games page
    expect(mockPush).toHaveBeenCalledWith('/es/tournaments/tournament-456/games?edit=game-789');
  });

  it('should not render GameResultEditDialog', () => {
    const now = Date.now();
    const urgentGame = testFactories.game({
      id: 'game-123',
      tournament_id: 'tournament-456',
      game_date: new Date(now + 30 * 60 * 1000)
    });

    const teamsMap = {
      [urgentGame.home_team!]: testFactories.team({ id: urgentGame.home_team! }),
      [urgentGame.away_team!]: testFactories.team({ id: urgentGame.away_team! })
    };

    const { container } = render(
      <UrgencyAccordionGroup
        games={[urgentGame]}
        teamsMap={teamsMap}
        gameGuesses={{}}
        tournamentId="tournament-456"
        isPlayoffs={false}
      />
    );

    // Verify dialog is not in the DOM
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(screen.queryByText(/edit game/i)).toBeNull();
  });
});
