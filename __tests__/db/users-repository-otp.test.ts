import { vi, describe, it, expect, beforeEach } from 'vitest';
import { User } from '../../app/db/tables-definition';
import { testFactories } from './test-factories';

// Create hoisted mocks for base functions
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
    insertInto: vi.fn()
  }
}));

// Mock the base repository functions
vi.mock('../../app/db/base-repository', () => ({
  createBaseFunctions: vi.fn(() => mockBaseFunctions)
}));

vi.mock('react', () => ({
  cache: vi.fn((fn) => fn)
}));

// Import after mocking
import { generateOTP, verifyOTP, clearOTP, findUserByEmail, findUserById } from '../../app/db/users-repository';
import { db } from '../../app/db/database';

describe('Users Repository - OTP Functions', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
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
      executeTakeFirst: vi.fn().mockResolvedValue(null)
    });

    // Setup base functions defaults
    mockBaseFunctions.findById.mockResolvedValue(null);
    mockBaseFunctions.create.mockResolvedValue(testFactories.user());
    mockBaseFunctions.update.mockResolvedValue(testFactories.user());
    mockBaseFunctions.delete.mockResolvedValue(testFactories.user());
  });

  describe('generateOTP', () => {
    it('should return error when user does not exist and insertion fails', async () => {
      // User doesn't exist
      mockDb.selectFrom.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null)
      });

      // Insert fails
      mockDb.insertInto.mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null)
      });

      const result = await generateOTP('newuser@test.com');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
      expect(mockDb.insertInto).toHaveBeenCalledWith('users');
    });

    it('should enforce rate limiting when last request was recent', async () => {
      const recentTime = new Date(Date.now() - 30000); // 30 seconds ago
      const user = testFactories.user({
        email: 'test@example.com',
        otp_last_request: recentTime
      });

      mockDb.selectFrom.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(user)
      });

      const result = await generateOTP('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('minuto');
      expect(mockDb.updateTable).not.toHaveBeenCalled();
    });

    it('should generate OTP when rate limit not exceeded', async () => {
      const oldTime = new Date(Date.now() - 120000); // 2 minutes ago
      const user = testFactories.user({
        email: 'test@example.com',
        otp_last_request: oldTime
      });

      const updatedUser = { ...user, otp_code: '123456' };

      mockDb.selectFrom.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(user)
      });

      mockBaseFunctions.update.mockResolvedValue(updatedUser);

      const result = await generateOTP('test@example.com');

      expect(result.success).toBe(true);
      expect(mockBaseFunctions.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          otp_code: expect.any(String),
          otp_expiration: expect.any(Date),
          otp_attempts: 0,
          otp_last_request: expect.any(Date)
        })
      );
    });

    it('should call update with correct OTP fields', async () => {
      const user = testFactories.user({ email: 'test@example.com' });
      const updatedUser = { ...user, otp_code: '123456' };

      mockDb.selectFrom.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(user)
      });

      mockBaseFunctions.update.mockResolvedValue(updatedUser);

      await generateOTP('test@example.com');

      expect(mockBaseFunctions.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          otp_code: expect.stringMatching(/^\d{6}$/),
          otp_expiration: expect.any(Date),
          otp_attempts: 0,
          otp_last_request: expect.any(Date)
        })
      );
    });
  });

  describe('verifyOTP', () => {
    it('should return error when user not found', async () => {
      mockDb.selectFrom.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null)
      });

      const result = await verifyOTP('nonexistent@test.com', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when no active OTP', async () => {
      const user = testFactories.user({
        email: 'test@example.com',
        otp_code: null
      });

      mockDb.selectFrom.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(user)
      });

      const result = await verifyOTP('test@example.com', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No hay código activo');
    });

    it('should return error when OTP expired', async () => {
      const expiredTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const user = testFactories.user({
        email: 'test@example.com',
        otp_code: '123456',
        otp_expiration: expiredTime
      });

      mockDb.selectFrom.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(user)
      });

      mockDb.updateTable.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(user)
      });

      const result = await verifyOTP('test@example.com', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('expirado');
      expect(mockDb.updateTable).toHaveBeenCalledWith('users');
    });

    it('should return error when max attempts reached', async () => {
      const user = testFactories.user({
        email: 'test@example.com',
        otp_code: '123456',
        otp_expiration: new Date(Date.now() + 2 * 60 * 1000),
        otp_attempts: 3
      });

      mockDb.selectFrom.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(user)
      });

      mockDb.updateTable.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(user)
      });

      const result = await verifyOTP('test@example.com', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Demasiados intentos');
    });

    it('should increment attempts on incorrect code', async () => {
      const user = testFactories.user({
        email: 'test@example.com',
        otp_code: '123456',
        otp_expiration: new Date(Date.now() + 2 * 60 * 1000),
        otp_attempts: 1
      });

      mockDb.selectFrom.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(user)
      });

      mockBaseFunctions.update.mockResolvedValue(user);

      const result = await verifyOTP('test@example.com', '999999');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Código incorrecto');
      expect(mockBaseFunctions.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ otp_attempts: 2 })
      );
    });

    it('should mark email as verified and return user on success', async () => {
      const user = testFactories.user({
        email: 'test@example.com',
        otp_code: '123456',
        otp_expiration: new Date(Date.now() + 2 * 60 * 1000),
        otp_attempts: 0,
        email_verified: false
      });

      const verifiedUser = { ...user, email_verified: true };

      // First call: findUserByEmail
      mockDb.selectFrom.mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(user)
      });

      // Mock update and findById
      mockBaseFunctions.update.mockResolvedValue(verifiedUser);
      mockBaseFunctions.findById.mockResolvedValue(verifiedUser);

      const result = await verifyOTP('test@example.com', '123456');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(mockBaseFunctions.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ email_verified: true })
      );
    });
  });

  describe('clearOTP', () => {
    it('should call updateTable with null OTP fields', async () => {
      const clearedUser = testFactories.user({
        otp_code: null,
        otp_expiration: null,
        otp_attempts: 0,
        otp_last_request: null
      });

      const mockSet = vi.fn().mockReturnThis();
      mockDb.updateTable.mockReturnValue({
        set: mockSet,
        where: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(clearedUser)
      });

      const result = await clearOTP('user-123');

      expect(mockDb.updateTable).toHaveBeenCalledWith('users');
      expect(mockSet).toHaveBeenCalledWith({
        otp_code: null,
        otp_expiration: null,
        otp_attempts: 0,
        otp_last_request: null
      });
      expect(result).toEqual(clearedUser);
    });

    it('should use correct where clause', async () => {
      const mockWhere = vi.fn().mockReturnThis();
      mockDb.updateTable.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: mockWhere,
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(testFactories.user())
      });

      await clearOTP('user-456');

      expect(mockWhere).toHaveBeenCalledWith('id', '=', 'user-456');
    });
  });
});
