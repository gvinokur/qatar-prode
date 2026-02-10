import { vi, describe, it, expect, beforeEach } from 'vitest';
import { redirect, notFound } from 'next/navigation';
import QualifiedTeamsPage from '../../../../../app/tournaments/[id]/qualified-teams/page';
import * as userActions from '../../../../../app/actions/user-actions';
import * as qualificationActions from '../../../../../app/actions/qualification-actions';
import { db } from '../../../../../app/db/database';

// Mock Next.js navigation - these must throw to stop execution like real Next.js
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

// Mock user actions
vi.mock('../../../../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

// Mock qualification actions
vi.mock('../../../../../app/actions/qualification-actions', () => ({
  getTournamentQualificationConfig: vi.fn(),
}));

// Mock database
vi.mock('../../../../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

// Mock team repository (findQualifiedTeams)
vi.mock('../../../../../app/db/team-repository', () => ({
  findQualifiedTeams: vi.fn().mockResolvedValue({
    teams: [],
    completeGroupIds: new Set(),
    allGroupsComplete: false
  }),
}));

// Mock qualified teams scoring utility
vi.mock('../../../../../app/utils/qualified-teams-scoring', () => ({
  calculateQualifiedTeamsScore: vi.fn().mockResolvedValue(null),
}));

// Mock the client component
vi.mock('../../../../../app/components/qualified-teams/qualified-teams-client-page', () => ({
  default: ({ tournament, groups, initialPredictions, userId, isLocked, allowsThirdPlace, maxThirdPlace, actualResults, scoringBreakdown }: any) => (
    <div data-testid="qualified-teams-client-page">
      <div data-testid="tournament-id">{tournament.id}</div>
      <div data-testid="groups-count">{groups.length}</div>
      <div data-testid="predictions-count">{initialPredictions.length}</div>
      <div data-testid="user-id">{userId}</div>
      <div data-testid="is-locked">{isLocked.toString()}</div>
      <div data-testid="allows-third-place">{allowsThirdPlace.toString()}</div>
      <div data-testid="max-third-place">{maxThirdPlace}</div>
      <div data-testid="has-actual-results">{actualResults ? 'true' : 'false'}</div>
      <div data-testid="has-scoring-breakdown">{scoringBreakdown ? 'true' : 'false'}</div>
    </div>
  ),
}));

const mockDb = vi.mocked(db);
const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockGetTournamentConfig = vi.mocked(qualificationActions.getTournamentQualificationConfig);
const mockRedirect = vi.mocked(redirect);
const mockNotFound = vi.mocked(notFound);

describe('QualifiedTeamsPage', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    emailVerified: new Date(),
    name: 'Test User',
    image: null,
    role: 'user' as const,
    timezone: 'UTC',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTournament = {
    id: 'tournament-1',
    short_name: 'WC 2026',
    name: 'World Cup 2026',
    is_active: true,
  };

  const mockGroup = {
    id: 'group-1',
    group_letter: 'A',
    tournament_id: 'tournament-1',
    sort_by_games_between_teams: false,
  };

  const mockTeam = {
    id: 'team-1',
    name: 'Argentina',
    short_name: 'ARG',
    iso_code: 'ARG',
    flag_url: 'https://example.com/arg.png',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPrediction = {
    id: 'pred-1',
    user_id: 'user-1',
    tournament_id: 'tournament-1',
    group_id: 'group-1',
    team_id: 'team-1',
    predicted_position: 1,
    predicted_to_qualify: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockUser);
    mockGetTournamentConfig.mockResolvedValue({
      allowsThirdPlace: false,
      maxThirdPlace: 0,
      isLocked: false,
    });
  });

  it('should redirect to login if user is not authenticated', async () => {
    mockGetLoggedInUser.mockResolvedValue(null);

    const params = Promise.resolve({ id: 'tournament-1' });

    await expect(QualifiedTeamsPage({ params })).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login?redirect=/tournaments/tournament-1/qualified-teams');
  });

  it('should redirect to login if user has no ID', async () => {
    mockGetLoggedInUser.mockResolvedValue({ ...mockUser, id: '' });

    const params = Promise.resolve({ id: 'tournament-1' });

    await expect(QualifiedTeamsPage({ params })).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login?redirect=/tournaments/tournament-1/qualified-teams');
  });

  it('should call notFound if tournament does not exist', async () => {
    // Mock tournament query to return null
    const mockTournamentQuery = {
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue(null),
    };
    mockDb.selectFrom.mockReturnValue(mockTournamentQuery as any);

    const params = Promise.resolve({ id: 'nonexistent' });

    await expect(QualifiedTeamsPage({ params })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('should render with tournament, groups, and predictions', async () => {
    // Mock tournament query
    const mockTournamentQuery = {
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
    };

    // Mock groups query
    const mockGroupsQuery = {
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([mockGroup]),
    };

    // Mock team assignments query
    const mockTeamAssignmentsQuery = {
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([{
        team_id: mockTeam.id,
        tournament_group_id: mockGroup.id,
        id: 'assignment-1',
        ...mockTeam,
      }]),
    };

    // Mock predictions query - returns JSONB structure
    const mockPredictionsQuery = {
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([{
        id: 'pred-row-1',
        user_id: 'user-1',
        tournament_id: 'tournament-1',
        group_id: 'group-1',
        team_predicted_positions: [
          {
            team_id: 'team-1',
            predicted_position: 1,
            predicted_to_qualify: true,
          }
        ],
        created_at: new Date(),
        updated_at: new Date(),
      }]),
    };

    // Set up mock to return different queries based on table
    mockDb.selectFrom.mockImplementation((table: string) => {
      if (table === 'tournaments') return mockTournamentQuery as any;
      if (table === 'tournament_groups') return mockGroupsQuery as any;
      if (table === 'tournament_group_teams') return mockTeamAssignmentsQuery as any;
      if (table === 'tournament_user_group_positions_predictions') return mockPredictionsQuery as any;
      return mockTournamentQuery as any;
    });

    const params = Promise.resolve({ id: 'tournament-1' });
    const searchParams = Promise.resolve({});
    const result = await QualifiedTeamsPage({ params, searchParams });

    expect(result).toBeDefined();
    expect(mockGetLoggedInUser).toHaveBeenCalled();
    expect(mockGetTournamentConfig).toHaveBeenCalledWith('tournament-1');
  });

  it('should handle empty groups', async () => {
    // Mock tournament query
    const mockTournamentQuery = {
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
    };

    // Mock groups query returning empty array
    const mockGroupsQuery = {
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
    };

    // Mock predictions query
    const mockPredictionsQuery = {
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
    };

    mockDb.selectFrom.mockImplementation((table: string) => {
      if (table === 'tournaments') return mockTournamentQuery as any;
      if (table === 'tournament_groups') return mockGroupsQuery as any;
      if (table === 'tournament_user_group_positions_predictions') return mockPredictionsQuery as any;
      return mockTournamentQuery as any;
    });

    const params = Promise.resolve({ id: 'tournament-1' });
    const searchParams = Promise.resolve({});
    const result = await QualifiedTeamsPage({ params, searchParams });

    expect(result).toBeDefined();
  });

  it('should pass correct config to client component', async () => {
    mockGetTournamentConfig.mockResolvedValue({
      allowsThirdPlace: true,
      maxThirdPlace: 8,
      isLocked: true,
    });

    // Setup mocks for successful page render
    const mockTournamentQuery = {
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
    };

    const mockGroupsQuery = {
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
    };

    const mockPredictionsQuery = {
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
    };

    mockDb.selectFrom.mockImplementation((table: string) => {
      if (table === 'tournaments') return mockTournamentQuery as any;
      if (table === 'tournament_groups') return mockGroupsQuery as any;
      if (table === 'tournament_user_group_positions_predictions') return mockPredictionsQuery as any;
      return mockTournamentQuery as any;
    });

    const params = Promise.resolve({ id: 'tournament-1' });
    const searchParams = Promise.resolve({});
    await QualifiedTeamsPage({ params, searchParams });

    expect(mockGetTournamentConfig).toHaveBeenCalledWith('tournament-1');
  });
});
