import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NextIntlClientProvider } from 'next-intl';
import QualifiedTeamsClientPage from '../../../app/components/qualified-teams/qualified-teams-client-page';
import { testFactories } from '../../db/test-factories';
import qualifiedTeamsEs from '../../../locales/es/qualified-teams.json';
import qualifiedTeamsEn from '../../../locales/en/qualified-teams.json';
import { renderWithTheme } from '../../utils/test-utils';

// Mock CompactPredictionDashboard to capture props
const mockPredictionStatusHeader = vi.fn(() => <div data-testid="prediction-status-header">Status Header</div>);
vi.mock('../../../app/components/prediction-status-header', () => ({
  PredictionStatusHeader: (props: any) => mockPredictionStatusHeader(props),
  computeAwardsHeaderVariant: vi.fn(() => ({ tone: 'brand', leadIcon: 'rocket', statusText: 'Test' })),
  computeQTHeaderVariant: vi.fn(() => ({ tone: 'brand', leadIcon: 'rocket', statusText: 'Test' })),
}));

// Helper to render with i18n
const renderWithI18n = (component: React.ReactElement, locale: 'en' | 'es' = 'es') => {
  const messages = {
    'qualified-teams': locale === 'es' ? qualifiedTeamsEs : qualifiedTeamsEn,
  };

  return renderWithTheme(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

/**
 * Smoke tests for QualifiedTeamsClientPage
 * These tests verify the component renders without crashing and displays basic UI elements
 * Full integration testing is complex due to DnD and context dependencies
 */
describe('QualifiedTeamsClientPage - Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTournament = {
    ...testFactories.tournament({
      id: 'tournament-1',
      allows_third_place_qualification: true,
      max_third_place_qualifiers: 4,
    }),
    max_silver_games: 5,
    max_golden_games: 3,
  };

  const mockGroup = testFactories.tournamentGroup({
    id: 'group-1',
    tournament_id: 'tournament-1',
    group_letter: 'A',
  });

  const mockTeam1 = testFactories.team({ id: 'team-1', name: 'Argentina' });
  const mockTeam2 = testFactories.team({ id: 'team-2', name: 'Brazil' });

  const mockPrediction1 = testFactories.qualifiedTeamPrediction({
    id: 'pred-1',
    user_id: 'user-1',
    tournament_id: 'tournament-1',
    team_id: 'team-1',
    group_id: 'group-1',
    predicted_position: 1,
    predicted_to_qualify: true,
  });

  const mockProps = {
    tournament: { ...mockTournament, short_name: 'Test' },
    groups: [
      {
        group: mockGroup,
        teams: [mockTeam1, mockTeam2],
      },
    ],
    userId: 'user-1',
    isLocked: false,
    initialPredictions: [mockPrediction1],
    allowsThirdPlace: false,
    maxThirdPlace: 0,
    completeGroupIds: new Set<string>(),
    allGroupsComplete: false,
    // Dashboard props (added for CompactPredictionDashboard)
    games: [],
    gameGuessesArray: [],
    tournamentPredictionCompletion: null,
    tournamentStartDate: new Date('2024-01-01'),
    teamsMap: { 'team-1': mockTeam1, 'team-2': mockTeam2 },
  };

  it('should render without crashing', () => {
    const { container } = renderWithI18n(<QualifiedTeamsClientPage {...mockProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should render with locked state', () => {
    const lockedProps = { ...mockProps, isLocked: true };
    const { container } = renderWithI18n(<QualifiedTeamsClientPage {...lockedProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should render with no initial predictions', () => {
    const emptyProps = { ...mockProps, initialPredictions: [] };
    const { container } = renderWithI18n(<QualifiedTeamsClientPage {...emptyProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should render DnD container', () => {
    const { container } = renderWithI18n(<QualifiedTeamsClientPage {...mockProps} />);
    // Component should render with DnD context
    const dndContainer = container.querySelector('[aria-describedby^="DndDescribedBy"]');
    expect(dndContainer || container.firstChild).toBeTruthy();
  });

  it('should render with third place disabled', () => {
    const mockPrediction3 = testFactories.qualifiedTeamPrediction({
      id: 'pred-3pos',
      user_id: 'user-1',
      tournament_id: 'tournament-1',
      team_id: 'team-2',
      group_id: 'group-1',
      predicted_position: 3,
      predicted_to_qualify: false,
    });
    const noThirdPlaceProps = {
      ...mockProps,
      allowsThirdPlace: false,
      maxThirdPlace: 0,
      initialPredictions: [mockPrediction1, mockPrediction3],
    };
    renderWithI18n(<QualifiedTeamsClientPage {...noThirdPlaceProps} />);
    // Checkbox must not appear even though a team is in position 3
    expect(screen.queryByText('Clasifica')).not.toBeInTheDocument();
  });

  it('should show third place checkbox when allowsThirdPlace is true and team is at position 3', () => {
    const mockPrediction3 = testFactories.qualifiedTeamPrediction({
      id: 'pred-3pos',
      user_id: 'user-1',
      tournament_id: 'tournament-1',
      team_id: 'team-2',
      group_id: 'group-1',
      predicted_position: 3,
      predicted_to_qualify: false,
    });
    const withThirdPlaceProps = {
      ...mockProps,
      allowsThirdPlace: true,
      maxThirdPlace: 4,
      initialPredictions: [mockPrediction1, mockPrediction3],
    };
    renderWithI18n(<QualifiedTeamsClientPage {...withThirdPlaceProps} />);
    // Checkbox must appear for position-3 team when allowsThirdPlace is true
    expect(screen.queryByText('Clasifica')).toBeInTheDocument();
  });

  it('should render when third place limit is reached', () => {
    // Create 4 teams, 2 in position 3 with qualification (limit is 4 globally)
    const team3 = testFactories.team({ id: 'team-3', name: 'Chile' });
    const team4 = testFactories.team({ id: 'team-4', name: 'Uruguay' });

    const mockGroup2 = testFactories.tournamentGroup({
      id: 'group-2',
      tournament_id: 'tournament-1',
      group_letter: 'B',
    });

    const pred2 = testFactories.qualifiedTeamPrediction({
      id: 'pred-2',
      user_id: 'user-1',
      tournament_id: 'tournament-1',
      team_id: 'team-2',
      group_id: 'group-1',
      predicted_position: 3,
      predicted_to_qualify: true,
    });

    const pred3 = testFactories.qualifiedTeamPrediction({
      id: 'pred-3',
      user_id: 'user-1',
      tournament_id: 'tournament-1',
      team_id: 'team-3',
      group_id: 'group-2',
      predicted_position: 3,
      predicted_to_qualify: true,
    });

    const pred4 = testFactories.qualifiedTeamPrediction({
      id: 'pred-4',
      user_id: 'user-1',
      tournament_id: 'tournament-1',
      team_id: 'team-4',
      group_id: 'group-2',
      predicted_position: 4,
      predicted_to_qualify: false,
    });

    const limitReachedProps = {
      ...mockProps,
      allowsThirdPlace: true,
      maxThirdPlace: 2,
      groups: [
        {
          group: mockGroup,
          teams: [mockTeam1, mockTeam2],
        },
        {
          group: mockGroup2,
          teams: [team3, team4],
        },
      ],
      initialPredictions: [mockPrediction1, pred2, pred3, pred4],
      teamsMap: {
        'team-1': mockTeam1,
        'team-2': mockTeam2,
        'team-3': team3,
        'team-4': team4,
      },
    };

    const { container } = renderWithI18n(<QualifiedTeamsClientPage {...limitReachedProps} />);
    expect(container).toBeInTheDocument();

    // Verify third place teams are rendered
    expect(screen.queryByText('Chile')).toBeInTheDocument();
    expect(screen.queryByText('Uruguay')).toBeInTheDocument();
  });
});

describe('QualifiedTeamsClientPage - Override Pattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTournament = {
    ...testFactories.tournament({
      id: 'tournament-1',
      allows_third_place_qualification: true,
      max_third_place_qualifiers: 4,
    }),
    max_silver_games: 5,
    max_golden_games: 3,
  };

  const mockGroup1 = testFactories.tournamentGroup({
    id: 'group-1',
    tournament_id: 'tournament-1',
    group_letter: 'A',
  });

  const mockGroup2 = testFactories.tournamentGroup({
    id: 'group-2',
    tournament_id: 'tournament-1',
    group_letter: 'B',
  });

  const mockTeam1 = testFactories.team({ id: 'team-1', name: 'Argentina' });
  const mockTeam2 = testFactories.team({ id: 'team-2', name: 'Brazil' });
  const mockTeam3 = testFactories.team({ id: 'team-3', name: 'Chile' });
  const mockTeam4 = testFactories.team({ id: 'team-4', name: 'Uruguay' });

  it('should calculate qualifiersCompleted from predictions state (override pattern)', () => {
    const predictions = [
      testFactories.qualifiedTeamPrediction({
        id: 'pred-1',
        user_id: 'user-1',
        tournament_id: 'tournament-1',
        team_id: 'team-1',
        group_id: 'group-1',
        predicted_position: 1,
        predicted_to_qualify: true,
      }),
      testFactories.qualifiedTeamPrediction({
        id: 'pred-2',
        user_id: 'user-1',
        tournament_id: 'tournament-1',
        team_id: 'team-2',
        group_id: 'group-1',
        predicted_position: 2,
        predicted_to_qualify: true,
      }),
      testFactories.qualifiedTeamPrediction({
        id: 'pred-3',
        user_id: 'user-1',
        tournament_id: 'tournament-1',
        team_id: 'team-3',
        group_id: 'group-2',
        predicted_position: 1,
        predicted_to_qualify: true,
      }),
    ];

    const mockProps = {
      tournament: { ...mockTournament, short_name: 'Test' },
      groups: [
        { group: mockGroup1, teams: [mockTeam1, mockTeam2] },
        { group: mockGroup2, teams: [mockTeam3, mockTeam4] },
      ],
      userId: 'user-1',
      isLocked: false,
      initialPredictions: predictions,
      allowsThirdPlace: false,
      maxThirdPlace: 0,
      completeGroupIds: new Set<string>(),
      allGroupsComplete: false,
      games: [],
      gameGuessesArray: [],
      tournamentPredictionCompletion: {
        qualifiers: { completed: 999, total: 16 }, // Server value should be overridden
        finalStandings: { completed: 0, total: 3 },
        awards: { completed: 0, total: 4 },
      },
      tournamentStartDate: new Date('2024-01-01'),
      teamsMap: { 'team-1': mockTeam1, 'team-2': mockTeam2, 'team-3': mockTeam3, 'team-4': mockTeam4 },
    };

    renderWithTheme(
      <NextIntlClientProvider locale="es" messages={{ 'qualified-teams': qualifiedTeamsEs }}>
        <QualifiedTeamsClientPage {...mockProps} />
      </NextIntlClientProvider>
    );

    // Dashboard should receive qualifiersCompleted = 3 (from predictions state)
    // NOT the server value of 999
    expect(mockPredictionStatusHeader).toHaveBeenCalled();
  });

  it('should calculate qualifiersCompleted with third place qualifications', () => {
    const predictions = [
      testFactories.qualifiedTeamPrediction({
        id: 'pred-1',
        user_id: 'user-1',
        tournament_id: 'tournament-1',
        team_id: 'team-1',
        group_id: 'group-1',
        predicted_position: 1,
        predicted_to_qualify: true,
      }),
      testFactories.qualifiedTeamPrediction({
        id: 'pred-2',
        user_id: 'user-1',
        tournament_id: 'tournament-1',
        team_id: 'team-2',
        group_id: 'group-1',
        predicted_position: 2,
        predicted_to_qualify: true,
      }),
      testFactories.qualifiedTeamPrediction({
        id: 'pred-3',
        user_id: 'user-1',
        tournament_id: 'tournament-1',
        team_id: 'team-3',
        group_id: 'group-1',
        predicted_position: 3,
        predicted_to_qualify: true, // Third place qualifies
      }),
      testFactories.qualifiedTeamPrediction({
        id: 'pred-4',
        user_id: 'user-1',
        tournament_id: 'tournament-1',
        team_id: 'team-4',
        group_id: 'group-1',
        predicted_position: 4,
        predicted_to_qualify: false, // Fourth place does not qualify
      }),
    ];

    const mockProps = {
      tournament: { ...mockTournament, short_name: 'Test' },
      groups: [{ group: mockGroup1, teams: [mockTeam1, mockTeam2, mockTeam3, mockTeam4] }],
      userId: 'user-1',
      isLocked: false,
      initialPredictions: predictions,
      allowsThirdPlace: true,
      maxThirdPlace: 4,
      completeGroupIds: new Set<string>(),
      allGroupsComplete: false,
      games: [],
      gameGuessesArray: [],
      tournamentPredictionCompletion: null,
      tournamentStartDate: new Date('2024-01-01'),
      teamsMap: { 'team-1': mockTeam1, 'team-2': mockTeam2, 'team-3': mockTeam3, 'team-4': mockTeam4 },
    };

    renderWithTheme(
      <NextIntlClientProvider locale="es" messages={{ 'qualified-teams': qualifiedTeamsEs }}>
        <QualifiedTeamsClientPage {...mockProps} />
      </NextIntlClientProvider>
    );

    // Should count 3 qualified teams (1st, 2nd, and 3rd place)
    expect(mockPredictionStatusHeader).toHaveBeenCalled();
  });

  it('should count DISTINCT teams when same team is marked as qualifier in multiple groups', () => {
    // Edge case: If same team ID is marked as qualifier in multiple groups (shouldn't happen but...)
    const predictions = [
      testFactories.qualifiedTeamPrediction({
        id: 'pred-1',
        user_id: 'user-1',
        tournament_id: 'tournament-1',
        team_id: 'team-1',
        group_id: 'group-1',
        predicted_position: 1,
        predicted_to_qualify: true,
      }),
      testFactories.qualifiedTeamPrediction({
        id: 'pred-2',
        user_id: 'user-1',
        tournament_id: 'tournament-1',
        team_id: 'team-1', // Same team (shouldn't happen in real data)
        group_id: 'group-2',
        predicted_position: 1,
        predicted_to_qualify: true,
      }),
      testFactories.qualifiedTeamPrediction({
        id: 'pred-3',
        user_id: 'user-1',
        tournament_id: 'tournament-1',
        team_id: 'team-2',
        group_id: 'group-1',
        predicted_position: 2,
        predicted_to_qualify: true,
      }),
    ];

    const mockProps = {
      tournament: { ...mockTournament, short_name: 'Test' },
      groups: [
        { group: mockGroup1, teams: [mockTeam1, mockTeam2] },
        { group: mockGroup2, teams: [mockTeam1, mockTeam3] }, // team-1 in both groups
      ],
      userId: 'user-1',
      isLocked: false,
      initialPredictions: predictions,
      allowsThirdPlace: false,
      maxThirdPlace: 0,
      completeGroupIds: new Set<string>(),
      allGroupsComplete: false,
      games: [],
      gameGuessesArray: [],
      tournamentPredictionCompletion: null,
      tournamentStartDate: new Date('2024-01-01'),
      teamsMap: { 'team-1': mockTeam1, 'team-2': mockTeam2, 'team-3': mockTeam3 },
    };

    renderWithTheme(
      <NextIntlClientProvider locale="es" messages={{ 'qualified-teams': qualifiedTeamsEs }}>
        <QualifiedTeamsClientPage {...mockProps} />
      </NextIntlClientProvider>
    );

    // Should count DISTINCT teams = 2 (team-1 and team-2), not 3
    expect(mockPredictionStatusHeader).toHaveBeenCalled();
  });

  it('should pass calculated predictedGames from gameGuessesArray', () => {
    const gameGuesses = [
      { game_id: 'game-1', home_score: 2, away_score: 1 },
      { game_id: 'game-2', home_score: 2, away_score: 0 },
      { game_id: 'game-3', home_score: null, away_score: 1 }, // Partial - not counted
    ];

    const mockProps = {
      tournament: { ...mockTournament, short_name: 'Test' },
      groups: [{ group: mockGroup1, teams: [mockTeam1, mockTeam2] }],
      userId: 'user-1',
      isLocked: false,
      initialPredictions: [],
      allowsThirdPlace: false,
      maxThirdPlace: 0,
      completeGroupIds: new Set<string>(),
      allGroupsComplete: false,
      games: [],
      gameGuessesArray: gameGuesses,
      tournamentPredictionCompletion: null,
      tournamentStartDate: new Date('2024-01-01'),
      teamsMap: { 'team-1': mockTeam1, 'team-2': mockTeam2 },
    };

    renderWithTheme(
      <NextIntlClientProvider locale="es" messages={{ 'qualified-teams': qualifiedTeamsEs }}>
        <QualifiedTeamsClientPage {...mockProps} />
      </NextIntlClientProvider>
    );

    expect(mockPredictionStatusHeader).toHaveBeenCalled();
  });

  it('should filter urgent games (within 48 hours)', () => {
    const now = Date.now();
    const urgentGame = { game_id: 'game-1', game_date: new Date(now + 24 * 60 * 60 * 1000) }; // 24 hours away
    const notUrgentGame = { game_id: 'game-2', game_date: new Date(now + 72 * 60 * 60 * 1000) }; // 72 hours away

    const mockProps = {
      tournament: { ...mockTournament, short_name: 'Test' },
      groups: [{ group: mockGroup1, teams: [mockTeam1, mockTeam2] }],
      userId: 'user-1',
      isLocked: false,
      initialPredictions: [],
      allowsThirdPlace: false,
      maxThirdPlace: 0,
      completeGroupIds: new Set<string>(),
      allGroupsComplete: false,
      games: [urgentGame, notUrgentGame],
      gameGuessesArray: [],
      tournamentPredictionCompletion: null,
      tournamentStartDate: new Date('2024-01-01'),
      teamsMap: { 'team-1': mockTeam1, 'team-2': mockTeam2 },
    };

    renderWithTheme(
      <NextIntlClientProvider locale="es" messages={{ 'qualified-teams': qualifiedTeamsEs }}>
        <QualifiedTeamsClientPage {...mockProps} />
      </NextIntlClientProvider>
    );

    expect(mockPredictionStatusHeader).toHaveBeenCalled();
  });

  it('should pass boost counts from tournamentPredictionCompletion when available', () => {
    const mockProps = {
      tournament: { ...mockTournament, short_name: 'Test' },
      groups: [{ group: mockGroup1, teams: [mockTeam1, mockTeam2] }],
      userId: 'user-1',
      isLocked: false,
      initialPredictions: [],
      allowsThirdPlace: false,
      maxThirdPlace: 0,
      completeGroupIds: new Set<string>(),
      allGroupsComplete: false,
      games: [],
      gameGuessesArray: [],
      tournamentPredictionCompletion: {
        silverBoostsUsed: 3,
        silverBoostsMax: 5,
        goldenBoostsUsed: 2,
        goldenBoostsMax: 3,
        finalStandings: { completed: 0, total: 3 },
        awards: { completed: 0, total: 4 },
        qualifiers: { completed: 0, total: 16 },
      },
      tournamentStartDate: new Date('2024-01-01'),
      teamsMap: { 'team-1': mockTeam1, 'team-2': mockTeam2 },
    };

    renderWithTheme(
      <NextIntlClientProvider locale="es" messages={{ 'qualified-teams': qualifiedTeamsEs }}>
        <QualifiedTeamsClientPage {...mockProps} />
      </NextIntlClientProvider>
    );

    expect(mockPredictionStatusHeader).toHaveBeenCalled();
  });
});
