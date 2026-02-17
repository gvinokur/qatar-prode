import { getTranslations } from 'next-intl/server';
import { Locale } from '@/i18n.config';

export async function generateVerificationEmail(
  email: string,
  verificationLink: string,
  locale: Locale = 'es'
) {
  const t = await getTranslations({ locale, namespace: 'emails' });

  const subject = t('verification.subject');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${t('verification.title')}</h2>
      <p>${t('verification.greeting')}</p>
      <p>
        <a href="${verificationLink}"
        style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;">
          ${t('verification.button')}
        </a>
      </p>
      <p>${verificationLink}</p>
      <p>${t('verification.expiration')}</p>
      <p>${t('verification.signature')}</p>
    </div>
  `;

  return {to: email, subject, html};
}
/**
 * Generate password reset email content
 */
export async function generatePasswordResetEmail(
  email: string,
  resetLink: string,
  locale: Locale = 'es'
) {
  const t = await getTranslations({ locale, namespace: 'emails' });

  const subject = t('passwordReset.subject');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a4a4a;">${t('passwordReset.title')}</h2>
      <p style="margin: 20px 0;">
        <a
          href="${resetLink}"
          style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;">
          ${t('passwordReset.button')}
        </a>
      </p>
      <p>${t('passwordReset.expiration')}</p>
      <p>${t('passwordReset.signature')}</p>
    </div>
  `;

  return {to: email, subject, html};
}
