import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingDialog from '@/app/components/onboarding/onboarding-dialog';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { testFactories } from '@/__tests__/db/test-factories';
import { markOnboardingComplete, skipOnboardingFlow, saveOnboardingStep } from '@/app/actions/onboarding-actions';
import { createMockTranslations } from '@/__tests__/utils/mock-translations';
import * as intl from 'next-intl';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => 'es')
}))

// Mock server actions
vi.mock('@/app/actions/onboarding-actions', () => ({
  markOnboardingComplete: vi.fn().mockResolvedValue(undefined),
  skipOnboardingFlow: vi.fn().mockResolvedValue(undefined),
  saveOnboardingStep: vi.fn().mockResolvedValue(undefined)
}));

// Mock onboarding steps
vi.mock('@/app/components/onboarding/onboarding-steps', () => ({
  WelcomeStep: () => <div data-testid="welcome-step">Welcome Step</div>,
  GamePredictionStep: () => <div data-testid="game-prediction-step">Game Prediction Step</div>,
  QualifiedTeamsPredictionStep: () => <div data-testid="qualified-teams-step">Qualified Teams Step</div>,
  TournamentAwardsStep: () => <div data-testid="tournament-awards-step">Tournament Awards Step</div>,
  ScoringExplanationStep: ({ tournament }: any) => (
    <div data-testid="scoring-explanation-step">
      <div data-testid="scoring-tournament">{tournament ? tournament.id : 'no-tournament'}</div>
    </div>
  ),
  BoostIntroductionStep: ({ tournament }: any) => (
    <div data-testid="boost-introduction-step">
      <div data-testid="boost-tournament">{tournament ? tournament.id : 'no-tournament'}</div>
    </div>
  ),
  ChecklistStep: ({ onComplete }: any) => (
    <div data-testid="checklist-step">
      <button onClick={onComplete}>Complete Checklist</button>
    </div>
  )
}));

// Mock OnboardingProgress component
vi.mock('@/app/components/onboarding/onboarding-progress', () => ({
  __esModule: true,
  default: ({ currentStep, totalSteps, includeBoosts }: any) => (
    <div data-testid="onboarding-progress" data-include-boosts={includeBoosts}>
      {currentStep + 1}/{totalSteps}
    </div>
  )
}));

describe('OnboardingDialog', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('onboarding.dialog')
    )
  });

  describe('Step Order - Boosts Enabled', () => {
    it('includes boost step when tournament has silver boosts', () => {
      const tournament = testFactories.tournament({
        id: 'tournament-1',
        max_silver_games: 5,
        max_golden_games: 0
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Should show 7 total steps (welcome, game-prediction, qualified-teams, tournament-awards, scoring, boost, checklist)
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('1/7');
      expect(screen.getByTestId('onboarding-progress')).toHaveAttribute('data-include-boosts', 'true');
    });

    it('includes boost step when tournament has golden boosts', () => {
      const tournament = testFactories.tournament({
        id: 'tournament-1',
        max_silver_games: 0,
        max_golden_games: 3
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Should show 7 total steps
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('1/7');
      expect(screen.getByTestId('onboarding-progress')).toHaveAttribute('data-include-boosts', 'true');
    });

    it('includes boost step when tournament has both boost types', () => {
      const tournament = testFactories.tournament({
        id: 'tournament-1',
        max_silver_games: 5,
        max_golden_games: 3
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Should show 7 total steps
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('1/7');
      expect(screen.getByTestId('onboarding-progress')).toHaveAttribute('data-include-boosts', 'true');
    });

    it('navigates through all steps including boost when boosts enabled', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament({
        id: 'tournament-1',
        max_silver_games: 5,
        max_golden_games: 3
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Step 1: Welcome
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();

      // Next to Step 2: Game Prediction
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('game-prediction-step')).toBeInTheDocument();

      // Next to Step 3: Qualified Teams
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('qualified-teams-step')).toBeInTheDocument();

      // Next to Step 4: Tournament Awards
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('tournament-awards-step')).toBeInTheDocument();

      // Next to Step 5: Scoring
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('scoring-explanation-step')).toBeInTheDocument();

      // Next to Step 6: Boost (should be included)
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('boost-introduction-step')).toBeInTheDocument();

      // Next to Step 7: Checklist
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('checklist-step')).toBeInTheDocument();
    });
  });

  describe('Step Order - Boosts Disabled', () => {
    it('excludes boost step when tournament has no boosts', () => {
      const tournament = testFactories.tournament({
        id: 'tournament-1',
        max_silver_games: 0,
        max_golden_games: 0
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Should show 6 total steps (welcome, game-prediction, qualified-teams, tournament-awards, scoring, checklist)
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('1/6');
      expect(screen.getByTestId('onboarding-progress')).toHaveAttribute('data-include-boosts', 'false');
    });

    it('excludes boost step when tournament is undefined', () => {
      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={undefined} />
      );

      // Should show 6 total steps (no boost step)
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('1/6');
      expect(screen.getByTestId('onboarding-progress')).toHaveAttribute('data-include-boosts', 'false');
    });

    it('excludes boost step when max_silver_games is null', () => {
      const tournament = testFactories.tournament({
        id: 'tournament-1',
        max_silver_games: null as any,
        max_golden_games: null as any
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Should show 6 total steps
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('1/6');
      expect(screen.getByTestId('onboarding-progress')).toHaveAttribute('data-include-boosts', 'false');
    });

    it('navigates through all steps excluding boost when boosts disabled', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament({
        id: 'tournament-1',
        max_silver_games: 0,
        max_golden_games: 0
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Step 1: Welcome
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();

      // Next to Step 2: Game Prediction
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('game-prediction-step')).toBeInTheDocument();

      // Next to Step 3: Qualified Teams
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('qualified-teams-step')).toBeInTheDocument();

      // Next to Step 4: Tournament Awards
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('tournament-awards-step')).toBeInTheDocument();

      // Next to Step 5: Scoring
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('scoring-explanation-step')).toBeInTheDocument();

      // Next to Step 6: Checklist (boost step is skipped)
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('checklist-step')).toBeInTheDocument();

      // Verify boost step was never shown
      expect(screen.queryByTestId('boost-introduction-step')).not.toBeInTheDocument();
    });
  });

  describe('Tournament Prop Passing', () => {
    it('passes tournament prop to ScoringExplanationStep', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament({
        id: 'test-tournament-123',
        short_name: 'TEST',
        game_exact_score_points: 10
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Navigate to scoring step
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to game prediction
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to qualified teams
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to tournament awards
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to scoring

      expect(screen.getByTestId('scoring-explanation-step')).toBeInTheDocument();
      expect(screen.getByTestId('scoring-tournament')).toHaveTextContent('test-tournament-123');
    });

    it('passes tournament prop to BoostIntroductionStep', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament({
        id: 'boost-tournament-456',
        max_silver_games: 5,
        max_golden_games: 3
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Navigate to boost step
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to game prediction
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to qualified teams
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to tournament awards
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to scoring
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to boost

      expect(screen.getByTestId('boost-introduction-step')).toBeInTheDocument();
      expect(screen.getByTestId('boost-tournament')).toHaveTextContent('boost-tournament-456');
    });

    it('passes undefined tournament to ScoringExplanationStep when no tournament provided', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={undefined} />
      );

      // Navigate to scoring step
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to game prediction
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to qualified teams
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to tournament awards
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to scoring

      expect(screen.getByTestId('scoring-tournament')).toHaveTextContent('no-tournament');
    });

    it('handles tournament with all point values correctly', () => {
      const tournament = testFactories.tournament({
        id: 'full-config-tournament',
        game_exact_score_points: 15,
        game_correct_outcome_points: 7,
        champion_points: 20,
        runner_up_points: 12,
        third_place_points: 8,
        max_silver_games: 10,
        max_golden_games: 5
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Verify dialog renders without errors with full tournament config
      expect(screen.getByTestId('onboarding-progress')).toBeInTheDocument();
    });
  });

  describe('Dialog State and Interactions', () => {
    it('renders dialog when open is true', () => {
      const tournament = testFactories.tournament();

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render dialog content when open is false', () => {
      const tournament = testFactories.tournament();

      renderWithTheme(
        <OnboardingDialog open={false} onClose={mockOnClose} tournament={tournament} />
      );

      // Dialog should not be visible
      expect(screen.queryByTestId('welcome-step')).not.toBeInTheDocument();
    });

    it('calls skipOnboardingFlow when skip button clicked', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament();

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      await user.click(screen.getByRole('button', { name: /\[skipButton\]/i }));

      await waitFor(() => {
        expect(skipOnboardingFlow).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('saves step progress when navigating forward', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament();

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));

      await waitFor(() => {
        expect(saveOnboardingStep).toHaveBeenCalledWith(1);
      });
    });

    it('calls markOnboardingComplete when finishing last step', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament({
        max_silver_games: 0,
        max_golden_games: 0
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Navigate through all steps to checklist
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to game prediction
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to qualified teams
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to tournament awards
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to scoring
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to checklist

      // Complete checklist by clicking the button from ChecklistStep mock
      await user.click(screen.getByText('Complete Checklist'));

      await waitFor(() => {
        expect(markOnboardingComplete).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('disables buttons while submitting', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament();

      // Make skipOnboardingFlow delay to see submitting state
      (skipOnboardingFlow as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      const skipButton = screen.getByRole('button', { name: /\[skipButton\]/i });
      const nextButton = screen.getByRole('button', { name: /\[nextButton\]/i });

      await user.click(skipButton);

      // Buttons should be disabled during submission
      expect(skipButton).toBeDisabled();
      expect(nextButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('shows back button only after first step', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament();

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Back button should not be visible on first step
      expect(screen.queryByRole('button', { name: /\[backButton\]/i })).not.toBeInTheDocument();

      // Navigate to second step
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));

      // Back button should now be visible
      expect(screen.getByRole('button', { name: /\[backButton\]/i })).toBeInTheDocument();
    });

    it('navigates backwards when back button clicked', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament();

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Go to second step
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('game-prediction-step')).toBeInTheDocument();

      // Go back
      await user.click(screen.getByRole('button', { name: /\[backButton\]/i }));
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
    });

    it('shows "Siguiente" button on last step before checklist', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament({
        max_silver_games: 0,
        max_golden_games: 0
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Navigate to scoring (last step before checklist)
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to game prediction
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to qualified teams
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to tournament awards
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to scoring

      // Button should say "Siguiente" (checklist is ahead)
      expect(screen.getByRole('button', { name: /\[nextButton\]/i })).toBeInTheDocument();
    });

    it('hides navigation buttons on checklist step', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament({
        max_silver_games: 0,
        max_golden_games: 0
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Navigate to checklist
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to game prediction
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to qualified teams
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to tournament awards
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to scoring
      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i })); // to checklist

      // Next/Finish button should not be visible on checklist
      expect(screen.queryByRole('button', { name: /\[nextButton\]/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /\[finishButton\]/i })).not.toBeInTheDocument();

      // Back button should not be visible on checklist
      expect(screen.queryByRole('button', { name: /\[backButton\]/i })).not.toBeInTheDocument();
    });
  });

  describe('Progress Tracking', () => {
    it('updates progress indicator as user advances through steps', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament({
        max_silver_games: 0,
        max_golden_games: 0
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Step 1/6
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('1/6');

      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      // Step 2/6
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('2/6');

      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      // Step 3/6
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('3/6');

      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      // Step 4/6
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('4/6');

      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      // Step 5/6
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('5/6');

      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      // Step 6/6
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('6/6');
    });

    it('progress reflects correct total when boost step included', async () => {
      const user = userEvent.setup();
      const tournament = testFactories.tournament({
        max_silver_games: 5,
        max_golden_games: 3
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Should show 7 total steps
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('1/7');

      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('2/7');

      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('3/7');

      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('4/7');

      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('5/7');

      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('6/7');

      await user.click(screen.getByRole('button', { name: /\[nextButton\]/i }));
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('7/7');
    });
  });

  describe('Edge Cases', () => {
    it('handles tournament with only partial boost configuration', () => {
      const tournament = testFactories.tournament({
        id: 'partial-boost',
        max_silver_games: undefined as any,
        max_golden_games: 3
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Should include boost step because golden boosts exist
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('1/7');
      expect(screen.getByTestId('onboarding-progress')).toHaveAttribute('data-include-boosts', 'true');
    });

    it('recalculates step order when tournament prop changes', () => {
      const tournamentWithBoosts = testFactories.tournament({
        max_silver_games: 5,
        max_golden_games: 3
      });

      const { rerenderWithTheme } = renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournamentWithBoosts} />
      );

      // Initially 7 steps (with boost)
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('1/7');

      // Update to tournament without boosts
      const tournamentWithoutBoosts = testFactories.tournament({
        max_silver_games: 0,
        max_golden_games: 0
      });

      rerenderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournamentWithoutBoosts} />
      );

      // Should now be 6 steps (without boost)
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('1/6');
    });

    it('maintains state when dialog is reopened', () => {
      const tournament = testFactories.tournament();

      const { rerenderWithTheme } = renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      // Close dialog
      rerenderWithTheme(
        <OnboardingDialog open={false} onClose={mockOnClose} tournament={tournament} />
      );

      // Reopen dialog - should start at first step
      rerenderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
      expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('1/');
    });
  });

  describe('OnboardingProgress Props', () => {
    it('passes includeBoosts prop correctly when boosts are enabled', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 5,
        max_golden_games: 3
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      const progressElement = screen.getByTestId('onboarding-progress');
      expect(progressElement).toHaveAttribute('data-include-boosts', 'true');
    });

    it('passes includeBoosts prop correctly when boosts are disabled', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 0,
        max_golden_games: 0
      });

      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={tournament} />
      );

      const progressElement = screen.getByTestId('onboarding-progress');
      expect(progressElement).toHaveAttribute('data-include-boosts', 'false');
    });

    it('passes includeBoosts as false when tournament is undefined', () => {
      renderWithTheme(
        <OnboardingDialog open={true} onClose={mockOnClose} tournament={undefined} />
      );

      const progressElement = screen.getByTestId('onboarding-progress');
      expect(progressElement).toHaveAttribute('data-include-boosts', 'false');
    });
  });
});
