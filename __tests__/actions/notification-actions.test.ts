import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  subscribeUser,
  unsubscribeUser,
  sendNotification,
  sendGroupNotification
} from '../../app/actions/notifiaction-actions';
import * as userActions from '../../app/actions/user-actions';
import * as usersRepository from '../../app/db/users-repository';
import * as prodeGroupRepository from '../../app/db/prode-group-repository';
import * as webPush from 'web-push';

vi.mock('../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

vi.mock('../../app/db/users-repository', () => ({
  addNotificationSubscription: vi.fn(),
  removeNotificationSubscription: vi.fn(),
  findUserById: vi.fn(),
  findUsersByIds: vi.fn(),
  findUsersWithNotificationSubscriptions: vi.fn(),
}));

vi.mock('../../app/db/prode-group-repository', () => ({
  findParticipantsInGroup: vi.fn(),
  findProdeGroupById: vi.fn(),
}));

vi.mock('web-push', () => ({
  sendNotification: vi.fn(),
  setVapidDetails: vi.fn(),
}));

const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockAddNotificationSubscription = vi.mocked(usersRepository.addNotificationSubscription);
const mockRemoveNotificationSubscription = vi.mocked(usersRepository.removeNotificationSubscription);
const mockFindUserById = vi.mocked(usersRepository.findUserById);
const mockFindUsersByIds = vi.mocked(usersRepository.findUsersByIds);
const mockFindUsersWithNotificationSubscriptions = vi.mocked(usersRepository.findUsersWithNotificationSubscriptions);
const mockFindParticipantsInGroup = vi.mocked(prodeGroupRepository.findParticipantsInGroup);
const mockFindProdeGroupById = vi.mocked(prodeGroupRepository.findProdeGroupById);
const mockWebPushSendNotification = vi.mocked(webPush.sendNotification);

describe('Notification Actions', () => {
  const mockUser = { 
    id: 'user1', 
    email: 'test@example.com',
    emailVerified: new Date(),
    name: 'Test User' 
  };
  const mockSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test',
    keys: {
      p256dh: 'test-p256dh',
      auth: 'test-auth'
    }
  };

  const mockUserWithSubscriptions = {
    id: 'user1',
    email: 'test@example.com',
    nickname: 'Test User',
    password_hash: 'hash',
    is_admin: false,
    reset_token: null,
    reset_token_expiration: null,
    email_verified: true,
    verification_token: null,
    verification_token_expiration: null,
    notification_subscriptions: [mockSubscription]
  };

  const mockUserWithoutSubscriptions = {
    id: 'user2',
    email: 'test2@example.com',
    nickname: 'Test User 2',
    password_hash: 'hash',
    is_admin: false,
    reset_token: null,
    reset_token_expiration: null,
    email_verified: true,
    verification_token: null,
    verification_token_expiration: null,
    notification_subscriptions: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public-key';
    process.env.VAPID_PRIVATE_KEY = 'test-private-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    
    mockGetLoggedInUser.mockResolvedValue(mockUser);
    mockAddNotificationSubscription.mockResolvedValue(undefined);
    mockRemoveNotificationSubscription.mockResolvedValue(undefined);
    mockFindUserById.mockResolvedValue(mockUserWithSubscriptions);
    mockFindUsersByIds.mockResolvedValue([mockUserWithSubscriptions]);
    mockFindUsersWithNotificationSubscriptions.mockResolvedValue([mockUserWithSubscriptions]);
    mockFindParticipantsInGroup.mockResolvedValue([
      { user_id: 'user2', is_admin: false },
      { user_id: 'user3', is_admin: false }
    ]);
    mockFindProdeGroupById.mockResolvedValue({
      id: 'group1',
      owner_user_id: 'user1',
      name: 'Test Group',
      theme: undefined
    });
    mockWebPushSendNotification.mockResolvedValue({ 
      statusCode: 201,
      body: 'body',
      headers: {}
    });
  });

  describe('subscribeUser', () => {
    it('subscribes user successfully', async () => {
      const result = await subscribeUser(mockSubscription);
      expect(result).toEqual({ success: true });
      expect(mockAddNotificationSubscription).toHaveBeenCalledWith(mockUser.id, mockSubscription);
    });

    it('throws error if user not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);
      await expect(subscribeUser(mockSubscription)).rejects.toThrow('User not logged in');
    });
  });

  describe('unsubscribeUser', () => {
    it('unsubscribes user successfully', async () => {
      const result = await unsubscribeUser(mockSubscription);
      expect(result).toEqual({ success: true });
      expect(mockRemoveNotificationSubscription).toHaveBeenCalledWith(mockUser.id, mockSubscription);
    });

    it('throws error if user not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);
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
      mockFindUsersByIds.mockResolvedValue([
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
      mockFindUserById.mockResolvedValue(mockUserWithoutSubscriptions);
      const result = await sendNotification('Test Title', 'Test Message', '/test-url', 'user1');
      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(1);
    });

    it('handles push notification errors', async () => {
      mockWebPushSendNotification.mockRejectedValue(new Error('Push error'));
      const result = await sendNotification('Test Title', 'Test Message', '/test-url', 'user1');
      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(0); // The error is caught and handled, not counted as errorCount
    });

    it('handles 404 subscription errors and removes subscription', async () => {
      const error404 = new Error('404');
      (error404 as any).statusCode = 404;
      mockWebPushSendNotification.mockRejectedValue(error404);
      
      const result = await sendNotification('Test Title', 'Test Message', '/test-url', 'user1');
      expect(mockRemoveNotificationSubscription).toHaveBeenCalledWith('user1', mockSubscription);
      expect(result.success).toBe(false);
    });

    it('handles mixed success and failure results', async () => {
      mockFindUsersByIds.mockResolvedValue([
        mockUserWithSubscriptions,
        mockUserWithoutSubscriptions
      ]);
      const result = await sendNotification('Test Title', 'Test Message', '/test-url', ['user1', 'user2']);
      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(1);
      expect(result.errorCount).toBe(1);
    });

    it('throws error when users not found', async () => {
      mockFindUserById.mockResolvedValue(undefined);
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
      expect(mockFindUsersByIds).toHaveBeenCalledWith(['user2', 'user3']);
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
      expect(mockFindUsersByIds).toHaveBeenCalledWith(['user2', 'user3']);
    });

    it('excludes sender from recipients', async () => {
      await sendGroupNotification({
        groupId: 'group1',
        tournamentId: 'tournament1',
        targetPage: 'tournament',
        title: 'Test Title',
        message: 'Test Message',
        senderId: 'user2'
      });

      // Verify that sendNotification was called with the correct parameters
      expect(mockFindUsersByIds).toHaveBeenCalledWith(['user1', 'user3']);
    });

    it('handles group with only owner and sender', async () => {
      mockFindParticipantsInGroup.mockResolvedValue([
        { user_id: 'user1', is_admin: false }
      ]);
      
      await sendGroupNotification({
        groupId: 'group1',
        tournamentId: 'tournament1',
        targetPage: 'tournament',
        title: 'Test Title',
        message: 'Test Message',
        senderId: 'user1'
      });

      // Verify that sendNotification was called with empty array
      expect(mockFindUsersByIds).toHaveBeenCalledWith([]);
    });
  });
}); 