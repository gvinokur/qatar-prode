'use server';

import crypto from 'crypto';
import {User, UserNew} from "../db/tables-definition"
import {
  createUser,
  findUserByEmail,
  getPasswordHash,
  updateUser,
  findUserByResetToken,
  findUserByVerificationToken, verifyEmail, deleteUser
} from "../db/users-repository"
import {randomBytes} from "crypto";
import {generatePasswordResetEmail, generateVerificationEmail} from "../utils/email-templates";
import {sendEmail} from "../utils/email";
import {auth} from "../../auth";
import {
  deleteAllParticipantsFromGroup, deleteParticipantFromAllGroups, deleteProdeGroup,
  findProdeGroupsByOwner,
  findProdeGroupsByParticipant
} from "../db/prode-group-repository";
import {deleteAllUserTournamentGuesses} from "../db/tournament-guess-repository";
import {deleteAllUserGameGuesses} from "../db/game-guess-repository";
import {signOut} from "next-auth/react";
import {deleteAllUserTournamentStatsGuesses} from "../db/tournament-group-team-guess-repository";

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
 */
export async function signupUser(user: UserNew) {
  const existingUser = await findUserByEmail(user.email)
  if (!existingUser) {
    const newUser = await createUser({
      ...user,
      password_hash: getPasswordHash(user.password_hash),
      email_verified: false,
      verification_token: generateVerificationToken(),
      verification_token_expiration: generateVerificationTokenExpiry()
    })

    await sendVerificationEmail(newUser)

    return newUser
  } else {
    return 'Ya existe un usuario con ese e-mail'
  }
}

export async function resendVerificationEmail() {
  const user = await getLoggedInUser()
  if (!user) {
    return { success: false, error: 'No existe un usuario con ese e-mail'};
  }
  const updatedUser = await updateUser(user.id, {
    verification_token: generateVerificationToken(),
    verification_token_expiration: generateVerificationTokenExpiry()
  })

  return sendVerificationEmail(updatedUser)
}


export async function updateNickname(nickname: string) {
  const user = await getLoggedInUser();
  if(!user) {
    return 'Unauthorized'
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
 * @returns A reset URL or an error message
 */
export async function sendPasswordResetLink(email: string) {
  // Find the user by email
  const user = await findUserByEmail(email);

  // Check if user exists
  if (!user) {
    return { success: false, error: 'No existe un usuario con ese e-mail' };
  }

  // Generate a random token
  const resetToken = randomBytes(32).toString('hex');

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
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  // Generate email content
  const emailData = generatePasswordResetEmail(email, resetUrl);

  // Send the email
  const emailResult = await sendEmail(emailData);

  return emailResult
}

export async function verifyUserEmail(token: string) {
  try {
    const user = await findUserByVerificationToken(token);
    if (!user) {
      return { success: false, error: 'Invalid or expired verification link' };
    }
    const verifiedUser = await verifyEmail(token);

    if (!verifiedUser) {
      return { success: false, error: 'Failed to verify email' };
    }

    return { success: true, user: verifiedUser };
  } catch (error) {
    return { success: false, error: 'Failed to verify email' };
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
 * @returns Success message or error
 */
export async function updateUserPassword(userId: string, newPassword: string) {
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

    return { success: true, message: 'Contraseña actualizada exitosamente' };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, message: 'Error al actualizar la contraseña' };
  }
}

async function sendVerificationEmail(user: User) {
  try {
    // Create verification link
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${user.verification_token}`;
    // Send verification email
    const result = await sendEmail(generateVerificationEmail(user.email, verificationLink));

    return result;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
}

/**
 * Deletes a user account and all associated data
 * This includes:
 * - Game and tournament guesses
 * - Group memberships
 * - Groups owned by the user
 * - Notification subscriptions
 * - User record itself
 */
export async function deleteAccount() {
  // Get the current user session
  const user = await getLoggedInUser();

  if (!user?.id) {
    return { error: 'No estás autenticado' };
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
    await deleteAllUserTournamentStatsGuesses(user.id);

    // Delete the user record
    await deleteUser(user.id);
    // Return success
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { error: 'Error al eliminar la cuenta. Por favor, inténtalo de nuevo.' };
  }
}
