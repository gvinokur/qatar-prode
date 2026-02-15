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
    updateUser: vi.fn()
  };
});

describe('OTP Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendOTPCode', () => {
    it('should return error for invalid email format', async () => {
      const result = await sendOTPCode('invalid-email');

      expect(result.success).toBe(false);
      expect(result.error).toContain('válid');
    });

    it('should return error for empty email', async () => {
      const result = await sendOTPCode('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('válid');
    });

    it('should call generateOTP with normalized email', async () => {
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ otp_code: '123456' })
      );
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'test-id' });

      await sendOTPCode('Test@Example.COM');

      expect(usersRepo.generateOTP).toHaveBeenCalledWith('test@example.com');
    });

    it('should return error if OTP generation fails', async () => {
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({
        success: false,
        error: 'Generation failed'
      });

      const result = await sendOTPCode('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Generation failed');
    });

    it('should return error if user not found after generation', async () => {
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(null);

      const result = await sendOTPCode('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('generar');
    });

    it('should return error if OTP code not generated', async () => {
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ otp_code: null })
      );

      const result = await sendOTPCode('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('generar');
    });

    it('should send email with OTP code', async () => {
      const user = testFactories.user({
        email: 'test@example.com',
        otp_code: '123456'
      });

      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'test-id' });

      const result = await sendOTPCode('test@example.com');

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.any(String),
          html: expect.stringContaining('123456')
        })
      );
      expect(result.success).toBe(true);
    });

    it('should send email in Spanish', async () => {
      const user = testFactories.user({ otp_code: '123456' });

      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'test-id' });

      await sendOTPCode('test@example.com');

      const emailCall = vi.mocked(sendEmail).mock.calls[0];
      const emailOptions = emailCall[0];

      expect(emailOptions.subject).toContain('código');
      expect(emailOptions.html).toContain('Tu código');
      expect(emailOptions.html).toContain('minutos');
    });

    it('should return success if email sent successfully', async () => {
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ otp_code: '123456' })
      );
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'test-id' });

      const result = await sendOTPCode('test@example.com');

      expect(result.success).toBe(true);
    });

    it('should normalize email with whitespace', async () => {
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ otp_code: '123456' })
      );
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'test-id' });

      await sendOTPCode('  Test@Example.COM  ');

      expect(usersRepo.generateOTP).toHaveBeenCalledWith('test@example.com');
    });

    it('should return error if email sending fails', async () => {
      vi.mocked(usersRepo.generateOTP).mockResolvedValue({ success: true });
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ otp_code: '123456' })
      );
      vi.mocked(sendEmail).mockRejectedValue(new Error('Email service unavailable'));

      const result = await sendOTPCode('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle exceptions gracefully', async () => {
      vi.mocked(usersRepo.generateOTP).mockRejectedValue(new Error('DB Error'));

      const result = await sendOTPCode('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('verifyOTPCode', () => {
    it('should call verifyOTP with email and code', async () => {
      vi.mocked(usersRepo.verifyOTP).mockResolvedValue({
        success: true,
        user: testFactories.user()
      });

      await verifyOTPCode('test@example.com', '123456');

      expect(usersRepo.verifyOTP).toHaveBeenCalledWith('test@example.com', '123456');
    });

    it('should return success with user on valid OTP', async () => {
      const user = testFactories.user({ email: 'test@example.com' });
      vi.mocked(usersRepo.verifyOTP).mockResolvedValue({
        success: true,
        user
      });

      const result = await verifyOTPCode('test@example.com', '123456');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(user);
    });

    it('should return error on invalid OTP', async () => {
      vi.mocked(usersRepo.verifyOTP).mockResolvedValue({
        success: false,
        error: 'Código incorrecto'
      });

      const result = await verifyOTPCode('test@example.com', '999999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Código incorrecto');
    });

    it('should handle exceptions', async () => {
      vi.mocked(usersRepo.verifyOTP).mockRejectedValue(new Error('Verification error'));

      const result = await verifyOTPCode('test@example.com', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('createAccountViaOTP', () => {
    const validData = {
      email: 'new@example.com',
      nickname: 'testuser',
      password: null,
      verifiedOTP: '123456'
    };

    it('should return error for missing nickname', async () => {
      const result = await createAccountViaOTP({
        ...validData,
        nickname: ''
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('nickname');
    });

    it('should return error for nickname too short', async () => {
      const result = await createAccountViaOTP({
        ...validData,
        nickname: 'ab' // Less than 3 characters
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('3 caracteres');
    });

    it('should return error for nickname too long', async () => {
      const result = await createAccountViaOTP({
        ...validData,
        nickname: 'a'.repeat(21) // More than 20 characters
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('20 caracteres');
    });

    it('should return error for password too short', async () => {
      const result = await createAccountViaOTP({
        ...validData,
        password: 'short' // Less than 8 characters
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('8 caracteres');
    });

    it('should return error if nickname already taken', async () => {
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(
        testFactories.user({ nickname: 'testuser' })
      );

      const result = await createAccountViaOTP(validData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('disponible');
    });

    it('should return error if user not found', async () => {
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(null);

      const result = await createAccountViaOTP(validData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Usuario no encontrado');
    });

    it('should return error if email not verified', async () => {
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(
        testFactories.user({ email_verified: false })
      );

      const result = await createAccountViaOTP(validData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('verificado');
    });

    it('should update user with nickname and OTP auth provider', async () => {
      const user = testFactories.user({
        email: 'new@example.com',
        email_verified: true
      });

      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(usersRepo.updateUser).mockResolvedValue(user);

      const result = await createAccountViaOTP(validData);

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

      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(usersRepo.updateUser).mockResolvedValue(user);

      const result = await createAccountViaOTP({
        ...validData,
        password: 'password123'
      });

      expect(usersRepo.updateUser).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          nickname: 'testuser',
          password_hash: expect.any(String),
          auth_providers: JSON.stringify(['otp', 'credentials'])
        })
      );
      expect(result.success).toBe(true);
    });

    it('should trim and normalize nickname', async () => {
      const user = testFactories.user({ email_verified: true });

      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(usersRepo.updateUser).mockResolvedValue(user);

      await createAccountViaOTP({
        ...validData,
        nickname: '  testuser  '
      });

      expect(usersRepo.updateUser).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ nickname: 'testuser' })
      );
    });

    it('should handle empty password as null', async () => {
      const user = testFactories.user({ email_verified: true });

      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(usersRepo.updateUser).mockResolvedValue(user);

      await createAccountViaOTP({
        ...validData,
        password: '' // Empty string
      });

      expect(usersRepo.updateUser).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          password_hash: null,
          auth_providers: JSON.stringify(['otp']) // Not credentials
        })
      );
    });

    it('should handle whitespace-only password as null', async () => {
      const user = testFactories.user({ email_verified: true });

      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(usersRepo.findUserByEmail).mockResolvedValue(user);
      vi.mocked(usersRepo.updateUser).mockResolvedValue(user);

      await createAccountViaOTP({
        ...validData,
        password: '   ' // Whitespace only
      });

      expect(usersRepo.updateUser).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          password_hash: null,
          auth_providers: JSON.stringify(['otp']) // Not credentials
        })
      );
    });

    it('should handle exceptions', async () => {
      vi.mocked(usersRepo.findUserByNickname).mockRejectedValue(new Error('DB Error'));

      const result = await createAccountViaOTP(validData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('checkNicknameAvailability', () => {
    it('should return error for empty nickname', async () => {
      const result = await checkNicknameAvailability('');

      expect(result.available).toBe(false);
      expect(result.error).toContain('requerido');
    });

    it('should return error for whitespace-only nickname', async () => {
      const result = await checkNicknameAvailability('   ');

      expect(result.available).toBe(false);
      expect(result.error).toContain('requerido');
    });

    it('should return error for nickname too short', async () => {
      const result = await checkNicknameAvailability('ab');

      expect(result.available).toBe(false);
      expect(result.error).toContain('entre 3 y 20 caracteres');
    });

    it('should return error for nickname too long', async () => {
      const result = await checkNicknameAvailability('a'.repeat(21));

      expect(result.available).toBe(false);
      expect(result.error).toContain('20 caracteres');
    });

    it('should return unavailable if nickname taken', async () => {
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(
        testFactories.user({ nickname: 'taken' })
      );

      const result = await checkNicknameAvailability('taken');

      expect(result.available).toBe(false);
      expect(result.error).toContain('disponible');
    });

    it('should return available if nickname free', async () => {
      vi.mocked(usersRepo.findUserByNickname).mockResolvedValue(null);

      const result = await checkNicknameAvailability('available');

      expect(result.available).toBe(true);
    });

    it('should handle exceptions', async () => {
      vi.mocked(usersRepo.findUserByNickname).mockRejectedValue(new Error('DB Error'));

      const result = await checkNicknameAvailability('test');

      expect(result.available).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
