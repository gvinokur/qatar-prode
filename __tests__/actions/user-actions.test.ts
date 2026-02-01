import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  signupUser,
  resendVerificationEmail,
  updateNickname,
  getLoggedInUser,
  sendPasswordResetLink,
  verifyUserEmail,
  verifyResetToken,
  updateUserPassword,
  deleteAccount
} from '../../app/actions/user-actions';
import { User, UserNew } from '../../app/db/tables-definition';
import * as usersRepository from '../../app/db/users-repository';
import * as emailTemplates from '../../app/utils/email-templates';
import * as email from '../../app/utils/email';
import * as prodeGroupRepository from '../../app/db/prode-group-repository';
import * as tournamentGuessRepository from '../../app/db/tournament-guess-repository';
import * as gameGuessRepository from '../../app/db/game-guess-repository';
import * as tournamentGroupTeamGuessRepository from '../../app/db/tournament-group-team-guess-repository';
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

// Mock all database repositories
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

vi.mock('../../app/db/prode-group-repository', () => ({
  deleteAllParticipantsFromGroup: vi.fn(),
  deleteParticipantFromAllGroups: vi.fn(),
  deleteProdeGroup: vi.fn(),
  findProdeGroupsByOwner: vi.fn(),
}));

vi.mock('../../app/db/tournament-guess-repository', () => ({
  deleteAllUserTournamentGuesses: vi.fn(),
}));

vi.mock('../../app/db/game-guess-repository', () => ({
  deleteAllUserGameGuesses: vi.fn(),
}));

vi.mock('../../app/db/tournament-group-team-guess-repository', () => ({
  deleteAllUserTournamentStatsGuesses: vi.fn(),
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
process.env.NEXT_PUBLIC_SALT = 'test-salt';

describe('User Actions', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    // The crypto mock is already set up in the vi.mock call above
  });

  describe('signupUser', () => {
    it('should create a new user when email does not exist', async () => {
      vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(undefined);
      vi.mocked(usersRepository.getPasswordHash).mockReturnValue('hashed-password');
      vi.mocked(usersRepository.createUser).mockResolvedValue(mockUser);
      vi.mocked(emailTemplates.generateVerificationEmail).mockReturnValue({
        to: 'new@example.com',
        subject: 'Verification',
        html: '<div>Verify email</div>'
      });
      vi.mocked(email.sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

      const result = await signupUser(mockNewUser);

      expect(usersRepository.findUserByEmail).toHaveBeenCalledWith('new@example.com');
      expect(usersRepository.getPasswordHash).toHaveBeenCalledWith('plain-password');
      expect(usersRepository.createUser).toHaveBeenCalledWith({
        ...mockNewUser,
        password_hash: 'hashed-password',
        email_verified: false,
        verification_token: 'mocked-token-123456789abcdef',
        verification_token_expiration: expect.any(Date)
      });
      expect(emailTemplates.generateVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'http://localhost:3000/verify-email?token=verification-token'
      );
      expect(email.sendEmail).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it('should return error message when user already exists', async () => {
      vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(mockUser);

      const result = await signupUser(mockNewUser);

      expect(usersRepository.findUserByEmail).toHaveBeenCalledWith('new@example.com');
      expect(usersRepository.createUser).not.toHaveBeenCalled();
      expect(result).toBe('Ya existe un usuario con ese e-mail');
    });

    it('should generate verification token with 24-hour expiration', async () => {
      vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(undefined);
      vi.mocked(usersRepository.getPasswordHash).mockReturnValue('hashed-password');
      vi.mocked(usersRepository.createUser).mockResolvedValue(mockUser);
      vi.mocked(emailTemplates.generateVerificationEmail).mockReturnValue({
        to: 'new@example.com',
        subject: 'Verification',
        html: '<div>Verify email</div>'
      });
      vi.mocked(email.sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

      const beforeCall = Date.now();
      await signupUser(mockNewUser);
      const afterCall = Date.now();

      const createUserCall = vi.mocked(usersRepository.createUser).mock.calls[0][0];
      const expirationTime = createUserCall.verification_token_expiration!.getTime();
      
      expect(expirationTime).toBeGreaterThan(beforeCall + 23 * 60 * 60 * 1000);
      expect(expirationTime).toBeLessThan(afterCall + 25 * 60 * 60 * 1000);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email for logged-in user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
      vi.mocked(emailTemplates.generateVerificationEmail).mockReturnValue({
        to: 'test@example.com',
        subject: 'Verification',
        html: '<div>Verify email</div>'
      });
      vi.mocked(email.sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

      const result = await resendVerificationEmail();

      expect(usersRepository.updateUser).toHaveBeenCalledWith(mockUser.id, {
        verification_token: 'mocked-token-123456789abcdef',
        verification_token_expiration: expect.any(Date)
      });
      expect(email.sendEmail).toHaveBeenCalled();
      expect(result).toEqual({ success: true, messageId: 'msg-123' });
    });

    it('should return error when user is not logged in', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const result = await resendVerificationEmail();

      expect(result).toEqual({ success: false, error: 'No existe un usuario con ese e-mail' });
      expect(usersRepository.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('updateNickname', () => {
    it('should update nickname for logged-in user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);

      const result = await updateNickname('newnickname');

      expect(usersRepository.updateUser).toHaveBeenCalledWith(mockUser.id, {
        nickname: 'newnickname'
      });
      expect(result).toBeUndefined();
    });

    it('should return error when user is not logged in', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const result = await updateNickname('newnickname');

      expect(result).toBe('Unauthorized');
      expect(usersRepository.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('getLoggedInUser', () => {
    it('should return user from session', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);

      const result = await getLoggedInUser();

      expect(result).toBe(mockUser);
    });

    it('should return undefined when no session', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const result = await getLoggedInUser();

      expect(result).toBeUndefined();
    });
  });

  describe('sendPasswordResetLink', () => {
    it('should send password reset email for existing user', async () => {
      vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
      vi.mocked(emailTemplates.generatePasswordResetEmail).mockReturnValue({
        to: 'test@example.com',
        subject: 'Password Reset',
        html: '<div>Reset password</div>'
      });
      vi.mocked(email.sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

      const result = await sendPasswordResetLink('test@example.com');

      expect(usersRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(usersRepository.updateUser).toHaveBeenCalledWith(mockUser.id, {
        reset_token: 'mocked-token-123456789abcdef',
        reset_token_expiration: expect.any(Date)
      });
      expect(emailTemplates.generatePasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'http://localhost:3000/reset-password?token=mocked-token-123456789abcdef'
      );
      expect(email.sendEmail).toHaveBeenCalled();
      expect(result).toEqual({ success: true, messageId: 'msg-123' });
    });

    it('should return error when user does not exist', async () => {
      vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(undefined);

      const result = await sendPasswordResetLink('nonexistent@example.com');

      expect(result).toEqual({ success: false, error: 'No existe un usuario con ese e-mail' });
      expect(usersRepository.updateUser).not.toHaveBeenCalled();
    });

    it('should generate reset token with 1-hour expiration', async () => {
      vi.mocked(usersRepository.findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);
      vi.mocked(emailTemplates.generatePasswordResetEmail).mockReturnValue({
        to: 'test@example.com',
        subject: 'Password Reset',
        html: '<div>Reset password</div>'
      });
      vi.mocked(email.sendEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });

      const beforeCall = Date.now();
      await sendPasswordResetLink('test@example.com');
      const afterCall = Date.now();

      const updateUserCall = vi.mocked(usersRepository.updateUser).mock.calls[0][1];
      const expirationTime = updateUserCall.reset_token_expiration!.getTime();
      
      expect(expirationTime).toBeGreaterThan(beforeCall + 59 * 60 * 1000);
      expect(expirationTime).toBeLessThan(afterCall + 61 * 60 * 1000);
    });
  });

  describe('verifyUserEmail', () => {
    it('should verify email with valid token', async () => {
      const verifiedUser = { ...mockUser, email_verified: true };
      vi.mocked(usersRepository.findUserByVerificationToken).mockResolvedValue(mockUser);
      vi.mocked(usersRepository.verifyEmail).mockResolvedValue(verifiedUser);

      const result = await verifyUserEmail('valid-token');

      expect(usersRepository.findUserByVerificationToken).toHaveBeenCalledWith('valid-token');
      expect(usersRepository.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({ success: true, user: verifiedUser });
    });

    it('should return error when token is invalid', async () => {
      vi.mocked(usersRepository.findUserByVerificationToken).mockResolvedValue(undefined);

      const result = await verifyUserEmail('invalid-token');

      expect(result).toEqual({ success: false, error: 'Invalid or expired verification link' });
      expect(usersRepository.verifyEmail).not.toHaveBeenCalled();
    });

    it('should return error when verification fails', async () => {
      vi.mocked(usersRepository.findUserByVerificationToken).mockResolvedValue(mockUser);
      vi.mocked(usersRepository.verifyEmail).mockResolvedValue(undefined);

      const result = await verifyUserEmail('valid-token');

      expect(result).toEqual({ success: false, error: 'Failed to verify email' });
    });

    it('should handle exceptions and return error', async () => {
      vi.mocked(usersRepository.findUserByVerificationToken).mockRejectedValue(new Error('Database error'));

      const result = await verifyUserEmail('valid-token');

      expect(result).toEqual({ success: false, error: 'Failed to verify email' });
    });
  });

  describe('verifyResetToken', () => {
    it('should return user when token is valid and not expired', async () => {
      const userWithValidToken = {
        ...mockUser,
        reset_token: 'valid-token',
        reset_token_expiration: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      };
      vi.mocked(usersRepository.findUserByResetToken).mockResolvedValue(userWithValidToken);

      const result = await verifyResetToken('valid-token');

      expect(usersRepository.findUserByResetToken).toHaveBeenCalledWith('valid-token');
      expect(result).toBe(userWithValidToken);
    });

    it('should return null when user is not found', async () => {
      vi.mocked(usersRepository.findUserByResetToken).mockResolvedValue(undefined);

      const result = await verifyResetToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null when token is expired', async () => {
      const userWithExpiredToken = {
        ...mockUser,
        reset_token: 'expired-token',
        reset_token_expiration: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      };
      vi.mocked(usersRepository.findUserByResetToken).mockResolvedValue(userWithExpiredToken);

      const result = await verifyResetToken('expired-token');

      expect(result).toBeNull();
    });

    it('should return null when token expiration is null', async () => {
      const userWithNullExpiration = {
        ...mockUser,
        reset_token: 'token',
        reset_token_expiration: null
      };
      vi.mocked(usersRepository.findUserByResetToken).mockResolvedValue(userWithNullExpiration);

      const result = await verifyResetToken('token');

      expect(result).toBeNull();
    });
  });

  describe('updateUserPassword', () => {
    it('should update password successfully', async () => {
      vi.mocked(usersRepository.getPasswordHash).mockReturnValue('new-hashed-password');
      vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUser);

      const result = await updateUserPassword('user-123', 'new-password');

      expect(usersRepository.getPasswordHash).toHaveBeenCalledWith('new-password');
      expect(usersRepository.updateUser).toHaveBeenCalledWith('user-123', {
        password_hash: 'new-hashed-password',
        reset_token: null,
        reset_token_expiration: null
      });
      expect(result).toEqual({ success: true, message: 'Contraseña actualizada exitosamente' });
    });

    it('should handle errors and return error message', async () => {
      vi.mocked(usersRepository.getPasswordHash).mockReturnValue('new-hashed-password');
      vi.mocked(usersRepository.updateUser).mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await updateUserPassword('user-123', 'new-password');

      expect(consoleSpy).toHaveBeenCalledWith('Error updating password:', expect.any(Error));
      expect(result).toEqual({ success: false, message: 'Error al actualizar la contraseña' });
      
      consoleSpy.mockRestore();
    });
  });

  describe('deleteAccount', () => {
    const mockOwnedGroups = [
      { id: 'group1', name: 'Group 1', owner_user_id: 'user-123', theme: undefined },
      { id: 'group2', name: 'Group 2', owner_user_id: 'user-123', theme: undefined }
    ];

    it('should delete user account and all associated data', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
      vi.mocked(prodeGroupRepository.findProdeGroupsByOwner).mockResolvedValue(mockOwnedGroups);
      vi.mocked(prodeGroupRepository.deleteAllParticipantsFromGroup).mockResolvedValue([]);
      vi.mocked(prodeGroupRepository.deleteProdeGroup).mockResolvedValue(mockOwnedGroups[0] as any);
      vi.mocked(prodeGroupRepository.deleteParticipantFromAllGroups).mockResolvedValue([]);
      vi.mocked(tournamentGuessRepository.deleteAllUserTournamentGuesses).mockResolvedValue([]);
      vi.mocked(gameGuessRepository.deleteAllUserGameGuesses).mockResolvedValue([]);
      vi.mocked(tournamentGroupTeamGuessRepository.deleteAllUserTournamentStatsGuesses).mockResolvedValue([]);
      vi.mocked(usersRepository.deleteUser).mockResolvedValue(mockUser as any);

      const result = await deleteAccount();

      expect(prodeGroupRepository.findProdeGroupsByOwner).toHaveBeenCalledWith(mockUser.id);
      expect(prodeGroupRepository.deleteAllParticipantsFromGroup).toHaveBeenCalledTimes(2);
      expect(prodeGroupRepository.deleteProdeGroup).toHaveBeenCalledTimes(2);
      expect(prodeGroupRepository.deleteParticipantFromAllGroups).toHaveBeenCalledWith(mockUser.id);
      expect(tournamentGuessRepository.deleteAllUserTournamentGuesses).toHaveBeenCalledWith(mockUser.id);
      expect(gameGuessRepository.deleteAllUserGameGuesses).toHaveBeenCalledWith(mockUser.id);
      expect(tournamentGroupTeamGuessRepository.deleteAllUserTournamentStatsGuesses).toHaveBeenCalledWith(mockUser.id);
      expect(usersRepository.deleteUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ success: true });
    });

    it('should return error when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const result = await deleteAccount();

      expect(result).toEqual({ error: 'No estás autenticado' });
      expect(prodeGroupRepository.findProdeGroupsByOwner).not.toHaveBeenCalled();
    });

    it('should return error when user has no id', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { ...mockUser, id: undefined } } as any);

      const result = await deleteAccount();

      expect(result).toEqual({ error: 'No estás autenticado' });
      expect(prodeGroupRepository.findProdeGroupsByOwner).not.toHaveBeenCalled();
    });

    it('should handle errors during deletion process', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
      vi.mocked(prodeGroupRepository.findProdeGroupsByOwner).mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await deleteAccount();

      expect(consoleSpy).toHaveBeenCalledWith('Error deleting account:', expect.any(Error));
      expect(result).toEqual({ error: 'Error al eliminar la cuenta. Por favor, inténtalo de nuevo.' });
      
      consoleSpy.mockRestore();
    });

    it('should handle empty owned groups array', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockUser } as any);
      vi.mocked(prodeGroupRepository.findProdeGroupsByOwner).mockResolvedValue([]);
      vi.mocked(prodeGroupRepository.deleteParticipantFromAllGroups).mockResolvedValue([]);
      vi.mocked(tournamentGuessRepository.deleteAllUserTournamentGuesses).mockResolvedValue([]);
      vi.mocked(gameGuessRepository.deleteAllUserGameGuesses).mockResolvedValue([]);
      vi.mocked(tournamentGroupTeamGuessRepository.deleteAllUserTournamentStatsGuesses).mockResolvedValue([]);
      vi.mocked(usersRepository.deleteUser).mockResolvedValue(mockUser as any);

      const result = await deleteAccount();

      expect(prodeGroupRepository.deleteAllParticipantsFromGroup).not.toHaveBeenCalled();
      expect(prodeGroupRepository.deleteProdeGroup).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
