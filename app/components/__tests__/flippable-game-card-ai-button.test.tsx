import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import FlippableGameCard from '../flippable-game-card';
import * as aiPredictionModule from '../../utils/ai-prediction-generator';

// GameView renders GameCountdownDisplay which requires CountdownProvider — stub it out
vi.mock('../game-view', () => ({
  default: () => <div data-testid="game-view-stub" />,
}));
import type { ExtendedGameData } from '../../definitions';
import type { Team } from '../../db/tables-definition';

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

vi.mock('framer-motion', () => ({
  useReducedMotion: () => false,
}));

const baseGame: ExtendedGameData = {
  id: 'game-1',
  tournament_id: 'tournament-1',
  game_number: 1,
  home_team: 'team-a',
  away_team: 'team-b',
  game_date: new Date('2026-12-01T15:00:00Z'),
  location: 'Stadium',
  group: { tournament_group_id: 'g1', group_letter: 'A' },
  playoffStage: null,
  gameResult: null,
};

const teamsMap: Record<string, Team> = {
  'team-a': { id: 'team-a', name: 'Team A', short_name: 'TMA', rank: 5 } as Team,
  'team-b': { id: 'team-b', name: 'Team B', short_name: 'TMB', rank: 10 } as Team,
};

const defaultProps = {
  game: baseGame,
  teamsMap,
  isPlayoffs: false,
  isEditing: true,
  onEditStart: vi.fn(),
  onEditEnd: vi.fn(),
};

describe('FlippableGameCard — AI auto-fill in edit mode', () => {
  beforeEach(() => {
    vi.spyOn(aiPredictionModule, 'generateAIPrediction').mockReturnValue({
      homeScore: 2,
      awayScore: 1,
      homePenaltyWinner: undefined,
      awayPenaltyWinner: undefined,
    });
  });

  it('does not render AI button in edit mode when onAIGenerateClick prop is absent', () => {
    renderWithProviders(
      <FlippableGameCard {...defaultProps} />,
      { guessesContext: true }
    );
    expect(screen.queryByRole('button', { name: 'aiGenerate.tooltipSingle' })).not.toBeInTheDocument();
  });

  it('renders AI button in edit mode when onAIGenerateClick prop is provided', () => {
    renderWithProviders(
      <FlippableGameCard {...defaultProps} onAIGenerateClick={vi.fn()} />,
      { guessesContext: true }
    );
    expect(screen.getByRole('button', { name: 'aiGenerate.tooltipSingle' })).toBeInTheDocument();
  });

  it('does not render AI button when disabled=true', () => {
    renderWithProviders(
      <FlippableGameCard {...defaultProps} disabled={true} onAIGenerateClick={vi.fn()} />,
      { guessesContext: true }
    );
    expect(screen.queryByRole('button', { name: 'aiGenerate.tooltipSingle' })).not.toBeInTheDocument();
  });

  it('calls generateAIPrediction with team ranks on button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FlippableGameCard {...defaultProps} onAIGenerateClick={vi.fn()} />,
      { guessesContext: true }
    );
    await user.click(screen.getByRole('button', { name: 'aiGenerate.tooltipSingle' }));
    expect(aiPredictionModule.generateAIPrediction).toHaveBeenCalledWith(5, 10, false);
  });

  it('sets score inputs to AI-generated values, overwriting existing values', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FlippableGameCard
        {...defaultProps}
        homeScore={9}
        awayScore={9}
        onAIGenerateClick={vi.fn()}
      />,
      { guessesContext: true }
    );
    await user.click(screen.getByRole('button', { name: 'aiGenerate.tooltipSingle' }));
    // After AI fill, score inputs should show 2 and 1 (not 9 and 9)
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(2);
    expect(inputs[1]).toHaveValue(1);
  });

  it('sets penalty winner fields for playoff game when AI predicts a tie', async () => {
    vi.spyOn(aiPredictionModule, 'generateAIPrediction').mockReturnValue({
      homeScore: 1,
      awayScore: 1,
      homePenaltyWinner: false,
      awayPenaltyWinner: true,
    });
    const user = userEvent.setup();
    const playoffGame: ExtendedGameData = {
      ...baseGame,
      group: null,
      playoffStage: { tournament_playoff_round_id: 'r1', round_name: 'Final', is_final: true, is_third_place: false },
    };
    renderWithProviders(
      <FlippableGameCard
        {...defaultProps}
        game={playoffGame}
        isPlayoffs={true}
        onAIGenerateClick={vi.fn()}
      />,
      { guessesContext: true }
    );
    await user.click(screen.getByRole('button', { name: 'aiGenerate.tooltipSingle' }));
    expect(aiPredictionModule.generateAIPrediction).toHaveBeenCalledWith(5, 10, true);
  });

  it('does not show penalty section for group-stage game (no playoff)', async () => {
    vi.spyOn(aiPredictionModule, 'generateAIPrediction').mockReturnValue({
      homeScore: 2,
      awayScore: 2,
      homePenaltyWinner: undefined,
      awayPenaltyWinner: undefined,
    });
    const user = userEvent.setup();
    renderWithProviders(
      <FlippableGameCard {...defaultProps} isPlayoffs={false} onAIGenerateClick={vi.fn()} />,
      { guessesContext: true }
    );
    await user.click(screen.getByRole('button', { name: 'aiGenerate.tooltipSingle' }));
    expect(screen.queryByText('edit.penaltyWinnerFull')).not.toBeInTheDocument();
  });

  it('passes undefined rank to generateAIPrediction when team is missing from teamsMap', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FlippableGameCard
        {...defaultProps}
        teamsMap={{}} // empty — teams not found
        onAIGenerateClick={vi.fn()}
      />,
      { guessesContext: true }
    );
    await user.click(screen.getByRole('button', { name: 'aiGenerate.tooltipSingle' }));
    expect(aiPredictionModule.generateAIPrediction).toHaveBeenCalledWith(undefined, undefined, false);
  });
});
