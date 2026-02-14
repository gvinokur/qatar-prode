import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { User, UserNew, UserUpdate } from '../../app/db/tables-definition';
import { PushSubscription } from 'web-push';

// Create hoisted mocks for base functions - these need to be available before module import
const mockBaseFunctions = vi.hoisted(() => ({
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
}));

// Mock the database connection
vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
    updateTable: vi.fn(),
    insertInto: vi.fn(),
    deleteFrom: vi.fn()
  }
}));

// Mock the base repository functions with hoisted mocks
vi.mock('../../app/db/base-repository', () => ({
  createBaseFunctions: vi.fn(() => mockBaseFunctions)
}));

vi.mock('crypto-js/sha256', () => ({
  default: vi.fn(() => ({
    toString: vi.fn(() => 'mocked-hash')
  }))
}));

vi.mock('react', () => ({
  cache: vi.fn((fn) => fn)
}));

// Import after mocking
import * as usersRepository from '../../app/db/users-repository';
import { db } from '../../app/db/database';

describe('Users Repository', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    nickname: 'testuser',
    password_hash: 'hashed-password',
    is_admin: false,
    reset_token: null,
    reset_token_expiration: null,
    email_verified: false,
    verification_token: 'verification-token',
    verification_token_expiration: new Date(Date.now() + 24 * 60 * 60 * 1000),
    notification_subscriptions: null,
    onboarding_completed: false,
    onboarding_completed_at: null,
    onboarding_data: null
  };

  const mockNewUser: UserNew = {
    email: 'new@example.com',
    password_hash: 'hashed-password',
    nickname: 'newuser',
    email_verified: false,
    verification_token: 'verification-token',
    verification_token_expiration: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };

  const mockUserUpdate: UserUpdate = {
    nickname: 'updated-nickname',
    email_verified: true
  };

  const mockPushSubscription: PushSubscription = {
    endpoint: 'https://example.com/endpoint',
    expirationTime: null,
    keys: {
      p256dh: 'test-key',
      auth: 'test-auth'
    }
  };

  // Declare mock variables
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SALT = 'test-salt';
    
    // Get mocked instances
    mockDb = vi.mocked(db);
    
    // Setup default mock implementations
    mockDb.selectFrom.mockReturnValue({
      where: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
      executeTakeFirst: vi.fn().mockResolvedValue(null)
    });

    mockDb.updateTable.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn().mockResolvedValue(null)
    });

    mockDb.insertInto.mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      executeTakeFirstOrThrow: vi.fn().mockResolvedValue(mockUser)
    });

    mockDb.deleteFrom.mockReturnValue({
      where: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      executeTakeFirstOrThrow: vi.fn().mockResolvedValue(mockUser)
    });

    // Setup base functions defaults
    mockBaseFunctions.findById.mockResolvedValue(null);
    mockBaseFunctions.create.mockResolvedValue(mockUser);
    mockBaseFunctions.update.mockResolvedValue(mockUser);
    mockBaseFunctions.delete.mockResolvedValue(mockUser);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SALT;
  });

  describe('Base CRUD Operations', () => {
    describe('findUserById', () => {
      it('should call base findById function', async () => {
        mockBaseFunctions.findById.mockResolvedValue(mockUser);

        const result = await usersRepository.findUserById('user-123');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('user-123');
        expect(result).toBe(mockUser);
      });

      it('should return null when user not found', async () => {
        mockBaseFunctions.findById.mockResolvedValue(null);

        const result = await usersRepository.findUserById('nonexistent-id');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('nonexistent-id');
        expect(result).toBeNull();
      });
    });

    describe('createUser', () => {
      it('should call base create function', async () => {
        mockBaseFunctions.create.mockResolvedValue(mockUser);

        const result = await usersRepository.createUser(mockNewUser);

        expect(mockBaseFunctions.create).toHaveBeenCalledWith(mockNewUser);
        expect(result).toBe(mockUser);
      });

      it('should throw error when creation fails', async () => {
        const error = new Error('Database error');
        mockBaseFunctions.create.mockRejectedValue(error);

        await expect(usersRepository.createUser(mockNewUser)).rejects.toThrow('Database error');
      });
    });

    describe('updateUser', () => {
      it('should call base update function', async () => {
        mockBaseFunctions.update.mockResolvedValue(mockUser);

        const result = await usersRepository.updateUser('user-123', mockUserUpdate);

        expect(mockBaseFunctions.update).toHaveBeenCalledWith('user-123', mockUserUpdate);
        expect(result).toBe(mockUser);
      });

      it('should throw error when update fails', async () => {
        const error = new Error('Update failed');
        mockBaseFunctions.update.mockRejectedValue(error);

        await expect(usersRepository.updateUser('user-123', mockUserUpdate)).rejects.toThrow('Update failed');
      });
    });

    describe('deleteUser', () => {
      it('should call base delete function', async () => {
        mockBaseFunctions.delete.mockResolvedValue(mockUser);

        const result = await usersRepository.deleteUser('user-123');

        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('user-123');
        expect(result).toBe(mockUser);
      });

      it('should throw error when deletion fails', async () => {
        const error = new Error('Delete failed');
        mockBaseFunctions.delete.mockRejectedValue(error);

        await expect(usersRepository.deleteUser('user-123')).rejects.toThrow('Delete failed');
      });
    });
  });

  describe('User Lookup Functions', () => {
    describe('findUserByEmail', () => {
      it('should find user by email', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockUser)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUserByEmail('test@example.com');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
        expect(mockQuery.where).toHaveBeenCalledWith('email', '=', 'test@example.com');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toBe(mockUser);
      });

      it('should return null when user not found', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(null)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUserByEmail('nonexistent@example.com');

        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockRejectedValue(new Error('Database error'))
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        await expect(usersRepository.findUserByEmail('test@example.com')).rejects.toThrow('Database error');
      });
    });

    describe('findUsersByIds', () => {
      it('should find users by multiple IDs', async () => {
        const mockUsers = [mockUser, { ...mockUser, id: 'user-456' }];
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockUsers)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUsersByIds(['user-123', 'user-456']);

        expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.where).toHaveBeenCalledWith('id', 'in', ['user-123', 'user-456']);
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockUsers);
      });

      it('should return empty array when no users found', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([])
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUsersByIds(['nonexistent-id']);

        expect(result).toEqual([]);
      });

      it('should handle empty input array', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([])
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUsersByIds([]);

        expect(mockQuery.where).toHaveBeenCalledWith('id', 'in', []);
        expect(result).toEqual([]);
      });
    });

    describe('findUserByResetToken', () => {
      it('should find user by reset token', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockUser)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUserByResetToken('reset-token');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
        expect(mockQuery.where).toHaveBeenCalledWith('reset_token', '=', 'reset-token');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toBe(mockUser);
      });

      it('should return null when token not found', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(null)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUserByResetToken('invalid-token');

        expect(result).toBeNull();
      });
    });

    describe('findAllUsers', () => {
      it('should return all users with selected fields ordered by email', async () => {
        const mockUsers = [
          { id: 'user-1', email: 'a@example.com', nickname: 'Alice', is_admin: false },
          { id: 'user-2', email: 'b@example.com', nickname: 'Bob', is_admin: true },
          { id: 'user-3', email: 'c@example.com', nickname: null, is_admin: false }
        ];
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockUsers)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findAllUsers();

        expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
        expect(mockQuery.select).toHaveBeenCalledWith(['id', 'email', 'nickname', 'is_admin']);
        expect(mockQuery.orderBy).toHaveBeenCalledWith('email', 'asc');
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockUsers);
      });

      it('should return empty array when no users exist', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([])
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findAllUsers();

        expect(result).toEqual([]);
      });

      it('should handle database errors', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockRejectedValue(new Error('Database error'))
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        await expect(usersRepository.findAllUsers()).rejects.toThrow('Database error');
      });

      it('should include users with null nicknames', async () => {
        const mockUsers = [
          { id: 'user-1', email: 'user@example.com', nickname: null, is_admin: false }
        ];
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockUsers)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findAllUsers();

        expect(result).toEqual(mockUsers);
        expect(result[0].nickname).toBeNull();
      });

      it('should include admin status for all users', async () => {
        const mockUsers = [
          { id: 'user-1', email: 'admin@example.com', nickname: 'Admin', is_admin: true },
          { id: 'user-2', email: 'user@example.com', nickname: 'User', is_admin: false }
        ];
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockUsers)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findAllUsers();

        expect(result[0].is_admin).toBe(true);
        expect(result[1].is_admin).toBe(false);
      });
    });
  });

  describe('Password Hashing', () => {
    describe('getPasswordHash', () => {
      it('should generate password hash with salt', () => {
        const result = usersRepository.getPasswordHash('password123');
        expect(result).toBe('mocked-hash');
      });

      it('should handle empty salt', () => {
        delete process.env.NEXT_PUBLIC_SALT;
        
        const result = usersRepository.getPasswordHash('password123');
        expect(result).toBe('mocked-hash');
      });
    });
  });

  describe('Email Verification', () => {
    describe('verifyEmail', () => {
      it('should verify email with valid token', async () => {
        const verifiedUser = { ...mockUser, email_verified: true };
        const mockQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(verifiedUser)
        };
        mockDb.updateTable.mockReturnValue(mockQuery);

        const result = await usersRepository.verifyEmail('verification-token');

        expect(mockDb.updateTable).toHaveBeenCalledWith('users');
        expect(mockQuery.set).toHaveBeenCalledWith({
          email_verified: true,
          verification_token: null,
          verification_token_expiration: null
        });
        expect(mockQuery.where).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.returningAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toBe(verifiedUser);
      });

      it('should return null when token is invalid or expired', async () => {
        const mockQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(null)
        };
        mockDb.updateTable.mockReturnValue(mockQuery);

        const result = await usersRepository.verifyEmail('invalid-token');

        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        const mockQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockRejectedValue(new Error('Database error'))
        };
        mockDb.updateTable.mockReturnValue(mockQuery);

        await expect(usersRepository.verifyEmail('verification-token')).rejects.toThrow('Database error');
      });
    });

    describe('findUserByVerificationToken', () => {
      it('should find user by verification token', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockUser)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUserByVerificationToken('verification-token');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
        expect(mockQuery.where).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toBe(mockUser);
      });

      it('should return null when token is invalid', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(null)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUserByVerificationToken('invalid-token');

        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockRejectedValue(new Error('Database error'))
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        await expect(usersRepository.findUserByVerificationToken('verification-token')).rejects.toThrow('Database error');
      });
    });
  });

  describe('Notification Subscriptions', () => {
    describe('addNotificationSubscription', () => {
      it('should add notification subscription to user', async () => {
        const userWithSubscription = { ...mockUser, notification_subscriptions: [mockPushSubscription] };
        
        // Mock the findUserById function used internally
        mockBaseFunctions.findById.mockResolvedValue(mockUser);
        
        const mockQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(userWithSubscription)
        };
        mockDb.updateTable.mockReturnValue(mockQuery);

        const result = await usersRepository.addNotificationSubscription('user-123', mockPushSubscription);

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('user-123');
        expect(mockDb.updateTable).toHaveBeenCalledWith('users');
        expect(mockQuery.set).toHaveBeenCalledWith({
          notification_subscriptions: JSON.stringify([mockPushSubscription])
        });
        expect(mockQuery.where).toHaveBeenCalledWith('id', '=', 'user-123');
        expect(result).toBe(userWithSubscription);
      });

      it('should add subscription to existing subscriptions', async () => {
        const existingSubscription = { ...mockPushSubscription, endpoint: 'https://existing.com' };
        const userWithExistingSubscriptions = { 
          ...mockUser, 
          notification_subscriptions: [existingSubscription] 
        };
        
        mockBaseFunctions.findById.mockResolvedValue(userWithExistingSubscriptions);
        
        const mockQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(userWithExistingSubscriptions)
        };
        mockDb.updateTable.mockReturnValue(mockQuery);

        await usersRepository.addNotificationSubscription('user-123', mockPushSubscription);

        expect(mockQuery.set).toHaveBeenCalledWith({
          notification_subscriptions: JSON.stringify([existingSubscription, mockPushSubscription])
        });
      });

      it('should throw error when user not found', async () => {
        mockBaseFunctions.findById.mockResolvedValue(null);

        await expect(usersRepository.addNotificationSubscription('user-123', mockPushSubscription))
          .rejects.toThrow('User not found');
        
        expect(mockDb.updateTable).not.toHaveBeenCalled();
      });

      it('should filter out invalid subscriptions', async () => {
        const invalidSubscription: PushSubscription = {
          endpoint: '',
          expirationTime: null,
          keys: { p256dh: 'test', auth: 'test' }
        };
        
        const userWithInvalidSubscriptions = { 
          ...mockUser, 
          notification_subscriptions: [invalidSubscription] 
        };
        
        mockBaseFunctions.findById.mockResolvedValue(userWithInvalidSubscriptions);
        
        const mockQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockUser)
        };
        mockDb.updateTable.mockReturnValue(mockQuery);

        await usersRepository.addNotificationSubscription('user-123', mockPushSubscription);

        // Should only include the valid subscription
        expect(mockQuery.set).toHaveBeenCalledWith({
          notification_subscriptions: JSON.stringify([mockPushSubscription])
        });
      });
    });

    describe('removeNotificationSubscription', () => {
      it('should remove notification subscription from user', async () => {
        const userWithSubscriptions = { 
          ...mockUser, 
          notification_subscriptions: [mockPushSubscription] 
        };
        
        mockBaseFunctions.findById.mockResolvedValue(userWithSubscriptions);
        
        const mockQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockUser)
        };
        mockDb.updateTable.mockReturnValue(mockQuery);

        const result = await usersRepository.removeNotificationSubscription('user-123', mockPushSubscription);

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('user-123');
        expect(mockDb.updateTable).toHaveBeenCalledWith('users');
        expect(mockQuery.set).toHaveBeenCalledWith({
          notification_subscriptions: JSON.stringify([])
        });
        expect(result).toBe(mockUser);
      });

      it('should handle user with no subscriptions', async () => {
        const userWithNoSubscriptions = { ...mockUser, notification_subscriptions: null };
        
        mockBaseFunctions.findById.mockResolvedValue(userWithNoSubscriptions);
        
        const mockQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockUser)
        };
        mockDb.updateTable.mockReturnValue(mockQuery);

        await usersRepository.removeNotificationSubscription('user-123', mockPushSubscription);

        expect(mockQuery.set).toHaveBeenCalledWith({
          notification_subscriptions: JSON.stringify([])
        });
      });

      it('should remove only matching subscription', async () => {
        const subscription1 = { ...mockPushSubscription, endpoint: 'https://endpoint1.com' };
        const subscription2 = { ...mockPushSubscription, endpoint: 'https://endpoint2.com' };
        
        const userWithMultipleSubscriptions = { 
          ...mockUser, 
          notification_subscriptions: [subscription1, subscription2] 
        };
        
        mockBaseFunctions.findById.mockResolvedValue(userWithMultipleSubscriptions);
        
        const mockQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockUser)
        };
        mockDb.updateTable.mockReturnValue(mockQuery);

        await usersRepository.removeNotificationSubscription('user-123', subscription1);

        expect(mockQuery.set).toHaveBeenCalledWith({
          notification_subscriptions: JSON.stringify([subscription2])
        });
      });

      it('should throw error when user not found', async () => {
        mockBaseFunctions.findById.mockResolvedValue(null);

        await expect(usersRepository.removeNotificationSubscription('user-123', mockPushSubscription))
          .rejects.toThrow('User not found');
        
        expect(mockDb.updateTable).not.toHaveBeenCalled();
      });
    });

    describe('getNotificationSubscriptions', () => {
      it('should get notification subscriptions for user', async () => {
        const userWithSubscriptions = { 
          ...mockUser, 
          notification_subscriptions: [mockPushSubscription] 
        };
        
        mockBaseFunctions.findById.mockResolvedValue(userWithSubscriptions);

        const result = await usersRepository.getNotificationSubscriptions('user-123');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('user-123');
        expect(result).toEqual([mockPushSubscription]);
      });

      it('should return empty array when user has no subscriptions', async () => {
        const userWithNoSubscriptions = { ...mockUser, notification_subscriptions: null };
        
        mockBaseFunctions.findById.mockResolvedValue(userWithNoSubscriptions);

        const result = await usersRepository.getNotificationSubscriptions('user-123');

        expect(result).toEqual([]);
      });

      it('should throw error when user not found', async () => {
        mockBaseFunctions.findById.mockResolvedValue(null);

        await expect(usersRepository.getNotificationSubscriptions('user-123'))
          .rejects.toThrow('User not found');
      });
    });

    describe('findUsersWithNotificationSubscriptions', () => {
      it('should find users with notification subscriptions', async () => {
        const usersWithSubscriptions = [
          { ...mockUser, notification_subscriptions: [mockPushSubscription] }
        ];
        
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(usersWithSubscriptions)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUsersWithNotificationSubscriptions();

        expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
        expect(mockQuery.where).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(usersWithSubscriptions);
      });

      it('should return empty array when no users have subscriptions', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([])
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUsersWithNotificationSubscriptions();

        expect(result).toEqual([]);
      });

      it('should handle database errors', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          execute: vi.fn().mockRejectedValue(new Error('Database error'))
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        await expect(usersRepository.findUsersWithNotificationSubscriptions())
          .rejects.toThrow('Database error');
      });
    });
  });

  describe('OAuth Functions', () => {
    const mockOAuthAccount = {
      provider: 'google',
      provider_user_id: 'google-123',
      email: 'oauth@example.com',
      connected_at: new Date().toISOString()
    };

    const mockOAuthUser: User = {
      ...mockUser,
      password_hash: null,
      auth_providers: ['google'],
      oauth_accounts: [mockOAuthAccount],
      email_verified: true,
      nickname_setup_required: false
    };

    describe('findUserByOAuthAccount', () => {
      it('should find user by OAuth provider and provider user ID', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockOAuthUser)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUserByOAuthAccount('google', 'google-123');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
        expect(mockQuery.where).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toBe(mockOAuthUser);
      });

      it('should return undefined when OAuth account not found', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(undefined)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.findUserByOAuthAccount('google', 'nonexistent-id');

        expect(result).toBeUndefined();
      });

      it('should handle different OAuth providers', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockOAuthUser)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        await usersRepository.findUserByOAuthAccount('github', 'github-456');

        expect(mockQuery.where).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should handle database errors', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockRejectedValue(new Error('Database error'))
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        await expect(usersRepository.findUserByOAuthAccount('google', 'google-123'))
          .rejects.toThrow('Database error');
      });
    });

    describe('linkOAuthAccount', () => {
      it('should link OAuth account to existing user', async () => {
        const existingUser = { ...mockUser, auth_providers: ['credentials'], oauth_accounts: [] };
        const linkedUser = {
          ...existingUser,
          auth_providers: ['credentials', 'google'],
          oauth_accounts: [mockOAuthAccount]
        };

        mockBaseFunctions.findById.mockResolvedValue(existingUser);

        const mockQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(linkedUser)
        };
        mockDb.updateTable.mockReturnValue(mockQuery);

        const result = await usersRepository.linkOAuthAccount('user-123', mockOAuthAccount);

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('user-123');
        expect(mockDb.updateTable).toHaveBeenCalledWith('users');
        expect(mockQuery.set).toHaveBeenCalledWith({
          oauth_accounts: JSON.stringify([mockOAuthAccount]),
          auth_providers: JSON.stringify(['credentials', 'google'])
        });
        expect(mockQuery.where).toHaveBeenCalledWith('id', '=', 'user-123');
        expect(result).toBe(linkedUser);
      });

      it('should not duplicate provider in auth_providers', async () => {
        const existingUser = {
          ...mockUser,
          auth_providers: ['credentials', 'google'],
          oauth_accounts: [mockOAuthAccount]
        };

        const secondOAuthAccount = {
          provider: 'google',
          provider_user_id: 'google-456',
          email: 'another@example.com',
          connected_at: new Date().toISOString()
        };

        mockBaseFunctions.findById.mockResolvedValue(existingUser);

        const mockQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(existingUser)
        };
        mockDb.updateTable.mockReturnValue(mockQuery);

        await usersRepository.linkOAuthAccount('user-123', secondOAuthAccount);

        expect(mockQuery.set).toHaveBeenCalledWith({
          oauth_accounts: JSON.stringify([mockOAuthAccount, secondOAuthAccount]),
          auth_providers: JSON.stringify(['credentials', 'google'])
        });
      });

      it('should throw error when user not found', async () => {
        mockBaseFunctions.findById.mockResolvedValue(null);

        await expect(usersRepository.linkOAuthAccount('user-123', mockOAuthAccount))
          .rejects.toThrow('User not found');

        expect(mockDb.updateTable).not.toHaveBeenCalled();
      });

      it('should handle null oauth_accounts and auth_providers', async () => {
        const existingUser = {
          ...mockUser,
          auth_providers: null,
          oauth_accounts: null
        };

        mockBaseFunctions.findById.mockResolvedValue(existingUser);

        const mockQuery = {
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(existingUser)
        };
        mockDb.updateTable.mockReturnValue(mockQuery);

        await usersRepository.linkOAuthAccount('user-123', mockOAuthAccount);

        expect(mockQuery.set).toHaveBeenCalledWith({
          oauth_accounts: JSON.stringify([mockOAuthAccount]),
          auth_providers: JSON.stringify(['google'])
        });
      });
    });

    describe('createOAuthUser', () => {
      it('should create OAuth user with display name', async () => {
        const mockQuery = {
          values: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockOAuthUser)
        };
        mockDb.insertInto.mockReturnValue(mockQuery);

        const result = await usersRepository.createOAuthUser(
          'oauth@example.com',
          mockOAuthAccount,
          'OAuth User'
        );

        expect(mockDb.insertInto).toHaveBeenCalledWith('users');
        expect(mockQuery.values).toHaveBeenCalledWith({
          email: 'oauth@example.com',
          nickname: 'OAuth User',
          password_hash: null,
          auth_providers: JSON.stringify(['google']),
          oauth_accounts: JSON.stringify([mockOAuthAccount]),
          email_verified: true,
          nickname_setup_required: false
        });
        expect(result).toBe(mockOAuthUser);
      });

      it('should set nickname_setup_required when display name is null', async () => {
        const userNeedingNickname = {
          ...mockOAuthUser,
          nickname: null,
          nickname_setup_required: true
        };

        const mockQuery = {
          values: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(userNeedingNickname)
        };
        mockDb.insertInto.mockReturnValue(mockQuery);

        const result = await usersRepository.createOAuthUser(
          'oauth@example.com',
          mockOAuthAccount,
          null
        );

        expect(mockQuery.values).toHaveBeenCalledWith({
          email: 'oauth@example.com',
          nickname: null,
          password_hash: null,
          auth_providers: JSON.stringify(['google']),
          oauth_accounts: JSON.stringify([mockOAuthAccount]),
          email_verified: true,
          nickname_setup_required: true
        });
        expect(result).toBe(userNeedingNickname);
      });

      it('should handle database errors', async () => {
        const mockQuery = {
          values: vi.fn().mockReturnThis(),
          returningAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockRejectedValue(new Error('Insert failed'))
        };
        mockDb.insertInto.mockReturnValue(mockQuery);

        await expect(usersRepository.createOAuthUser(
          'oauth@example.com',
          mockOAuthAccount,
          'OAuth User'
        )).rejects.toThrow('Insert failed');
      });
    });

    describe('getAuthMethodsForEmail', () => {
      it('should return hasPassword=true for credentials user', async () => {
        const credentialsUser = {
          ...mockUser,
          auth_providers: ['credentials'],
          oauth_accounts: []
        };

        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(credentialsUser)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.getAuthMethodsForEmail('test@example.com');

        expect(result).toEqual({
          hasPassword: true,
          hasGoogle: false,
          userExists: true
        });
      });

      it('should return hasGoogle=true for OAuth user', async () => {
        const googleUser = {
          ...mockOAuthUser,
          auth_providers: ['google'],
          oauth_accounts: [mockOAuthAccount]
        };

        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(googleUser)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.getAuthMethodsForEmail('oauth@example.com');

        expect(result).toEqual({
          hasPassword: false,
          hasGoogle: true,
          userExists: true
        });
      });

      it('should return both true for linked account', async () => {
        const linkedUser = {
          ...mockUser,
          auth_providers: ['credentials', 'google'],
          oauth_accounts: [mockOAuthAccount]
        };

        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(linkedUser)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.getAuthMethodsForEmail('linked@example.com');

        expect(result).toEqual({
          hasPassword: true,
          hasGoogle: true,
          userExists: true
        });
      });

      it('should return userExists=false when user not found', async () => {
        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(undefined)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.getAuthMethodsForEmail('nonexistent@example.com');

        expect(result).toEqual({
          hasPassword: false,
          hasGoogle: false,
          userExists: false
        });
      });

      it('should handle null auth_providers', async () => {
        const userWithNullProviders = { ...mockUser, auth_providers: null };

        const mockQuery = {
          where: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(userWithNullProviders)
        };
        mockDb.selectFrom.mockReturnValue(mockQuery);

        const result = await usersRepository.getAuthMethodsForEmail('test@example.com');

        expect(result).toEqual({
          hasPassword: false,
          hasGoogle: false,
          userExists: true
        });
      });
    });

    describe('getAuthProviders', () => {
      it('should return auth_providers array', () => {
        const user = { ...mockUser, auth_providers: ['credentials', 'google'] };

        const result = usersRepository.getAuthProviders(user);

        expect(result).toEqual(['credentials', 'google']);
      });

      it('should return empty array when auth_providers is null', () => {
        const user = { ...mockUser, auth_providers: null };

        const result = usersRepository.getAuthProviders(user);

        expect(result).toEqual([]);
      });

      it('should return empty array when auth_providers is undefined', () => {
        const user = { ...mockUser, auth_providers: undefined };

        const result = usersRepository.getAuthProviders(user);

        expect(result).toEqual([]);
      });
    });

    describe('userHasPasswordAuth', () => {
      it('should return true when password_hash exists', () => {
        const user = { ...mockUser, password_hash: 'hashed-password' };

        const result = usersRepository.userHasPasswordAuth(user);

        expect(result).toBe(true);
      });

      it('should return false when password_hash is null', () => {
        const user = { ...mockUser, password_hash: null };

        const result = usersRepository.userHasPasswordAuth(user);

        expect(result).toBe(false);
      });

      it('should return false for OAuth-only user', () => {
        const result = usersRepository.userHasPasswordAuth(mockOAuthUser);

        expect(result).toBe(false);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null)
      };
      mockDb.selectFrom.mockReturnValue(mockQuery);

      const result = await usersRepository.findUserByEmail('');
      expect(result).toBeNull();
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'test+user@example.com';
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockUser)
      };
      mockDb.selectFrom.mockReturnValue(mockQuery);

      const result = await usersRepository.findUserByEmail(specialEmail);
      
      expect(mockQuery.where).toHaveBeenCalledWith('email', '=', specialEmail);
      expect(result).toBe(mockUser);
    });

    it('should handle database connection errors', async () => {
      mockDb.selectFrom.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(usersRepository.findUserByEmail('test@example.com'))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle transaction rollback', async () => {
      const mockQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockRejectedValue(new Error('Transaction rolled back'))
      };
      mockDb.updateTable.mockReturnValue(mockQuery);

      await expect(usersRepository.verifyEmail('token'))
        .rejects.toThrow('Transaction rolled back');
    });
  });
});
