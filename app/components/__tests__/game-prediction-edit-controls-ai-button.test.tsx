import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import GamePredictionEditControls from '../game-prediction-edit-controls';

vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useTranslations: () => {
      const t = (key: string) => key;
      return t;
    },
  };
});

const defaultProps = {
  gameId: 'game-1',
  homeTeamName: 'Team A',
  awayTeamName: 'Team B',
  isPlayoffGame: false,
  onHomeScoreChange: vi.fn(),
  onAwayScoreChange: vi.fn(),
  onHomePenaltyWinnerChange: vi.fn(),
  onAwayPenaltyWinnerChange: vi.fn(),
  onBoostTypeChange: vi.fn(),
};

describe('GamePredictionEditControls — AI auto-fill button', () => {
  it('renders AI button when onAIGenerateClick is provided', () => {
    renderWithProviders(
      <GamePredictionEditControls {...defaultProps} onAIGenerateClick={vi.fn()} />,
      { guessesContext: true }
    );
    expect(screen.getByRole('button', { name: 'aiGenerate.tooltipSingle' })).toBeInTheDocument();
  });

  it('does not render AI button when onAIGenerateClick is not provided', () => {
    renderWithProviders(
      <GamePredictionEditControls {...defaultProps} />,
      { guessesContext: true }
    );
    expect(screen.queryByRole('button', { name: 'aiGenerate.tooltipSingle' })).not.toBeInTheDocument();
  });

  it('calls onAIGenerateClick when button is clicked', async () => {
    const user = userEvent.setup();
    const onAIGenerateClick = vi.fn();
    renderWithProviders(
      <GamePredictionEditControls {...defaultProps} onAIGenerateClick={onAIGenerateClick} />,
      { guessesContext: true }
    );
    await user.click(screen.getByRole('button', { name: 'aiGenerate.tooltipSingle' }));
    expect(onAIGenerateClick).toHaveBeenCalledTimes(1);
  });

  it('button aria-label equals tooltip title (aiGenerate.tooltipSingle)', () => {
    renderWithProviders(
      <GamePredictionEditControls {...defaultProps} onAIGenerateClick={vi.fn()} />,
      { guessesContext: true }
    );
    const btn = screen.getByRole('button', { name: 'aiGenerate.tooltipSingle' });
    expect(btn).toHaveAttribute('aria-label', 'aiGenerate.tooltipSingle');
  });
});
