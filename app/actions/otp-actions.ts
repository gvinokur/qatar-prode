"use server";

import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';
import { generateOTP, verifyOTP, findUserByEmail, findUserByNickname, updateUser, getPasswordHash } from "../db/users-repository";
import { sendEmail } from "../utils/email";
import { User } from "../db/tables-definition";

/**
 * Generate OTP email template with Spanish content
 */
function generateOTPEmailContent(email: string, otpCode: string): { subject: string; html: string; text: string } {
  const subject = `Tu código de acceso - Qatar Prode`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8b0000;">Tu código de acceso</h2>

      <p>Has solicitado un código para iniciar sesión en Qatar Prode.</p>

      <div style="
        font-size: 32px;
        font-weight: bold;
        text-align: center;
        padding: 20px;
        background: #f5f5f5;
        border: 2px solid #8b0000;
        border-radius: 8px;
        margin: 30px 0;
        color: #8b0000;
      ">
        ${otpCode}
      </div>

      <div style="background: #e8f4f8; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>⏱️ Válido por 3 minutos</strong></p>
        <p style="margin: 5px 0;">Tienes máximo 3 intentos para ingresar este código.</p>
      </div>

      <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="margin: 5px 0 10px 0;"><strong>⚠️ Seguridad:</strong></p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>No compartas este código con nadie</li>
          <li>Qatar Prode nunca te pedirá este código por teléfono o email</li>
          <li>Si no solicitaste este código, puedes ignorar este mensaje</li>
        </ul>
      </div>

      <p style="color: #888; font-size: 12px; margin-top: 30px;">
        Este código fue solicitado para: ${email}<br>
        Si tienes problemas para iniciar sesión, contacta a soporte.
      </p>
    </div>
  `;

  const text = `
Tu código de acceso - Qatar Prode

Has solicitado un código para iniciar sesión en Qatar Prode.

Tu código: ${otpCode}

⏱️ Válido por 3 minutos
Tienes máximo 3 intentos para ingresar este código.

⚠️ SEGURIDAD:
• No compartas este código con nadie
• Qatar Prode nunca te pedirá este código por teléfono o email
• Si no solicitaste este código, puedes ignorar este mensaje

Este código fue solicitado para: ${email}
Si tienes problemas para iniciar sesión, contacta a soporte.
  `;

  return { subject, html, text };
}

/**
 * Send OTP code to user's email
 * Generates OTP, sends email with code, enforces rate limiting
 *
 * @param email - User's email address
 * @param locale - User's current locale for localized messages
 * @returns Success status with optional error message
 */
export async function sendOTPCode(email: string, locale: Locale = 'es'): Promise<{
  success: boolean;
  error?: string;
}> {
  const t = await getTranslations({ locale, namespace: 'auth' });

  try {
    // Validate email format
    const trimmedEmail = email?.trim() || '';

    // Length check
    if (!trimmedEmail || trimmedEmail.length > 254) {
      return {
        success: false,
        error: t('emailInput.email.error')
      };
    }

    // Structure validation without regex to avoid ReDoS
    const atIndex = trimmedEmail.indexOf('@');
    const lastDotIndex = trimmedEmail.lastIndexOf('.');

    if (atIndex <= 0 || lastDotIndex <= atIndex + 1 || lastDotIndex >= trimmedEmail.length - 1) {
      return {
        success: false,
        error: t('emailInput.email.error')
      };
    }

    if (trimmedEmail.includes(' ')) {
      return {
        success: false,
        error: t('emailInput.email.error')
      };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate OTP (handles rate limiting and user creation)
    const result = await generateOTP(normalizedEmail);

    if (!result.success) {
      return result;
    }

    // Get user to retrieve OTP code
    const user = await findUserByEmail(normalizedEmail);

    if (!user?.otp_code) {
      const tErrors = await getTranslations({ locale, namespace: 'errors' });
      return {
        success: false,
        error: tErrors('generic')
      };
    }

    // Generate email content
    const { subject, html } = generateOTPEmailContent(normalizedEmail, user.otp_code);

    // Send email
    await sendEmail({
      to: normalizedEmail,
      subject,
      html
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending OTP code:", error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return {
      success: false,
      error: tErrors('email.sendFailed')
    };
  }
}

/**
 * Verify OTP code and return user
 * Checks code validity, expiration, and attempt limits
 *
 * @param email - User's email address
 * @param code - 6-digit OTP code
 * @param locale - User's current locale for localized messages
 * @returns Success status with user object or error message
 */
export async function verifyOTPCode(email: string, code: string, locale: Locale = 'es'): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  const t = await getTranslations({ locale, namespace: 'auth' });

  try {
    if (!email?.trim() || !code?.trim()) {
      return {
        success: false,
        error: t('otp.errors.required')
      };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.trim();

    // Verify OTP
    const result = await verifyOTP(normalizedEmail, normalizedCode);

    return result;
  } catch (error) {
    console.error("Error verifying OTP code:", error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return {
      success: false,
      error: tErrors('generic')
    };
  }
}

/**
 * Create user account via OTP after verification
 * Used for new user signup flow with nickname and optional password
 *
 * @param data - Account creation data
 * @param locale - User's current locale for localized messages
 * @returns Success status with optional error message
 */
export async function createAccountViaOTP(data: {
  email: string;
  nickname: string;
  password?: string | null;
  verifiedOTP: string;
}, locale: Locale = 'es'): Promise<{
  success: boolean;
  error?: string;
}> {
  const t = await getTranslations({ locale, namespace: 'auth' });

  try {
    const { email, nickname, password, verifiedOTP } = data;

    // Validate inputs
    if (!email?.trim() || !nickname?.trim() || !verifiedOTP?.trim()) {
      return {
        success: false,
        error: t('accountSetup.errors.createFailed')
      };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedNickname = nickname.trim();

    // Validate nickname
    if (trimmedNickname.length < 3) {
      return {
        success: false,
        error: t('accountSetup.nickname.minLength', { min: 3 })
      };
    }

    if (trimmedNickname.length > 20) {
      return {
        success: false,
        error: t('accountSetup.nickname.maxLength', { max: 20 })
      };
    }

    // Validate password if provided
    if (password && password.trim().length > 0) {
      if (password.length < 8) {
        return {
          success: false,
          error: t('accountSetup.password.minLength', { min: 8 })
        };
      }
    }

    // Check if nickname is already taken
    const existingUserWithNickname = await findUserByNickname(trimmedNickname);
    if (existingUserWithNickname) {
      return {
        success: false,
        error: t('accountSetup.nickname.unavailable')
      };
    }

    // Get existing placeholder user
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      const tErrors = await getTranslations({ locale, namespace: 'errors' });
      return {
        success: false,
        error: tErrors('auth.userNotFound')
      };
    }

    // Verify OTP was cleared (meaning it was successfully verified)
    if (user.email_verified !== true) {
      return {
        success: false,
        error: t('otp.errors.verifyFailed')
      };
    }

    // Determine auth providers
    const trimmedPassword = password?.trim();
    const hasPassword = trimmedPassword && trimmedPassword.length > 0;
    const authProviders = hasPassword ? ['otp', 'credentials'] : ['otp'];

    // Update user with complete account info
    await updateUser(user.id, {
      nickname: trimmedNickname,
      password_hash: hasPassword ? getPasswordHash(trimmedPassword) : null,
      auth_providers: JSON.stringify(authProviders)
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating account via OTP:", error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return {
      success: false,
      error: tErrors('generic')
    };
  }
}

/**
 * Check if nickname is available
 * Used for real-time validation in AccountSetupForm
 *
 * @param nickname - Desired nickname
 * @param locale - User's current locale for localized messages
 * @returns Availability status
 */
export async function checkNicknameAvailability(nickname: string, locale: Locale = 'es'): Promise<{
  available: boolean;
  error?: string;
}> {
  const t = await getTranslations({ locale, namespace: 'auth' });

  try {
    if (!nickname?.trim()) {
      return {
        available: false,
        error: t('accountSetup.nickname.required')
      };
    }

    const trimmedNickname = nickname.trim();

    // Validate length
    if (trimmedNickname.length < 3 || trimmedNickname.length > 20) {
      return {
        available: false,
        error: t('accountSetup.nickname.minLength', { min: 3 })
      };
    }

    // Check if nickname is taken
    const existingUser = await findUserByNickname(trimmedNickname);
    if (existingUser) {
      return {
        available: false,
        error: t('accountSetup.nickname.unavailable')
      };
    }

    return { available: true };
  } catch (error) {
    console.error("Error checking nickname availability:", error);
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return {
      available: false,
      error: tErrors('generic')
    };
  }
}
