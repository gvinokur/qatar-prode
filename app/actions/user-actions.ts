'use server';

import crypto from 'crypto';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';
import {User, UserNew} from "../db/tables-definition"
import {
  createUser,
  findUserByEmail,
  getPasswordHash,
  updateUser,
  findUserByResetToken,
  findUserByVerificationToken,
  verifyEmail,
  deleteUser,
  userHasPasswordAuth
} from "../db/users-repository"
import {generatePasswordResetEmail, generateVerificationEmail} from "../utils/email-templates";
import {sendEmail} from "../utils/email";
import {auth} from "../../auth";
import {
  deleteAllParticipantsFromGroup, deleteParticipantFromAllGroups, deleteProdeGroup,
  findProdeGroupsByOwner
} from "../db/prode-group-repository";
import {deleteAllUserTournamentGuesses} from "../db/tournament-guess-repository";
import {deleteAllUserGameGuesses} from "../db/game-guess-repository";
import {deleteAllUserGroupPositionsPredictions} from "../db/qualified-teams-repository";

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateVerificationTokenExpiry(): Date {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 24); // Token valid for 24 hours
  return expiryDate;
}

/**
 *
 * @param user - password_hash in this case should be the plain text password
 * @param locale - User's current locale for localized messages
 */
export async function signupUser(user: UserNew, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'auth' });

  const existingUser = await findUserByEmail(user.email)
  if (!existingUser) {
    if (!user.password_hash) {
      return t('signup.errors.passwordRequired');
    }
    const newUser = await createUser({
      ...user,
      password_hash: getPasswordHash(user.password_hash),
      email_verified: false,
      verification_token: generateVerificationToken(),
      verification_token_expiration: generateVerificationTokenExpiry()
    })

    await sendVerificationEmail(newUser, locale)

    return newUser
  } else {
    return t('signup.errors.emailInUse');
  }
}

export async function resendVerificationEmail(locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'errors' });

  const user = await getLoggedInUser()
  if (!user) {
    return { success: false, error: t('auth.userNotFound')};
  }
  const updatedUser = await updateUser(user.id, {
    verification_token: generateVerificationToken(),
    verification_token_expiration: generateVerificationTokenExpiry()
  })

  return sendVerificationEmail(updatedUser, locale)
}

export async function updateNickname(nickname: string, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'errors' });

  const user = await getLoggedInUser();
  if(!user) {
    return t('auth.unauthorized')
  }
  await updateUser(user.id, { nickname })
}

export async function getLoggedInUser() {
  const session = await auth()
  return session?.user
}

/**
 * Creates a password reset link for a user
 * @param email - The email of the user requesting password reset
 * @param locale - User's current locale for localized messages and emails
 * @returns A reset URL or an error message
 */
export async function sendPasswordResetLink(email: string, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'auth' });

  // Find the user by email
  const user = await findUserByEmail(email);

  // Check if user exists
  if (!user) {
    return { success: false, error: t('forgotPassword.errors.userNotFound') };
  }

  // Check if user has password authentication enabled
  // OAuth-only users cannot reset password
  if (!userHasPasswordAuth(user)) {
    return {
      success: false,
      error: t('forgotPassword.errors.googleAccount'),
      isOAuthOnly: true
    };
  }

  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Set expiration time (1 hour from now)
  const resetTokenExpiration = new Date();
  resetTokenExpiration.setHours(resetTokenExpiration.getHours() + 1);

  // Update user with reset token and expiration
  await updateUser(user.id, {
    reset_token: resetToken,
    reset_token_expiration: resetTokenExpiration
  });

  // Create and return the reset URL
  // Note: Replace with your actual domain in production
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${locale}/reset-password?token=${resetToken}`;

  // Generate email content - CRITICAL FIX: Pass locale to email template
  const emailData = await generatePasswordResetEmail(email, resetUrl, locale);

  // Send the email
  const emailResult = await sendEmail(emailData);

  return emailResult
}

export async function verifyUserEmail(token: string, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'auth' });

  try {
    const user = await findUserByVerificationToken(token);
    if (!user) {
      return { success: false, error: t('emailVerifier.errors.invalidLink') };
    }
    const verifiedUser = await verifyEmail(token);

    if (!verifiedUser) {
      return { success: false, error: t('emailVerifier.errors.unexpected') };
    }

    return { success: true, user: verifiedUser };
  } catch {
    return { success: false, error: t('emailVerifier.errors.unexpected') };
  }
}

/**
 * Verifies a password reset token
 * @param token - The reset token to verify
 * @returns The user if token is valid, null otherwise
 */
export async function verifyResetToken(token: string) {
  // Find user by reset token
  const user = await findUserByResetToken(token);

  // If no user found with this token, return null
  if (!user) {
    return null;
  }

  // Check if token has expired
  const now = new Date();
  if (!user.reset_token_expiration || now > user.reset_token_expiration) {
    return null;
  }

  // Token is valid, return the user
  return user;
}

/**
 * Updates a user's password
 * @param userId - The ID of the user
 * @param newPassword - The new password (plain text)
 * @param locale - User's current locale for localized messages
 * @returns Success message or error
 */
export async function updateUserPassword(userId: string, newPassword: string, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'auth' });

  try {
    // Hash the new password
    const passwordHash = getPasswordHash(newPassword);

    // Update the user with the new password hash
    // Also clear the reset token and expiration
    await updateUser(userId, {
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expiration: null
    });

    return { success: true, message: t('resetPassword.success.updated') };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, message: t('resetPassword.errors.updateFailed') };
  }
}

async function sendVerificationEmail(user: User, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'errors' });

  try {
    // Create verification link with locale prefix
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/verify-email?token=${user.verification_token}`;
    // Send verification email - CRITICAL FIX: Pass locale to email template
    const emailData = await generateVerificationEmail(user.email, verificationLink, locale);
    const result = await sendEmail(emailData);

    return result;
  } catch {
    return { success: false, error: t('email.sendFailed') };
  }
}

/**
 * Deletes a user account and all associated data
 * This includes:
 * - Game and tournament guesses
 * - Qualified team predictions
 * - Group memberships
 * - Groups owned by the user
 * - Notification subscriptions
 * - User record itself
 * @param locale - User's current locale for localized error messages
 */
export async function deleteAccount(locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'errors' });

  // Get the current user session
  const user = await getLoggedInUser();

  if (!user?.id) {
    return { error: t('auth.unauthorized') };
  }

  try {
    // Delete all the user owned groups
    const ownedGroups = await findProdeGroupsByOwner(user.id);
    await Promise.all(ownedGroups.map(async (group) => {
      await deleteAllParticipantsFromGroup(group.id)
      await deleteProdeGroup(group.id);
    }))
    // Remove the user from all groups
    await deleteParticipantFromAllGroups(user.id);
    // Delete all user guesses
    await deleteAllUserTournamentGuesses(user.id);
    await deleteAllUserGameGuesses(user.id);
    // Delete all qualified team predictions
    await deleteAllUserGroupPositionsPredictions(user.id);

    // Delete the user record
    await deleteUser(user.id);
    // Return success
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { error: 'Error al eliminar la cuenta. Por favor, inténtalo de nuevo.' };
  }
}
