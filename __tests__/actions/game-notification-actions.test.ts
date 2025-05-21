import { sendGamesTomorrowNotification } from '../../app/actions/game-notification-actions';
import { findGamesInNext24Hours } from '../../app/db/game-repository';
import { sendNotification } from '../../app/actions/notifiaction-actions';

// Mock environment variables
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public-key';
process.env.VAPID_PRIVATE_KEY = 'test-private-key';

// Mock web-push
jest.mock('web-push', () => ({
  sendNotification: jest.fn(),
  setVapidDetails: jest.fn(),
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock the database
jest.mock('../../app/db/database', () => ({
  db: {
    selectFrom: jest.fn(),
    insertInto: jest.fn(),
    updateTable: jest.fn(),
    deleteFrom: jest.fn(),
  }
}));

// Mock user actions
jest.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: jest.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
}));

// Mock the dependencies
jest.mock('../../app/db/game-repository');
jest.mock('../../app/actions/notifiaction-actions');

describe('Game Notification Actions', () => {
  const mockTournamentId = 'tournament-1';
  const mockGames = [
    {
      id: 'game-1',
      game_number: 1,
      home_team: 'Team A',
      away_team: 'Team B',
      game_date: new Date('2024-06-15T15:00:00Z'),
      game_local_timezone: 'America/New_York',
      location: 'Stadium 1'
    },
    {
      id: 'game-2',
      game_number: 2,
      home_team: 'Team C',
      away_team: 'Team D',
      game_date: new Date('2024-06-15T18:00:00Z'),
      game_local_timezone: 'America/New_York',
      location: 'Stadium 2'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variable
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  it('should return early if no games are found', async () => {
    (findGamesInNext24Hours as jest.Mock).mockResolvedValue([]);

    const result = await sendGamesTomorrowNotification(mockTournamentId);

    expect(result).toEqual({
      success: true,
      message: 'No hay partidos en las próximas 24 horas'
    });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('should send notification with correct format when games are found', async () => {
    (findGamesInNext24Hours as jest.Mock).mockResolvedValue(mockGames);
    (sendNotification as jest.Mock).mockResolvedValue({ success: true });

    await sendGamesTomorrowNotification(mockTournamentId);

    expect(sendNotification).toHaveBeenCalledWith(
      'Partidos de Mañana (2)',
      expect.stringContaining('Estos son los partidos programados para mañana:'),
      'https://example.com/tournaments/tournament-1',
      null,
      true
    );

    // Verify the message contains both games
    const notificationCall = (sendNotification as jest.Mock).mock.calls[0];
    const message = notificationCall[1];
    expect(message).toContain('Team A vs Team B');
    expect(message).toContain('Team C vs Team D');
  });

  it('should handle games with undefined teams', async () => {
    const gamesWithUndefinedTeams = [
      {
        ...mockGames[0],
        home_team: undefined,
        away_team: undefined
      }
    ];
    (findGamesInNext24Hours as jest.Mock).mockResolvedValue(gamesWithUndefinedTeams);

    await sendGamesTomorrowNotification(mockTournamentId);

    const notificationCall = (sendNotification as jest.Mock).mock.calls[0];
    const message = notificationCall[1];
    expect(message).toContain('Equipos por definir');
  });

  it('should handle errors from findGamesInNext24Hours', async () => {
    (findGamesInNext24Hours as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(sendGamesTomorrowNotification(mockTournamentId))
      .rejects
      .toThrow('Database error');
  });

  it('should handle errors from sendNotification', async () => {
    (findGamesInNext24Hours as jest.Mock).mockResolvedValue(mockGames);
    (sendNotification as jest.Mock).mockRejectedValue(new Error('Notification error'));

    await expect(sendGamesTomorrowNotification(mockTournamentId))
      .rejects
      .toThrow('Notification error');
  });
}); 