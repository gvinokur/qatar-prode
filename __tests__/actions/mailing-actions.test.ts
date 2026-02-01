import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  sendPasswordResetLink, 
  verifyUserEmail, 
  resendVerificationEmail,
  signupUser 
} from '../../app/actions/user-actions';
import { sendEmail } from '../../app/utils/email';
import { generateVerificationEmail, generatePasswordResetEmail } from '../../app/utils/email-templates';
import { User, UserNew } from '../../app/db/tables-definition';
import * as usersRepository from '../../app/db/users-repository';
import { auth } from '../../auth';

// Mock the crypto module
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn(() => ({
      toString: vi.fn(() => 'mocked-token-123456789abcdef')
    }))
  }
}));

// Mock the auth module
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

// Mock database repositories
vi.mock('../../app/db/users-repository', () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  getPasswordHash: vi.fn(),
  updateUser: vi.fn(),
  findUserByResetToken: vi.fn(),
  findUserByVerificationToken: vi.fn(),
  verifyEmail: vi.fn(),
  deleteUser: vi.fn(),
}));

// Mock email utilities
vi.mock('../../app/utils/email-templates', () => ({
  generateVerificationEmail: vi.fn(),
  generatePasswordResetEmail: vi.fn(),
}));

vi.mock('../../app/utils/email', () => ({
  sendEmail: vi.fn(),
}));

// Set environment variables for testing
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.EMAIL_PROVIDER = 'gmail';
process.env.EMAIL_FROM = 'test@example.com';

describe('Mailing Actions', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password_hash: 'hashed-password',
    nickname: 'testuser',
    email_verified: true,
    verification_token: 'verification-token',
    verification_token_expiration: new Date(Date.now() + 24 * 60 * 60 * 1000),
    reset_token: null,
    reset_token_expiration: null,
    is_admin: false,
    onboarding_completed: false,
    onboarding_completed_at: null,
    onboarding_data: null,
    notification_subscriptions: []
  };

  const mockNewUser: UserNew = {
    email: 'new@example.com',
    password_hash: 'plain-password',
    nickname: 'newuser'
  };

  const mockEmailTemplate = {
    to: 'test@example.com',
    subject: 'Test Subject',
    html: '<div>Test HTML</div>'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Email Sending Functionality', () => {
    describe('sendPasswordResetLink', () => {
      it('should successfully send password reset email', async () => {
        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
        vi.mocked(generatePasswordResetEmail).mockReturnValue(mockEmailTemplate);
        vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

        const result = await sendPasswordResetLink('test@example.com');

        expect(usersRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
        expect(usersRepository.updateUser).toHaveBeenCalledWith(mockUser.id, {
          reset_token: 'mocked-token-123456789abcdef',
          reset_token_expiration: expect.any(Date)
        });
        expect(generatePasswordResetEmail).toHaveBeenCalledWith(
          'test@example.com',
          'http://localhost:3000/reset-password?token=mocked-token-123456789abcdef'
        );
        expect(sendEmail).toHaveBeenCalledWith(mockEmailTemplate);
        expect(result).toEqual({ success: true, messageId: 'msg-123' });
      });

      it('should return error when user does not exist', async () => {
        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(undefined);

        const result = await sendPasswordResetLink('nonexistent@example.com');

        expect(usersRepository.findUserByEmail).toHaveBeenCalledWith('nonexistent@example.com');
        expect(usersRepository.updateUser).not.toHaveBeenCalled();
        expect(generatePasswordResetEmail).not.toHaveBeenCalled();
        expect(sendEmail).not.toHaveBeenCalled();
        expect(result).toEqual({ success: false, error: 'No existe un usuario con ese e-mail' });
      });

      it('should handle email sending failure', async () => {
        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
        vi.mocked(generatePasswordResetEmail).mockReturnValue(mockEmailTemplate);
        vi.mocked(sendEmail).mockRejectedValue(new Error('Email sending failed'));

        await expect(sendPasswordResetLink('test@example.com')).rejects.toThrow('Email sending failed');
        expect(sendEmail).toHaveBeenCalledWith(mockEmailTemplate);
      });

      it('should set correct token expiration time (1 hour)', async () => {
        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
        vi.mocked(generatePasswordResetEmail).mockReturnValue(mockEmailTemplate);
        vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

        const beforeCall = Date.now();
        await sendPasswordResetLink('test@example.com');
        const afterCall = Date.now();

        const updateCall = vi.mocked(usersRepository.updateUser).mock.calls[0][1];
        const expirationTime = updateCall.reset_token_expiration!.getTime();
        
        expect(expirationTime).toBeGreaterThan(beforeCall + 59 * 60 * 1000);
        expect(expirationTime).toBeLessThan(afterCall + 61 * 60 * 1000);
      });

      it('should use correct app URL in different environments', async () => {
        const originalUrl = process.env.NEXT_PUBLIC_APP_URL;
        process.env.NEXT_PUBLIC_APP_URL = 'https://production.example.com';

        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
        vi.mocked(generatePasswordResetEmail).mockReturnValue(mockEmailTemplate);
        vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

        await sendPasswordResetLink('test@example.com');

        expect(generatePasswordResetEmail).toHaveBeenCalledWith(
          'test@example.com',
          'https://production.example.com/reset-password?token=mocked-token-123456789abcdef'
        );

        process.env.NEXT_PUBLIC_APP_URL = originalUrl;
      });
    });

    describe('Verification Email Functionality', () => {
      describe('resendVerificationEmail', () => {
        it('should successfully resend verification email', async () => {
          vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
          vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
          vi.mocked(generateVerificationEmail).mockReturnValue(mockEmailTemplate);
          vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg-456' });

          const result = await resendVerificationEmail();

          expect(auth).toHaveBeenCalled();
          expect(usersRepository.updateUser).toHaveBeenCalledWith(mockUser.id, {
            verification_token: 'mocked-token-123456789abcdef',
            verification_token_expiration: expect.any(Date)
          });
          expect(generateVerificationEmail).toHaveBeenCalledWith(
            'test@example.com',
            'http://localhost:3000/verify-email?token=verification-token'
          );
          expect(sendEmail).toHaveBeenCalledWith(mockEmailTemplate);
          expect(result).toEqual({ success: true, messageId: 'msg-456' });
        });

        it('should return error when user is not logged in', async () => {
          vi.mocked(auth).mockResolvedValue(null as any);

          const result = await resendVerificationEmail();

          expect(auth).toHaveBeenCalled();
          expect(usersRepository.updateUser).not.toHaveBeenCalled();
          expect(generateVerificationEmail).not.toHaveBeenCalled();
          expect(sendEmail).not.toHaveBeenCalled();
          expect(result).toEqual({ success: false, error: 'No existe un usuario con ese e-mail' });
        });

        it('should set correct verification token expiration (24 hours)', async () => {
          vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
          vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
          vi.mocked(generateVerificationEmail).mockReturnValue(mockEmailTemplate);
          vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

          const beforeCall = Date.now();
          await resendVerificationEmail();
          const afterCall = Date.now();

          const updateCall = vi.mocked(usersRepository.updateUser).mock.calls[0][1];
          const expirationTime = updateCall.verification_token_expiration!.getTime();
          
          expect(expirationTime).toBeGreaterThan(beforeCall + 23 * 60 * 60 * 1000);
          expect(expirationTime).toBeLessThan(afterCall + 25 * 60 * 60 * 1000);
        });

        it('should handle email sending failure during resend', async () => {
          vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
          vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
          vi.mocked(generateVerificationEmail).mockReturnValue(mockEmailTemplate);
          vi.mocked(sendEmail).mockRejectedValue(new Error('Email service unavailable'));

          const result = await resendVerificationEmail();

          expect(result).toEqual({ success: false, error: 'Failed to send verification email' });
        });
      });

      describe('signupUser - verification email', () => {
        it('should send verification email during signup', async () => {
          vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(undefined);
          vi.mocked(usersRepository.getPasswordHash).mockReturnValue('hashed-password');
          vi.mocked(usersRepository.createUser).mockResolvedValue(mockUser);
          vi.mocked(generateVerificationEmail).mockReturnValue(mockEmailTemplate);
          vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

          const result = await signupUser(mockNewUser);

          expect(generateVerificationEmail).toHaveBeenCalledWith(
            'test@example.com',
            'http://localhost:3000/verify-email?token=verification-token'
          );
          expect(sendEmail).toHaveBeenCalledWith(mockEmailTemplate);
          expect(result).toBe(mockUser);
        });

        it('should handle verification email failure during signup', async () => {
          vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(undefined);
          vi.mocked(usersRepository.getPasswordHash).mockReturnValue('hashed-password');
          vi.mocked(usersRepository.createUser).mockResolvedValue(mockUser);
          vi.mocked(generateVerificationEmail).mockReturnValue(mockEmailTemplate);
          vi.mocked(sendEmail).mockRejectedValue(new Error('SMTP server down'));

          // signupUser catches email errors internally in sendVerificationEmail
          // and returns the user anyway with failed email result
          const result = await signupUser(mockNewUser);
          
          expect(result).toBe(mockUser);
          expect(sendEmail).toHaveBeenCalledWith(mockEmailTemplate);
        });
      });

      describe('verifyUserEmail', () => {
        it('should successfully verify user email', async () => {
          const unverifiedUser = { ...mockUser, email_verified: false };
          const verifiedUser = { ...mockUser, email_verified: true };

          vi.mocked(usersRepository.findUserByVerificationToken).mockResolvedValue(unverifiedUser);
          vi.mocked(usersRepository.verifyEmail).mockResolvedValue(verifiedUser);

          const result = await verifyUserEmail('valid-token');

          expect(usersRepository.findUserByVerificationToken).toHaveBeenCalledWith('valid-token');
          expect(usersRepository.verifyEmail).toHaveBeenCalledWith('valid-token');
          expect(result).toEqual({ success: true, user: verifiedUser });
        });

        it('should return error for invalid token', async () => {
          vi.mocked(usersRepository.findUserByVerificationToken).mockResolvedValue(undefined);

          const result = await verifyUserEmail('invalid-token');

          expect(usersRepository.findUserByVerificationToken).toHaveBeenCalledWith('invalid-token');
          expect(usersRepository.verifyEmail).not.toHaveBeenCalled();
          expect(result).toEqual({ success: false, error: 'Invalid or expired verification link' });
        });

        it('should handle verification failure', async () => {
          const unverifiedUser = { ...mockUser, email_verified: false };

          vi.mocked(usersRepository.findUserByVerificationToken).mockResolvedValue(unverifiedUser);
          vi.mocked(usersRepository.verifyEmail).mockResolvedValue(undefined);

          const result = await verifyUserEmail('valid-token');

          expect(result).toEqual({ success: false, error: 'Failed to verify email' });
        });

        it('should handle database errors gracefully', async () => {
          vi.mocked(usersRepository.findUserByVerificationToken).mockRejectedValue(new Error('Database error'));

          const result = await verifyUserEmail('valid-token');

          expect(result).toEqual({ success: false, error: 'Failed to verify email' });
        });
      });
    });

    describe('Email Template Integration', () => {
      it('should use correct template data for verification email', async () => {
        vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
        vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
        vi.mocked(generateVerificationEmail).mockReturnValue(mockEmailTemplate);
        vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

        await resendVerificationEmail();

        expect(generateVerificationEmail).toHaveBeenCalledWith(
          mockUser.email,
          expect.stringContaining('verify-email?token=')
        );
      });

      it('should use correct template data for password reset email', async () => {
        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
        vi.mocked(generatePasswordResetEmail).mockReturnValue(mockEmailTemplate);
        vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

        await sendPasswordResetLink('test@example.com');

        expect(generatePasswordResetEmail).toHaveBeenCalledWith(
          'test@example.com',
          expect.stringContaining('reset-password?token=')
        );
      });

      it('should handle template generation errors', async () => {
        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
        vi.mocked(generatePasswordResetEmail).mockImplementation(() => {
          throw new Error('Template generation failed');
        });

        await expect(sendPasswordResetLink('test@example.com')).rejects.toThrow('Template generation failed');
      });
    });

    describe('Email Validation and Edge Cases', () => {
      it('should handle special characters in email addresses', async () => {
        const specialEmail = 'test+special@example.com';
        const userWithSpecialEmail = { ...mockUser, email: specialEmail };

        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(userWithSpecialEmail);
        vi.mocked(usersRepository.updateUser).mockResolvedValue(userWithSpecialEmail);
        vi.mocked(generatePasswordResetEmail).mockReturnValue({
          ...mockEmailTemplate,
          to: specialEmail
        });
        vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

        const result = await sendPasswordResetLink(specialEmail);

        expect(generatePasswordResetEmail).toHaveBeenCalledWith(
          specialEmail,
          expect.any(String)
        );
        expect(result).toEqual({ success: true, messageId: 'msg-123' });
      });

      it('should handle empty email input', async () => {
        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(undefined);

        const result = await sendPasswordResetLink('');

        expect(result).toEqual({ success: false, error: 'No existe un usuario con ese e-mail' });
      });

      it('should handle very long email addresses', async () => {
        const longEmail = 'a'.repeat(100) + '@example.com';
        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(undefined);

        const result = await sendPasswordResetLink(longEmail);

        expect(usersRepository.findUserByEmail).toHaveBeenCalledWith(longEmail);
        expect(result).toEqual({ success: false, error: 'No existe un usuario con ese e-mail' });
      });
    });

    describe('Token Generation and Security', () => {
      it('should generate unique tokens for each request', async () => {
        let tokenCounter = 0;
        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
        vi.mocked(generatePasswordResetEmail).mockReturnValue(mockEmailTemplate);
        vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

        // Mock crypto to return different tokens
        const mockCrypto = await import('crypto');
        vi.mocked(mockCrypto.default.randomBytes).mockImplementation(() => ({
          toString: () => `token-${++tokenCounter}`
        }));

        await sendPasswordResetLink('test@example.com');
        const firstCall = vi.mocked(usersRepository.updateUser).mock.calls[0][1];

        await sendPasswordResetLink('test@example.com');
        const secondCall = vi.mocked(usersRepository.updateUser).mock.calls[1][1];

        expect(firstCall.reset_token).toBe('token-1');
        expect(secondCall.reset_token).toBe('token-2');
      });

      it('should set proper token expiration for verification emails', async () => {
        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(undefined);
        vi.mocked(usersRepository.getPasswordHash).mockReturnValue('hashed-password');
        vi.mocked(usersRepository.createUser).mockResolvedValue(mockUser);
        vi.mocked(generateVerificationEmail).mockReturnValue(mockEmailTemplate);
        vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

        const beforeCall = Date.now();
        await signupUser(mockNewUser);
        const afterCall = Date.now();

        const createCall = vi.mocked(usersRepository.createUser).mock.calls[0][0];
        const expirationTime = createCall.verification_token_expiration!.getTime();
        
        // Should be approximately 24 hours from now
        expect(expirationTime).toBeGreaterThan(beforeCall + 23 * 60 * 60 * 1000);
        expect(expirationTime).toBeLessThan(afterCall + 25 * 60 * 60 * 1000);
      });
    });

    describe('Error Recovery and Retry Logic', () => {
      it('should handle temporary email service failures', async () => {
        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
        vi.mocked(generatePasswordResetEmail).mockReturnValue(mockEmailTemplate);
        vi.mocked(sendEmail).mockRejectedValue(new Error('Temporary service unavailable'));

        await expect(sendPasswordResetLink('test@example.com')).rejects.toThrow('Temporary service unavailable');
        
        // Verify that database was still updated with reset token
        expect(usersRepository.updateUser).toHaveBeenCalledWith(mockUser.id, {
          reset_token: expect.any(String),
          reset_token_expiration: expect.any(Date)
        });
      });

      it('should handle database transaction failures', async () => {
        vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(usersRepository.updateUser).mockRejectedValue(new Error('Database connection lost'));

        await expect(sendPasswordResetLink('test@example.com')).rejects.toThrow('Database connection lost');
        
        expect(generatePasswordResetEmail).not.toHaveBeenCalled();
        expect(sendEmail).not.toHaveBeenCalled();
      });
    });
  });

  describe('Bulk Email Operations', () => {
    // Since there are no bulk operations in the current codebase,
    // these tests serve as a foundation for future implementation
    it('should handle multiple concurrent email sends', async () => {
      const users = [
        { ...mockUser, id: 'user-1', email: 'user1@example.com' },
        { ...mockUser, id: 'user-2', email: 'user2@example.com' },
        { ...mockUser, id: 'user-3', email: 'user3@example.com' }
      ];

      vi.mocked(usersRepository.findUserByEmail).mockImplementation(async (email) => {
        return users.find(u => u.email === email) || undefined;
      });
      vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
      vi.mocked(generatePasswordResetEmail).mockReturnValue(mockEmailTemplate);
      vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

      const promises = users.map(user => sendPasswordResetLink(user.email));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(sendEmail).toHaveBeenCalledTimes(3);
    });
  });
});
