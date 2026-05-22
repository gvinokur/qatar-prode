import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import GameView from '../../app/components/game-view';
import { ExtendedGameData } from '../../app/definitions';
import { Team, GameGuessNew } from '../../app/db/tables-definition';
import { renderWithProviders, createMockGuessesContext } from '../utils/test-utils';
import * as aiPredictionGenerator from '../../app/utils/ai-prediction-generator';

// Mock next-auth dependencies
vi.mock('next-auth', () => ({
    __esModule: true,
    default: () => ({}),
}));

vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: { user: { id: '1', email: 'test@example.com' } },
        status: 'authenticated',
    }),
}));

// Mock dependencies
vi.mock('../../app/utils/game-score-calculator', () => ({
    calculateScoreForGame: vi.fn(() => ({ score: 2, tier: 'exact' })),
}));

vi.mock('../../app/utils/playoffs-rule-helper', () => ({
    getTeamDescription: vi.fn((rule, t, useShort) => {
        if (!rule) return '';
        if (useShort) return 'Short Team Desc';
        return 'Team Description';
    }),
}));

vi.mock('../../app/components/compact-game-view-card', () => ({
    default: ({ onEditClick, onAIGenerateClick, gameNumber, disabled, ...props }: any) => (
        <div data-testid="compact-game-view-card">
            <span data-testid="game-number">{gameNumber}</span>
            <span data-testid="disabled">{disabled ? 'true' : 'false'}</span>
            <button
                data-testid="edit-button"
                onClick={() => onEditClick(gameNumber)}
                disabled={disabled}
            >
                Edit
            </button>
            {onAIGenerateClick && (
                <button data-testid="ai-generate-button" onClick={onAIGenerateClick}>
                    AI
                </button>
            )}
            <span data-testid="home-team">{props.homeTeamNameOrDescription}</span>
            <span data-testid="away-team">{props.awayTeamNameOrDescription}</span>
            <span data-testid="home-score">{props.homeScore}</span>
            <span data-testid="away-score">{props.awayScore}</span>
            <span data-testid="location">{props.location}</span>
            <span data-testid="score-for-game">{props.scoreForGame}</span>
        </div>
    ),
}));

vi.mock('../../app/utils/ai-prediction-generator', () => ({
    generateAIPrediction: vi.fn(() => ({
        homeScore: 2,
        awayScore: 1,
        homePenaltyWinner: undefined,
        awayPenaltyWinner: undefined,
    })),
}));

const mockGameGuesses: { [k: string]: GameGuessNew } = {
    'game1': {
        game_id: 'game1',
        game_number: 1,
        user_id: 'user1',
        home_score: 2,
        away_score: 1,
        home_penalty_winner: false,
        away_penalty_winner: false,
        home_team: 'team1',
        away_team: 'team2',
    },
};

const mockTeamsMap: { [k: string]: Team } = {
    'team1': {
        id: 'team1',
        name: 'Team 1',
        short_name: 'T1',
        theme: { primary_color: '#0000FF', secondary_color: '#FFFFFF' },
    },
    'team2': {
        id: 'team2',
        name: 'Team 2',
        short_name: 'T2',
        theme: { primary_color: '#FF0000', secondary_color: '#FFFFFF' },
    },
};

const baseGame: ExtendedGameData = {
    id: 'game1',
    tournament_id: 'tournament1',
    game_number: 1,
    game_date: new Date('2024-07-01T18:00:00Z'),
    location: 'Stadium 1',
    game_type: 'group',
    home_team: 'team1',
    away_team: 'team2',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: 'UTC',
    group: {
        tournament_group_id: 'group1',
        group_letter: 'A',
    },
    gameResult: {
        game_id: 'game1',
        home_score: 2,
        away_score: 1,
        is_draft: false,
    },
};

const renderGameView = (
    game: ExtendedGameData = baseGame,
    teamsMap: { [k: string]: Team } = mockTeamsMap,
    handleEditClick = vi.fn(),
    disabled = false,
    gameGuesses = mockGameGuesses,
    onAIGenerateClick?: (gameId: string) => void
) => {
    return renderWithProviders(
        <GameView
            game={game}
            teamsMap={teamsMap}
            handleEditClick={handleEditClick}
            disabled={disabled}
            onAIGenerateClick={onAIGenerateClick}
        />,
        {
            guessesContext: createMockGuessesContext({ gameGuesses }),
            timezone: true
        }
    );
};

describe('GameView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.setSystemTime(new Date('2024-07-01T16:00:00Z')); // 2 hours before game
    });

    it('renders game information correctly', () => {
        renderGameView();

        expect(screen.getByTestId('game-number')).toHaveTextContent('1');
        expect(screen.getByTestId('home-team')).toHaveTextContent('Team 1');
        expect(screen.getByTestId('away-team')).toHaveTextContent('Team 2');
        expect(screen.getByTestId('location')).toHaveTextContent('Stadium 1');
        expect(screen.getByTestId('score-for-game')).toHaveTextContent('2');
    });

    it('renders game guess scores', () => {
        renderGameView();

        expect(screen.getByTestId('home-score')).toHaveTextContent('2');
        expect(screen.getByTestId('away-score')).toHaveTextContent('1');
    });

    it('calls handleEditClick when edit button is clicked', () => {
        const handleEditClick = vi.fn();
        renderGameView(baseGame, mockTeamsMap, handleEditClick);

        fireEvent.click(screen.getByTestId('edit-button'));
        expect(handleEditClick).toHaveBeenCalledWith(1);
    });

    it('disables edit when game is within one hour', () => {
        vi.setSystemTime(new Date('2024-07-01T17:30:00Z')); // 30 minutes before game

        renderGameView();

        expect(screen.getByTestId('disabled')).toHaveTextContent('true');
        expect(screen.getByTestId('edit-button')).toBeDisabled();
    });

    it('disables edit when disabled prop is true', () => {
        renderGameView(baseGame, mockTeamsMap, vi.fn(), true);

        expect(screen.getByTestId('disabled')).toHaveTextContent('true');
        expect(screen.getByTestId('edit-button')).toBeDisabled();
    });

    it('enables edit when game is more than one hour away', () => {
        vi.setSystemTime(new Date('2024-07-01T16:00:00Z')); // 2 hours before game

        renderGameView();

        expect(screen.getByTestId('disabled')).toHaveTextContent('false');
        expect(screen.getByTestId('edit-button')).not.toBeDisabled();
    });

    it('creates default game guess when not found in context', () => {
        const gameWithoutGuess = { ...baseGame, id: 'game2' };
        renderGameView(gameWithoutGuess, mockTeamsMap, vi.fn(), false, {});

        expect(screen.getByTestId('home-score')).toHaveTextContent('');
        expect(screen.getByTestId('away-score')).toHaveTextContent('');
    });

    it('handles playoff game correctly', () => {
        const playoffGame: ExtendedGameData = {
            ...baseGame,
            game_type: 'playoff',
            playoffStage: {
                tournament_playoff_round_id: 'playoff1',
                round_name: 'Quarterfinal',
                is_final: false,
                is_third_place: false,
            },
            group: undefined,
        };

        renderGameView(playoffGame);

        expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument();
    });

    it('handles teams with playoff rules when team is not set', () => {
        const gameWithRules: ExtendedGameData = {
            ...baseGame,
            home_team: undefined,
            away_team: undefined,
            home_team_rule: { position: 1, group: 'A' },
            away_team_rule: { position: 2, group: 'B' },
        };

        const gameGuessWithoutTeams = {
            game1: {
                ...mockGameGuesses.game1,
                home_team: undefined,
                away_team: undefined,
            },
        };

        renderGameView(gameWithRules, mockTeamsMap, vi.fn(), false, gameGuessWithoutTeams);

        expect(screen.getByTestId('home-team')).toHaveTextContent('Team Description');
        expect(screen.getByTestId('away-team')).toHaveTextContent('Team Description');
    });

    it('uses team data from game guess when team is not set in game', () => {
        const gameWithoutTeams: ExtendedGameData = {
            ...baseGame,
            home_team: undefined,
            away_team: undefined,
        };

        renderGameView(gameWithoutTeams);

        expect(screen.getByTestId('home-team')).toHaveTextContent('Team 1');
        expect(screen.getByTestId('away-team')).toHaveTextContent('Team 2');
    });

    it('fixes missing game_number in game guess', () => {
        const gameGuessWithoutNumber = {
            game1: {
                ...mockGameGuesses.game1,
                game_number: 0,
            },
        };

        renderGameView(baseGame, mockTeamsMap, vi.fn(), false, gameGuessWithoutNumber);

        expect(screen.getByTestId('game-number')).toHaveTextContent('1');
    });

    it('fixes missing game_id in game guess', () => {
        const gameGuessWithoutId = {
            game1: {
                ...mockGameGuesses.game1,
                game_id: '',
            },
        };

        renderGameView(baseGame, mockTeamsMap, vi.fn(), false, gameGuessWithoutId);

        expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument();
    });

    it('passes correct props to CompactGameViewCard', () => {
        renderGameView();

        const card = screen.getByTestId('compact-game-view-card');
        expect(card).toBeInTheDocument();

        // Check that all expected props are passed
        expect(screen.getByTestId('game-number')).toHaveTextContent('1');
        expect(screen.getByTestId('home-team')).toHaveTextContent('Team 1');
        expect(screen.getByTestId('away-team')).toHaveTextContent('Team 2');
        expect(screen.getByTestId('location')).toHaveTextContent('Stadium 1');
        expect(screen.getByTestId('score-for-game')).toHaveTextContent('2');
    });

    it('handles team theme correctly', () => {
        const { container } = renderGameView();

        // CompactGameViewCard should receive team themes
        expect(container).toBeInTheDocument();
    });

    it('handles penalty winner flags correctly', () => {
        const gameGuessWithPenalty = {
            game1: {
                ...mockGameGuesses.game1,
                home_penalty_winner: true,
                away_penalty_winner: false,
            },
        };

        renderGameView(baseGame, mockTeamsMap, vi.fn(), false, gameGuessWithPenalty);

        expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument();
    });

    it('handles missing team in teamsMap gracefully', () => {
        const gameWithMissingTeam = {
            ...baseGame,
            home_team: undefined,
            home_team_rule: { position: 1, group: 'A' },
        };

        const gameGuessWithoutTeam = {
            game1: {
                ...mockGameGuesses.game1,
                home_team: undefined,
            },
        };

        renderGameView(gameWithMissingTeam, mockTeamsMap, vi.fn(), false, gameGuessWithoutTeam);

        // Should not crash and should display team description from rules
        expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument();
    });

    it('handles game without gameResult', () => {
        const gameWithoutResult = {
            ...baseGame,
            gameResult: undefined,
        };

        renderGameView(gameWithoutResult);

        expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument();
    });

    it('handles different game types correctly', () => {
        const playoffGame = {
            ...baseGame,
            game_type: 'playoff' as const,
        };

        renderGameView(playoffGame);

        expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument();
    });



    it('handles edge case with null team theme', () => {
        const teamsWithNullTheme = {
            ...mockTeamsMap,
            team1: {
                ...mockTeamsMap.team1,
                theme: null,
            },
        };

        renderGameView(baseGame, teamsWithNullTheme);

        expect(screen.getByTestId('compact-game-view-card')).toBeInTheDocument();
    });

    describe('AI generate click', () => {
        it('does not render AI button when onAIGenerateClick prop is not provided', () => {
            renderGameView();
            expect(screen.queryByTestId('ai-generate-button')).not.toBeInTheDocument();
        });

        it('does not render AI button when editDisabled (within 1 hour of game)', () => {
            vi.setSystemTime(new Date('2024-07-01T17:30:00Z')); // 30 min before game
            const onAIGenerateClick = vi.fn();
            renderGameView(baseGame, mockTeamsMap, vi.fn(), false, mockGameGuesses, onAIGenerateClick);
            expect(screen.queryByTestId('ai-generate-button')).not.toBeInTheDocument();
        });

        it('calls updateGameGuess with snake_case prediction fields when AI button is clicked', () => {
            const onAIGenerateClick = vi.fn();
            const mockUpdateGameGuess = vi.fn();
            const teamsWithRank = {
                team1: { ...mockTeamsMap.team1, rank: 10 },
                team2: { ...mockTeamsMap.team2, rank: 50 },
            };

            renderWithProviders(
                <GameView
                    game={baseGame}
                    teamsMap={teamsWithRank as any}
                    handleEditClick={vi.fn()}
                    disabled={false}
                    onAIGenerateClick={onAIGenerateClick}
                />,
                {
                    guessesContext: createMockGuessesContext({
                        gameGuesses: mockGameGuesses,
                        updateGameGuess: mockUpdateGameGuess,
                    }),
                    timezone: true,
                }
            );

            fireEvent.click(screen.getByTestId('ai-generate-button'));

            expect(aiPredictionGenerator.generateAIPrediction).toHaveBeenCalledWith(10, 50, false);
            expect(mockUpdateGameGuess).toHaveBeenCalledWith(
                'game1',
                expect.objectContaining({ home_score: 2, away_score: 1 })
            );
            expect(onAIGenerateClick).toHaveBeenCalledWith('game1');
        });
    });
});
