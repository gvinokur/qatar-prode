import {
  subscribeUser,
  unsubscribeUser,
  sendNotification,
  sendGroupNotification
} from '../../app/actions/notifiaction-actions';

jest.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: jest.fn(),
}));

jest.mock('../../app/db/users-repository', () => ({
  addNotificationSubscription: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  findUserById: jest.fn(),
  findUsersByIds: jest.fn(),
  findUsersWithNotificationSubscriptions: jest.fn(),
}));

jest.mock('../../app/db/prode-group-repository', () => ({
  findParticipantsInGroup: jest.fn(),
  findProdeGroupById: jest.fn(),
}));

jest.mock('web-push', () => ({
  sendNotification: jest.fn(),
  setVapidDetails: jest.fn(),
}));

describe('Notification Actions', () => {
  const mockUser = { id: 'user1', name: 'Test User' };
  const mockSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test',
    keys: {
      p256dh: 'test-p256dh',
      auth: 'test-auth'
    }
  };

  const mockUserWithSubscriptions = {
    id: 'user1',
    name: 'Test User',
    notification_subscriptions: [mockSubscription]
  };

  const mockUserWithoutSubscriptions = {
    id: 'user2',
    name: 'Test User 2',
    notification_subscriptions: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public-key';
    process.env.VAPID_PRIVATE_KEY = 'test-private-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    
    require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(mockUser);
    require('../../app/db/users-repository').addNotificationSubscription.mockResolvedValue(undefined);
    require('../../app/db/users-repository').removeNotificationSubscription.mockResolvedValue(undefined);
    require('../../app/db/users-repository').findUserById.mockResolvedValue(mockUserWithSubscriptions);
    require('../../app/db/users-repository').findUsersByIds.mockResolvedValue([mockUserWithSubscriptions]);
    require('../../app/db/users-repository').findUsersWithNotificationSubscriptions.mockResolvedValue([mockUserWithSubscriptions]);
    require('../../app/db/prode-group-repository').findParticipantsInGroup.mockResolvedValue([
      { user_id: 'user2' },
      { user_id: 'user3' }
    ]);
    require('../../app/db/prode-group-repository').findProdeGroupById.mockResolvedValue({
      id: 'group1',
      owner_user_id: 'user1'
    });
    require('web-push').sendNotification.mockResolvedValue({ statusCode: 201 });
  });

  describe('subscribeUser', () => {
    it('subscribes user successfully', async () => {
      const result = await subscribeUser(mockSubscription);
      expect(result).toEqual({ success: true });
      expect(require('../../app/db/users-repository').addNotificationSubscription).toHaveBeenCalledWith(mockUser.id, mockSubscription);
    });

    it('throws error if user not logged in', async () => {
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(null);
      await expect(subscribeUser(mockSubscription)).rejects.toThrow('User not logged in');
    });
  });

  describe('unsubscribeUser', () => {
    it('unsubscribes user successfully', async () => {
      const result = await unsubscribeUser(mockSubscription);
      expect(result).toEqual({ success: true });
      expect(require('../../app/db/users-repository').removeNotificationSubscription).toHaveBeenCalledWith(mockUser.id, mockSubscription);
    });

    it('throws error if user not logged in', async () => {
      require('../../app/actions/user-actions').getLoggedInUser.mockResolvedValue(null);
      await expect(unsubscribeUser(mockSubscription)).rejects.toThrow('User not logged in');
    });
  });

  describe('sendNotification', () => {
    it('sends notification to single user by ID', async () => {
      const result = await sendNotification('Test Title', 'Test Message', '/test-url', 'user1');
      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(1);
      expect(result.errorCount).toBe(0);
    });

    it('sends notification to multiple users by IDs', async () => {
      require('../../app/db/users-repository').findUsersByIds.mockResolvedValue([
        mockUserWithSubscriptions,
        mockUserWithSubscriptions
      ]);
      const result = await sendNotification('Test Title', 'Test Message', '/test-url', ['user1', 'user2']);
      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(2);
    });

    it('sends notification to all users', async () => {
      const result = await sendNotification('Test Title', 'Test Message', '/test-url', null, true);
      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(1);
    });

    it('handles user with no subscriptions', async () => {
      require('../../app/db/users-repository').findUserById.mockResolvedValue(mockUserWithoutSubscriptions);
      const result = await sendNotification('Test Title', 'Test Message', '/test-url', 'user1');
      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(1);
    });

    it('handles push notification errors', async () => {
      require('web-push').sendNotification.mockRejectedValue(new Error('Push error'));
      const result = await sendNotification('Test Title', 'Test Message', '/test-url', 'user1');
      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(0); // The error is caught and handled, not counted as errorCount
    });

    it('handles 404 subscription errors and removes subscription', async () => {
      const error404 = new Error('404');
      (error404 as any).statusCode = 404;
      require('web-push').sendNotification.mockRejectedValue(error404);
      
      const result = await sendNotification('Test Title', 'Test Message', '/test-url', 'user1');
      expect(require('../../app/db/users-repository').removeNotificationSubscription).toHaveBeenCalledWith('user1', mockSubscription);
      expect(result.success).toBe(false);
    });

    it('handles mixed success and failure results', async () => {
      require('../../app/db/users-repository').findUsersByIds.mockResolvedValue([
        mockUserWithSubscriptions,
        mockUserWithoutSubscriptions
      ]);
      const result = await sendNotification('Test Title', 'Test Message', '/test-url', ['user1', 'user2']);
      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(1);
      expect(result.errorCount).toBe(1);
    });

    it('throws error when users not found', async () => {
      require('../../app/db/users-repository').findUserById.mockResolvedValue(null);
      await expect(sendNotification('Test Title', 'Test Message', '/test-url', 'user1')).rejects.toThrow('Users not found');
    });
  });

  describe('sendGroupNotification', () => {
    it('sends notification to tournament page', async () => {
      await sendGroupNotification({
        groupId: 'group1',
        tournamentId: 'tournament1',
        targetPage: 'tournament',
        title: 'Test Title',
        message: 'Test Message',
        senderId: 'user1'
      });

      // Verify that sendNotification was called with the correct parameters
      expect(require('../../app/db/users-repository').findUsersByIds).toHaveBeenCalledWith(['user2', 'user3']);
    });

    it('sends notification to friends group page', async () => {
      await sendGroupNotification({
        groupId: 'group1',
        tournamentId: 'tournament1',
        targetPage: 'friends-group',
        title: 'Test Title',
        message: 'Test Message',
        senderId: 'user1'
      });

      // Verify that sendNotification was called with the correct parameters
      expect(require('../../app/db/users-repository').findUsersByIds).toHaveBeenCalledWith(['user2', 'user3']);
    });

    it('excludes sender from recipients', async () => {
      await sendGroupNotification({
        groupId: 'group1',
        tournamentId: 'tournament1',
        targetPage: 'tournament',
        title: 'Test Title',
        message: 'Test Message',
        senderId: 'user2' // This user is a participant
      });

      // Verify that sendNotification was called with the correct parameters (excluding sender)
      expect(require('../../app/db/users-repository').findUsersByIds).toHaveBeenCalledWith(['user1', 'user3']);
    });

    it('handles group with only owner and sender', async () => {
      require('../../app/db/prode-group-repository').findParticipantsInGroup.mockResolvedValue([]);
      
      await sendGroupNotification({
        groupId: 'group1',
        tournamentId: 'tournament1',
        targetPage: 'tournament',
        title: 'Test Title',
        message: 'Test Message',
        senderId: 'user1' // Owner is sender
      });

      // Verify that sendNotification was called with empty recipients array
      expect(require('../../app/db/users-repository').findUsersByIds).toHaveBeenCalledWith([]);
    });
  });
}); 