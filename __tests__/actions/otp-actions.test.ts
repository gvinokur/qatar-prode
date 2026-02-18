import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendOTPCode,
  verifyOTPCode,
  createAccountViaOTP,
  checkNicknameAvailability
} from '../../app/actions/otp-actions';
import * as usersRepo from '../../app/db/users-repository';
import { sendEmail } from '../../app/utils/email';
import { testFactories } from '../db/test-factories';
import { getTranslations } from 'next-intl/server';

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
}));

// Mock dependencies
vi.mock('../../app/utils/email', () => ({
  sendEmail: vi.fn()
}));

vi.mock('../../app/db/users-repository', async () => {
  const actual = await vi.importActual('../../app/db/users-repository');
  return {
    ...actual,
    generateOTP: vi.fn(),
    verifyOTP: vi.fn(),
    findUserByEmail: vi.fn(),
    findUserByNickname: vi.fn(),
    updateUser: vi.fn(),
    getPasswordHash: vi.fn()
  };
});

describe('OTP Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendOTPCode', () => {
    it('should return error with translation key for invalid email format (Spanish locale)', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await sendOTPCode('invalid-email', 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('emailInput.email.error');
      expect(mockT).toHaveBeenCalledWith('emailInput.email.error');
      expect(getTranslations).toHaveBeenCalledWith({ locale: 'es', namespace: 'auth' });
    });

    it('should return error with translation key for invalid email format (English locale)', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await sendOTPCode('invalid-email', 'en');

      expect(result.success).toBe(false);
      expect(result.error).toBe('emailInput.email.error');
      expect(getTranslations).toHaveBeenCalledWith({ locale: 'en', namespace: 'auth' });
    });

    it('should return error for empty email with translation key', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await sendOTPCode('', 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('emailInput.email.error');
    });

    it('should call generateOTP with normalized email', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ otp_code: '123456' })
      );
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'test-id' });

      await sendOTPCode('Test@Example.COM', 'es');

      expect(usersRepo.generateOTP).toHaveBeenCalledWith('test@example.com');
    });

    it('should return error if OTP generation fails with returned error', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({
        success: false,
        error: 'rate.limit'
      });

      const result = await sendOTPCode('test@example.com', 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('rate.limit');
    });

    it('should return error with translation key if user not found after generation', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockT as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(null);

      const result = await sendOTPCode('test@example.com', 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('errors.generic');
    });

    it('should return error if OTP code not generated', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockT as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ otp_code: null })
      );

      const result = await sendOTPCode('test@example.com', 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('errors.generic');
    });

    it('should send email with OTP code', async () => {
      const user = testFactories.user({
        email: 'test@example.com',
        otp_code: '123456'
      });

      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'test-id' });

      const result = await sendOTPCode('test@example.com', 'es');

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.any(String),
          html: expect.stringContaining('123456')
        })
      );
      expect(result.success).toBe(true);
    });

    it('should return success when email sent successfully', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ otp_code: '123456' })
      );
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'test-id' });

      const result = await sendOTPCode('test@example.com', 'es');

      expect(result.success).toBe(true);
    });

    it('should normalize email with whitespace', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ otp_code: '123456' })
      );
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'test-id' });

      await sendOTPCode('  Test@Example.COM  ', 'es');

      expect(usersRepo.generateOTP).toHaveBeenCalledWith('test@example.com');
    });

    it('should return error with translation key if email sending fails', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations).mockImplementation(async (params: any) => {
        if (params.namespace === 'auth') return mockT as any;
        if (params.namespace === 'errors') return mockTErrors as any;
        return mockT as any;
      });

      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ otp_code: '123456' })
      );
      vi.mocked(sendEmail).mockRejectedValue(new Error('Email service unavailable'));

      const result = await sendOTPCode('test@example.com', 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('errors.email.sendFailed');
      expect(mockTErrors).toHaveBeenCalledWith('email.sendFailed');
    });

    it('should handle exceptions gracefully with error translation key', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockT as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(usersRepo.generateOTP).mockRejectedValue(new Error('DB Error'));

      const result = await sendOTPCode('test@example.com', 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('errors.email.sendFailed');
      expect(mockTErrors).toHaveBeenCalledWith('email.sendFailed');
    });

    it('should use default locale (es) when not specified', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ otp_code: '123456' })
      );
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'test-id' });

      await sendOTPCode('test@example.com');

      expect(getTranslations).toHaveBeenCalledWith({ locale: 'es', namespace: 'auth' });
    });
  });

  describe('verifyOTPCode', () => {
    it('should return error with translation key when email/code missing (Spanish locale)', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await verifyOTPCode('', '123456', 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('otp.errors.required');
    });

    it('should return error with translation key when code missing (English locale)', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await verifyOTPCode('test@example.com', '', 'en');

      expect(result.success).toBe(false);
      expect(result.error).toBe('otp.errors.required');
      expect(getTranslations).toHaveBeenCalledWith({ locale: 'en', namespace: 'auth' });
    });

    it('should call verifyOTP with normalized email and code', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.verifyOTP).mockResolvedValue({
        success: true,
        user: testFactories.user()
      });

      await verifyOTPCode('Test@Example.COM', '123456', 'es');

      expect(usersRepo.verifyOTP).toHaveBeenCalledWith('test@example.com', '123456');
    });

    it('should return success with user on valid OTP', async () => {
      const user = testFactories.user({ email: 'test@example.com' });
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.verifyOTP).mockResolvedValue({
        success: true,
        user
      });

      const result = await verifyOTPCode('test@example.com', '123456', 'es');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(user);
    });

    it('should return error from verifyOTP on invalid OTP', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.verifyOTP).mockResolvedValue({
        success: false,
        error: 'otp.errors.invalid'
      });

      const result = await verifyOTPCode('test@example.com', '999999', 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('otp.errors.invalid');
    });

    it('should handle exceptions gracefully with error translation key', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockT as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(usersRepo.verifyOTP).mockRejectedValue(new Error('Verification error'));

      const result = await verifyOTPCode('test@example.com', '123456', 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('errors.generic');
    });

    it('should use default locale (es) when not specified', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.verifyOTP).mockResolvedValue({
        success: true,
        user: testFactories.user()
      });

      await verifyOTPCode('test@example.com', '123456');

      expect(getTranslations).toHaveBeenCalledWith({ locale: 'es', namespace: 'auth' });
    });
  });

  describe('createAccountViaOTP', () => {
    const validData = {
      email: 'new@example.com',
      nickname: 'testuser',
      password: null,
      verifiedOTP: '123456'
    };

    it('should return error with translation key for missing inputs (Spanish locale)', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await createAccountViaOTP({
        ...validData,
        nickname: '',
        email: ''
      }, 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('accountSetup.errors.createFailed');
    });

    it('should return error with minLength translation key for nickname too short', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await createAccountViaOTP({
        ...validData,
        nickname: 'ab' // Less than 3 characters
      }, 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('accountSetup.nickname.minLength:{"min":3}');
      expect(mockT).toHaveBeenCalledWith('accountSetup.nickname.minLength', { min: 3 });
    });

    it('should return error with maxLength translation key for nickname too long', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await createAccountViaOTP({
        ...validData,
        nickname: 'a'.repeat(21) // More than 20 characters
      }, 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('accountSetup.nickname.maxLength:{"max":20}');
      expect(mockT).toHaveBeenCalledWith('accountSetup.nickname.maxLength', { max: 20 });
    });

    it('should return error with minLength translation key for password too short', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await createAccountViaOTP({
        ...validData,
        password: 'short' // Less than 8 characters
      }, 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('accountSetup.password.minLength:{"min":8}');
      expect(mockT).toHaveBeenCalledWith('accountSetup.password.minLength', { min: 8 });
    });

    it('should return error with translation key if nickname already taken', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(
        testFactories.user({ nickname: 'testuser' })
      );

      const result = await createAccountViaOTP(validData, 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('accountSetup.nickname.unavailable');
      expect(mockT).toHaveBeenCalledWith('accountSetup.nickname.unavailable');
    });

    it('should return error with translation key if user not found', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockT as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(null);

      const result = await createAccountViaOTP(validData, 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('errors.auth.userNotFound');
    });

    it('should return error with translation key if email not verified', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ email_verified: false })
      );

      const result = await createAccountViaOTP(validData, 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('otp.errors.verifyFailed');
      expect(mockT).toHaveBeenCalledWith('otp.errors.verifyFailed');
    });

    it('should update user with nickname and OTP auth provider', async () => {
      const user = testFactories.user({
        email: 'new@example.com',
        email_verified: true
      });

      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(usersRepo.updateUser).mockResolvedValue(user);

      const result = await createAccountViaOTP(validData, 'es');

      expect(usersRepo.updateUser).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          nickname: 'testuser',
          password_hash: null,
          auth_providers: JSON.stringify(['otp'])
        })
      );
      expect(result.success).toBe(true);
    });

    it('should update user with password and credentials auth provider', async () => {
      const user = testFactories.user({ email_verified: true });

      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(usersRepo.updateUser).mockResolvedValue(user);
      vi.mocked(usersRepo.getPasswordHash).mockReturnValue('hashed-password');

      const result = await createAccountViaOTP({
        ...validData,
        password: 'password123'
      }, 'es');

      expect(usersRepo.updateUser).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          nickname: 'testuser',
          password_hash: 'hashed-password',
          auth_providers: JSON.stringify(['otp', 'credentials'])
        })
      );
      expect(result.success).toBe(true);
    });

    it('should trim and normalize nickname', async () => {
      const user = testFactories.user({ email_verified: true });

      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(usersRepo.updateUser).mockResolvedValue(user);

      await createAccountViaOTP({
        ...validData,
        nickname: '  testuser  '
      }, 'es');

      expect(usersRepo.updateUser).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ nickname: 'testuser' })
      );
    });

    it('should handle empty password as null', async () => {
      const user = testFactories.user({ email_verified: true });

      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(usersRepo.updateUser).mockResolvedValue(user);

      await createAccountViaOTP({
        ...validData,
        password: '' // Empty string
      }, 'es');

      expect(usersRepo.updateUser).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          password_hash: null,
          auth_providers: JSON.stringify(['otp']) // Not credentials
        })
      );
    });

    it('should handle exceptions gracefully with error translation key', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockT as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(usersRepo.findUserByNickname).mockRejectedValue(new Error('DB Error'));

      const result = await createAccountViaOTP(validData, 'es');

      expect(result.success).toBe(false);
      expect(result.error).toBe('errors.generic');
    });

    it('should use default locale (es) when not specified', async () => {
      const user = testFactories.user({ email_verified: true });

      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(usersRepo.updateUser).mockResolvedValue(user);

      await createAccountViaOTP(validData);

      expect(getTranslations).toHaveBeenCalledWith({ locale: 'es', namespace: 'auth' });
    });
  });

  describe('checkNicknameAvailability', () => {
    it('should return error with translation key for empty nickname (Spanish locale)', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await checkNicknameAvailability('', 'es');

      expect(result.available).toBe(false);
      expect(result.error).toBe('accountSetup.nickname.required');
      expect(mockT).toHaveBeenCalledWith('accountSetup.nickname.required');
    });

    it('should return error with translation key for empty nickname (English locale)', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await checkNicknameAvailability('', 'en');

      expect(result.available).toBe(false);
      expect(result.error).toBe('accountSetup.nickname.required');
      expect(getTranslations).toHaveBeenCalledWith({ locale: 'en', namespace: 'auth' });
    });

    it('should return error with translation key for whitespace-only nickname', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await checkNicknameAvailability('   ', 'es');

      expect(result.available).toBe(false);
      expect(result.error).toBe('accountSetup.nickname.required');
    });

    it('should return error with minLength translation key for nickname too short', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await checkNicknameAvailability('ab', 'es');

      expect(result.available).toBe(false);
      expect(result.error).toBe('accountSetup.nickname.minLength:{"min":3}');
      expect(mockT).toHaveBeenCalledWith('accountSetup.nickname.minLength', { min: 3 });
    });

    it('should return error with maxLength translation key for nickname too long', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);

      const result = await checkNicknameAvailability('a'.repeat(21), 'es');

      expect(result.available).toBe(false);
      expect(result.error).toBe('accountSetup.nickname.minLength:{"min":3}');
    });

    it('should return unavailable with translation key if nickname taken', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(
        testFactories.user({ nickname: 'taken' })
      );

      const result = await checkNicknameAvailability('taken', 'es');

      expect(result.available).toBe(false);
      expect(result.error).toBe('accountSetup.nickname.unavailable');
      expect(mockT).toHaveBeenCalledWith('accountSetup.nickname.unavailable');
    });

    it('should return available if nickname free', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);

      const result = await checkNicknameAvailability('available', 'es');

      expect(result.available).toBe(true);
    });

    it('should handle exceptions gracefully with error translation key', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });
      const mockTErrors = vi.fn((key: string) => `errors.${key}`);

      vi.mocked(getTranslations)
        .mockResolvedValueOnce(mockT as any)
        .mockResolvedValueOnce(mockTErrors as any);

      vi.mocked(usersRepo.findUserByNickname).mockRejectedValue(new Error('DB Error'));

      const result = await checkNicknameAvailability('test', 'es');

      expect(result.available).toBe(false);
      expect(result.error).toBe('errors.generic');
    });

    it('should trim whitespace from nickname', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);

      await checkNicknameAvailability('  validuser  ', 'es');

      expect(usersRepo.findUserByNickname).toHaveBeenCalledWith('validuser');
    });

    it('should use default locale (es) when not specified', async () => {
      const mockT = vi.fn((key: string, values?: Record<string, any>) => {
        if (values) return `${key}:${JSON.stringify(values)}`;
        return key;
      });

      vi.mocked(getTranslations).mockResolvedValue(mockT as any);
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);

      await checkNicknameAvailability('validuser');

      expect(getTranslations).toHaveBeenCalledWith({ locale: 'es', namespace: 'auth' });
    });
  });
});
