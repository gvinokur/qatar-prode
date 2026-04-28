import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bulkAutoFillFromPredictions } from '../qualification-actions';

vi.mock('../user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

vi.mock('../../db/game-guess-repository', () => ({
  findGameGuessesByUserId: vi.fn(),
}));

vi.mock('../../db/qualified-teams-repository', () => ({
  upsertGroupPositionsPrediction: vi.fn(),
  getAllUserGroupPositionsPredictions: vi.fn(),
}));

vi.mock('../guesses-actions', () => ({
  updatePlayoffGameGuesses: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('../../db/database', () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

vi.mock('../tournament-actions', () => ({
  getTournamentStartDate: vi.fn(),
}));

import { getLoggedInUser } from '../user-actions';
import { findGameGuessesByUserId } from '../../db/game-guess-repository';
import { upsertGroupPositionsPrediction } from '../../db/qualified-teams-repository';
import { db } from '../../db/database';
import { createMockSelectQuery } from '@/__tests__/db/mock-helpers';

const GROUP_A_ID = 'group-a';
const GROUP_B_ID = 'group-b';
const TOURNAMENT_ID = 'tournament-1';

const mockTournament = {
  id: TOURNAMENT_ID,
  is_active: true,
  allows_third_place_qualification: true,
  max_third_place_qualifiers: 1,
  dev_only: false,
};

const mockGroups = [
  { id: GROUP_A_ID, group_letter: 'A' },
  { id: GROUP_B_ID, group_letter: 'B' },
];

const mockGroupGames = [
  { game_id: 'g1', home_team: 'teamA1', away_team: 'teamA2', group_id: GROUP_A_ID },
  { game_id: 'g2', home_team: 'teamB1', away_team: 'teamB2', group_id: GROUP_B_ID },
];

function mockDbWithTournamentGroupsAndGames() {
  let callCount = 0;
  vi.mocked(db).selectFrom.mockImplementation(() => {
    callCount++;
    if (callCount === 1) return createMockSelectQuery(mockTournament) as any;
    if (callCount === 2) return createMockSelectQuery(mockGroups) as any;
    return createMockSelectQuery(mockGroupGames) as any;
  });
}

describe('bulkAutoFillFromPredictions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unauthorized error when no active session', async () => {
    vi.mocked(getLoggedInUser).mockResolvedValue(null);

    const result = await bulkAutoFillFromPredictions(TOURNAMENT_ID, 'en');

    expect(result.success).toBe(false);
    expect(result.groupsProcessed).toBe(0);
    expect(upsertGroupPositionsPrediction).not.toHaveBeenCalled();
  });

  it('returns locked error when tournament is not active', async () => {
    vi.mocked(getLoggedInUser).mockResolvedValue({ id: 'user-1' } as any);

    let callCount = 0;
    vi.mocked(db).selectFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createMockSelectQuery({ ...mockTournament, is_active: false }) as any;
      }
      return createMockSelectQuery([]) as any;
    });

    const result = await bulkAutoFillFromPredictions(TOURNAMENT_ID, 'en');

    expect(result.success).toBe(false);
    expect(result.groupsProcessed).toBe(0);
    expect(upsertGroupPositionsPrediction).not.toHaveBeenCalled();
  });

  it('returns error and saves nothing when any group has incomplete game predictions', async () => {
    vi.mocked(getLoggedInUser).mockResolvedValue({ id: 'user-1' } as any);
    mockDbWithTournamentGroupsAndGames();

    // Only 1 guess for 2 games → group A has incomplete predictions
    vi.mocked(findGameGuessesByUserId).mockResolvedValue([
      { game_id: 'g1', home_score: 1, away_score: 0 } as any,
      // g2 is missing
    ]);

    const result = await bulkAutoFillFromPredictions(TOURNAMENT_ID, 'en');

    expect(result.success).toBe(false);
    expect(result.groupsProcessed).toBe(0);
    expect(upsertGroupPositionsPrediction).not.toHaveBeenCalled();
  });

  it('sets predicted_to_qualify=true for positions 1 and 2', async () => {
    vi.mocked(getLoggedInUser).mockResolvedValue({ id: 'user-1' } as any);
    mockDbWithTournamentGroupsAndGames();
    vi.mocked(upsertGroupPositionsPrediction).mockResolvedValue({} as any);

    vi.mocked(findGameGuessesByUserId).mockResolvedValue([
      { game_id: 'g1', home_score: 2, away_score: 0 } as any,
      { game_id: 'g2', home_score: 1, away_score: 0 } as any,
    ]);

    const result = await bulkAutoFillFromPredictions(TOURNAMENT_ID, 'en');

    expect(result.success).toBe(true);
    expect(upsertGroupPositionsPrediction).toHaveBeenCalledTimes(2);

    // Check group A: positions for 2-team group
    const groupACall = vi.mocked(upsertGroupPositionsPrediction).mock.calls.find(
      (call) => call[2] === GROUP_A_ID
    );
    const groupAPositions = groupACall![3];
    const pos1 = groupAPositions.find((p) => p.predicted_position === 1);
    const pos2 = groupAPositions.find((p) => p.predicted_position === 2);
    expect(pos1?.predicted_to_qualify).toBe(true);
    expect(pos2?.predicted_to_qualify).toBe(true);
  });

  it('selects top maxThirdPlace 3rd-place teams by simulated performance', async () => {
    // Use a 3-team group scenario
    const threeTeamGroupGames = [
      { game_id: 'g1', home_team: 'A', away_team: 'B', group_id: GROUP_A_ID },
      { game_id: 'g2', home_team: 'A', away_team: 'C', group_id: GROUP_A_ID },
      { game_id: 'g3', home_team: 'B', away_team: 'C', group_id: GROUP_A_ID },
      { game_id: 'g4', home_team: 'D', away_team: 'E', group_id: GROUP_B_ID },
      { game_id: 'g5', home_team: 'D', away_team: 'F', group_id: GROUP_B_ID },
      { game_id: 'g6', home_team: 'E', away_team: 'F', group_id: GROUP_B_ID },
    ];

    vi.mocked(getLoggedInUser).mockResolvedValue({ id: 'user-1' } as any);

    let callCount = 0;
    vi.mocked(db).selectFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return createMockSelectQuery(mockTournament) as any;
      if (callCount === 2) return createMockSelectQuery(mockGroups) as any;
      return createMockSelectQuery(threeTeamGroupGames) as any;
    });

    vi.mocked(upsertGroupPositionsPrediction).mockResolvedValue({} as any);

    vi.mocked(findGameGuessesByUserId).mockResolvedValue([
      { game_id: 'g1', home_score: 3, away_score: 0 }, // A wins big
      { game_id: 'g2', home_score: 2, away_score: 0 }, // A wins
      { game_id: 'g3', home_score: 1, away_score: 0 }, // B wins (3rd place in group A = C, 0 pts)
      { game_id: 'g4', home_score: 1, away_score: 0 }, // D wins
      { game_id: 'g5', home_score: 0, away_score: 1 }, // F wins
      { game_id: 'g6', home_score: 1, away_score: 1 }, // draw
    ] as any);

    const result = await bulkAutoFillFromPredictions(TOURNAMENT_ID, 'en');

    expect(result.success).toBe(true);
    // maxThirdPlace = 1, so only one 3rd-place team should qualify
    const allPositions = vi.mocked(upsertGroupPositionsPrediction).mock.calls.flatMap((call) => call[3]);
    const qualifyingThird = allPositions.filter((p) => p.predicted_position === 3 && p.predicted_to_qualify);
    expect(qualifyingThird).toHaveLength(1);
  });

  it('calls updatePlayoffGameGuesses after all upserts', async () => {
    vi.mocked(getLoggedInUser).mockResolvedValue({ id: 'user-1' } as any);
    mockDbWithTournamentGroupsAndGames();
    vi.mocked(upsertGroupPositionsPrediction).mockResolvedValue({} as any);

    vi.mocked(findGameGuessesByUserId).mockResolvedValue([
      { game_id: 'g1', home_score: 1, away_score: 0 } as any,
      { game_id: 'g2', home_score: 1, away_score: 0 } as any,
    ]);

    const { updatePlayoffGameGuesses } = await import('../guesses-actions');
    vi.mocked(updatePlayoffGameGuesses).mockResolvedValue(undefined as any);

    await bulkAutoFillFromPredictions(TOURNAMENT_ID, 'en');

    expect(updatePlayoffGameGuesses).toHaveBeenCalledWith(TOURNAMENT_ID, { id: 'user-1' });
  });

  it('returns groupsProcessed count equal to total number of groups', async () => {
    vi.mocked(getLoggedInUser).mockResolvedValue({ id: 'user-1' } as any);
    mockDbWithTournamentGroupsAndGames();
    vi.mocked(upsertGroupPositionsPrediction).mockResolvedValue({} as any);

    vi.mocked(findGameGuessesByUserId).mockResolvedValue([
      { game_id: 'g1', home_score: 1, away_score: 0 } as any,
      { game_id: 'g2', home_score: 1, away_score: 0 } as any,
    ]);

    const result = await bulkAutoFillFromPredictions(TOURNAMENT_ID, 'en');

    expect(result.success).toBe(true);
    expect(result.groupsProcessed).toBe(2); // mockGroups has 2 groups
  });
});
