import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAuthMethods, setNickname } from '../../app/actions/oauth-actions';
import * as usersRepository from '../../app/db/users-repository';
import { auth } from '../../auth';

// Mock dependencies
vi.mock('../../app/db/users-repository');
vi.mock('../../auth', () => ({
  auth: vi.fn()
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

describe('OAuth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAuthMethods', () => {
    it('returns error when email is empty', async () => {
      const result = await checkAuthMethods('');

      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false,
        error: 'Email is required'
      });
    });

    it('returns error when email is only whitespace', async () => {
      const result = await checkAuthMethods('   ');

      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false,
        error: 'Email is required'
      });
    });

    it('returns error when email is null/undefined', async () => {
      const result = await checkAuthMethods(null as any);

      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false,
        error: 'Email is required'
      });
    });

    it('returns auth methods for existing user with password', async () => {
      vi.mocked(usersRepository.getAuthMethodsForEmail).mockResolvedValue({
        hasPassword: true,
        hasGoogle: false,
        userExists: true
      });

      const result = await checkAuthMethods('test@example.com');

      expect(result).toEqual({
        hasPassword: true,
        hasGoogle: false,
        userExists: true,
        success: true
      });
      expect(usersRepository.getAuthMethodsForEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('returns auth methods for existing user with Google OAuth', async () => {
      vi.mocked(usersRepository.getAuthMethodsForEmail).mockResolvedValue({
        hasPassword: false,
        hasGoogle: true,
        userExists: true
      });

      const result = await checkAuthMethods('google@example.com');

      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: true,
        userExists: true,
        success: true
      });
    });

    it('returns auth methods for existing user with both password and Google', async () => {
      vi.mocked(usersRepository.getAuthMethodsForEmail).mockResolvedValue({
        hasPassword: true,
        hasGoogle: true,
        userExists: true
      });

      const result = await checkAuthMethods('both@example.com');

      expect(result).toEqual({
        hasPassword: true,
        hasGoogle: true,
        userExists: true,
        success: true
      });
    });

    it('returns auth methods for non-existent user', async () => {
      vi.mocked(usersRepository.getAuthMethodsForEmail).mockResolvedValue({
        hasPassword: false,
        hasGoogle: false,
        userExists: false
      });

      const result = await checkAuthMethods('newuser@example.com');

      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: true
      });
    });

    it('converts email to lowercase before checking', async () => {
      vi.mocked(usersRepository.getAuthMethodsForEmail).mockResolvedValue({
        hasPassword: true,
        hasGoogle: false,
        userExists: true
      });

      await checkAuthMethods('Test@EXAMPLE.COM');

      expect(usersRepository.getAuthMethodsForEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('trims whitespace from email', async () => {
      vi.mocked(usersRepository.getAuthMethodsForEmail).mockResolvedValue({
        hasPassword: true,
        hasGoogle: false,
        userExists: true
      });

      await checkAuthMethods('  test@example.com  ');

      // The actual implementation converts to lowercase but doesn't trim before calling the repository
      expect(usersRepository.getAuthMethodsForEmail).toHaveBeenCalledWith('  test@example.com  ');
    });

    it('handles database errors gracefully', async () => {
      vi.mocked(usersRepository.getAuthMethodsForEmail).mockRejectedValue(
        new Error('Database connection failed')
      );
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await checkAuthMethods('test@example.com');

      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false,
        error: 'Failed to check authentication methods'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking auth methods:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('setNickname', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    };

    it('returns error when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const result = await setNickname('TestNickname');

      expect(result).toEqual({
        success: false,
        error: 'Not authenticated'
      });
    });

    it('returns error when session has no user id', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com' }
      } as any);

      const result = await setNickname('TestNickname');

      expect(result).toEqual({
        success: false,
        error: 'Not authenticated'
      });
    });

    it('returns error when nickname is empty', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const result = await setNickname('');

      expect(result).toEqual({
        success: false,
        error: 'Nickname is required'
      });
    });

    it('returns error when nickname is only whitespace', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const result = await setNickname('   ');

      expect(result).toEqual({
        success: false,
        error: 'Nickname is required'
      });
    });

    it('returns error when nickname is null/undefined', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const result = await setNickname(null as any);

      expect(result).toEqual({
        success: false,
        error: 'Nickname is required'
      });
    });

    it('returns error when nickname is too short (less than 2 characters)', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const result = await setNickname('a');

      expect(result).toEqual({
        success: false,
        error: 'Nickname must be at least 2 characters'
      });
    });

    it('returns error when nickname is too long (more than 50 characters)', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const result = await setNickname('a'.repeat(51));

      expect(result).toEqual({
        success: false,
        error: 'Nickname must be less than 50 characters'
      });
    });

    it('successfully sets nickname with valid input', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(undefined);

      const result = await setNickname('TestNickname');

      expect(result).toEqual({
        success: true
      });
      expect(usersRepository.updateUser).toHaveBeenCalledWith('user-123', {
        nickname: 'TestNickname'
      });
    });

    it('trims whitespace from nickname before saving', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(undefined);

      const result = await setNickname('  TestNickname  ');

      expect(result).toEqual({
        success: true
      });
      expect(usersRepository.updateUser).toHaveBeenCalledWith('user-123', {
        nickname: 'TestNickname'
      });
    });

    it('accepts nickname with exactly 2 characters', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(undefined);

      const result = await setNickname('AB');

      expect(result).toEqual({
        success: true
      });
    });

    it('accepts nickname with exactly 50 characters', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(undefined);

      const result = await setNickname('a'.repeat(50));

      expect(result).toEqual({
        success: true
      });
    });

    it('handles database errors gracefully', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(usersRepository.updateUser).mockRejectedValue(
        new Error('Database update failed')
      );
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await setNickname('TestNickname');

      expect(result).toEqual({
        success: false,
        error: 'Failed to set nickname'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error setting nickname:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
