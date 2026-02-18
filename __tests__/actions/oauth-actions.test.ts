import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  checkAuthMethods,
  setNickname
} from '../../app/actions/oauth-actions';
import { User } from '../../app/db/tables-definition';
import * as usersRepository from '../../app/db/users-repository';
import { auth } from '../../auth';
import { getTranslations } from 'next-intl/server';

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
}));

// Mock the auth module
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

// Mock all database repositories
vi.mock('../../app/db/users-repository', () => ({
  getAuthMethodsForEmail: vi.fn(),
  updateUser: vi.fn(),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('OAuth Actions', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password_hash: 'hashed-password',
    nickname: 'testuser',
    email_verified: true,
    verification_token: null,
    verification_token_expiration: null,
    reset_token: null,
    reset_token_expiration: null,
    is_admin: false,
    notification_subscriptions: null,
    otp_code: null,
    otp_expires_at: null,
    otp_attempts: 0,
    auth_providers: JSON.stringify(['oauth']),
    onboarding_completed: false,
    onboarding_completed_at: null,
    onboarding_data: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAuthMethods', () => {
    it('should return auth methods for existing email with Spanish locale', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      vi.mocked(usersRepository.getAuthMethodsForEmail).mockResolvedValue({
        hasPassword: true,
        hasGoogle: false,
        userExists: true
      });

      const result = await checkAuthMethods('test@example.com', 'es');

      expect(result).toEqual({
        hasPassword: true,
        hasGoogle: false,
        userExists: true,
        success: true
      });
      expect(usersRepository.getAuthMethodsForEmail).toHaveBeenCalledWith('test@example.com');
      expect(getTranslations).toHaveBeenCalledWith({ locale: 'es', namespace: 'auth' });
    });

    it('should return auth methods for existing email with English locale', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      vi.mocked(usersRepository.getAuthMethodsForEmail).mockResolvedValue({
        hasPassword: false,
        hasGoogle: true,
        userExists: true
      });

      const result = await checkAuthMethods('user@test.com', 'en');

      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: true,
        userExists: true,
        success: true
      });
      expect(getTranslations).toHaveBeenCalledWith({ locale: 'en', namespace: 'auth' });
    });

    it('should return auth methods for both password and Google methods', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      vi.mocked(usersRepository.getAuthMethodsForEmail).mockResolvedValue({
        hasPassword: true,
        hasGoogle: true,
        userExists: true
      });

      const result = await checkAuthMethods('both@example.com', 'es');

      expect(result).toEqual({
        hasPassword: true,
        hasGoogle: true,
        userExists: true,
        success: true
      });
    });

    it('should return success for non-existent user', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      vi.mocked(usersRepository.getAuthMethodsForEmail).mockResolvedValue({
        hasPassword: false,
        hasGoogle: false,
        userExists: false
      });

      const result = await checkAuthMethods('newuser@example.com', 'es');

      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: true
      });
    });

    it('should return error when email is empty with translation key', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await checkAuthMethods('', 'es');

      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false,
        error: 'emailInput.email.error'
      });
      expect(usersRepository.getAuthMethodsForEmail).not.toHaveBeenCalled();
      expect(mockT).toHaveBeenCalledWith('emailInput.email.error');
    });

    it('should return error when email is whitespace only', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await checkAuthMethods('   ', 'es');

      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false,
        error: 'emailInput.email.error'
      });
    });

    it('should normalize email to lowercase before checking', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      vi.mocked(usersRepository.getAuthMethodsForEmail).mockResolvedValue({
        hasPassword: true,
        hasGoogle: false,
        userExists: true
      });

      await checkAuthMethods('TEST@EXAMPLE.COM', 'es');

      expect(usersRepository.getAuthMethodsForEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle database errors with error translation key', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockT as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(usersRepository.getAuthMethodsForEmail).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await checkAuthMethods('test@example.com', 'es');

      expect(result).toEqual({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false,
        error: 'errors.generic'
      });
      expect(getTranslations).toHaveBeenCalledWith({ locale: 'es', namespace: 'errors' });
    });

    it('should use default locale (es) when not specified', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      vi.mocked(usersRepository.getAuthMethodsForEmail).mockResolvedValue({
        hasPassword: true,
        hasGoogle: false,
        userExists: true
      });

      await checkAuthMethods('test@example.com');

      expect(getTranslations).toHaveBeenCalledWith({ locale: 'es', namespace: 'auth' });
    });
  });

  describe('setNickname', () => {
    it('should set nickname for authenticated user with Spanish locale', async () => {
      const mockTAuth = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockTAuth as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);

      const result = await setNickname('newnicK', 'es');

      expect(result).toEqual({ success: true });
      expect(usersRepository.updateUser).toHaveBeenCalledWith(mockUser.id, {
        nickname: 'newnicK'
      });
    });

    it('should set nickname for authenticated user with English locale', async () => {
      const mockTAuth = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockTAuth as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);

      const result = await setNickname('Player123', 'en');

      expect(result).toEqual({ success: true });
      expect(getTranslations).toHaveBeenCalledWith({ locale: 'en', namespace: 'auth' });
    });

    it('should trim whitespace from nickname', async () => {
      const mockTAuth = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockTAuth as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);

      await setNickname('  spacedNick  ', 'es');

      expect(usersRepository.updateUser).toHaveBeenCalledWith(mockUser.id, {
        nickname: 'spacedNick'
      });
    });

    it('should return error with translation key when user is not authenticated', async () => {
      const mockTAuth = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockTAuth as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(auth).mockResolvedValue(null as any);

      const result = await setNickname('newnicK', 'es');

      expect(result).toEqual({
        success: false,
        error: 'errors.auth.unauthorized'
      });
      expect(mockTErrors).toHaveBeenCalledWith('auth.unauthorized');
    });

    it('should return error when session has no user ID', async () => {
      const mockTAuth = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockTAuth as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(auth).mockResolvedValue({ user: { ...mockUser, id: undefined } } as any);

      const result = await setNickname('newnicK', 'es');

      expect(result).toEqual({
        success: false,
        error: 'errors.auth.unauthorized'
      });
    });

    it('should return error with translation key when nickname is empty', async () => {
      const mockTAuth = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockTAuth as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);

      const result = await setNickname('', 'es');

      expect(result).toEqual({
        success: false,
        error: 'accountSetup.nickname.required'
      });
      expect(mockTAuth).toHaveBeenCalledWith('accountSetup.nickname.required');
    });

    it('should return error when nickname is too short', async () => {
      const mockTAuth = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockTAuth as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);

      const result = await setNickname('a', 'es');

      expect(result).toEqual({
        success: false,
        error: 'nicknameSetup.nickname.helperText'
      });
      expect(mockTAuth).toHaveBeenCalledWith('nicknameSetup.nickname.helperText');
    });

    it('should return error when nickname is too long', async () => {
      const mockTAuth = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockTAuth as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);

      const longNickname = 'a'.repeat(51);
      const result = await setNickname(longNickname, 'es');

      expect(result).toEqual({
        success: false,
        error: 'nicknameSetup.nickname.helperText'
      });
    });

    it('should accept nickname exactly 2 characters long', async () => {
      const mockTAuth = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockTAuth as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);

      const result = await setNickname('ab', 'es');

      expect(result).toEqual({ success: true });
    });

    it('should accept nickname exactly 50 characters long', async () => {
      const mockTAuth = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockTAuth as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);

      const fiftyCharNickname = 'a'.repeat(50);
      const result = await setNickname(fiftyCharNickname, 'es');

      expect(result).toEqual({ success: true });
    });

    it('should handle database errors with error translation key', async () => {
      const mockTAuth = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockTAuth as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
      vi.mocked(usersRepository.updateUser).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await setNickname('newnicK', 'es');

      expect(result).toEqual({
        success: false,
        error: 'errors.generic'
      });
      expect(mockTErrors).toHaveBeenCalledWith('generic');
    });

    it('should use default locale (es) when not specified', async () => {
      const mockTAuth = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockTAuth as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);

      await setNickname('newnicK');

      expect(getTranslations).toHaveBeenCalledWith({ locale: 'es', namespace: 'auth' });
    });
  });
});
