'use server';

import {UserNew} from "../db/tables-definition"
import {createUser, findUserByEmail, getPasswordHash, updateUser, findUserByResetToken} from "../db/users-repository"
import {getServerSession} from "next-auth/next";
import {randomBytes} from "crypto";

import {authOptions} from "../authOptions";

/**
 *
 * @param user - password_hash in this case should be the plain text password
 */
export async function signupUser(user: UserNew) {
  const existingUser = await findUserByEmail(user.email)
  if (!existingUser) {
    return await createUser({
      ...user,
      password_hash: getPasswordHash(user.password_hash)
    })
  } else {
    return 'Ya existe un usuario con ese e-mail'
  }
}

export async function updateNickname(nickname: string) {
  const user = await getLoggedInUser();
  if(!user) {
    return 'Unauthorized'
  }
  await updateUser(user.id, { nickname })
}

export async function getLoggedInUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

/**
 * Creates a password reset link for a user
 * @param email - The email of the user requesting password reset
 * @returns A reset URL or an error message
 */
export async function createPasswordResetLink(email: string) {
  // Find the user by email
  const user = await findUserByEmail(email);

  // Check if user exists
  if (!user) {
    return 'No existe un usuario con ese e-mail';
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

  return resetUrl;
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
