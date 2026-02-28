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

  return {to: email, subject, html, locale};
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

  return {to: email, subject, html, locale};
}

/**
 * Generate join request notification email for group admin
 */
export async function generateJoinRequestNotificationEmail(
  adminEmail: string,
  adminName: string,
  requesterName: string,
  groupName: string,
  requestedDate: string,
  groupUrl: string,
  locale: Locale = 'es'
) {
  const t = await getTranslations({ locale, namespace: 'emails' });

  const subject = t('joinRequest.adminNotification.subject', { groupName });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a4a4a;">${t('joinRequest.adminNotification.title')}</h2>
      <p>${t('joinRequest.adminNotification.greeting', { adminName })}</p>
      <p>${t('joinRequest.adminNotification.message', { userName: requesterName, groupName })}</p>
      <p style="color: #666; font-size: 14px;">
        ${t('joinRequest.adminNotification.requestedOn', { date: requestedDate })}
      </p>
      <p style="margin: 20px 0;">
        <a
          href="${groupUrl}"
          style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;">
          ${t('joinRequest.adminNotification.viewButton')}
        </a>
      </p>
      <p>${t('joinRequest.adminNotification.signature')}</p>
    </div>
  `;

  return { to: adminEmail, subject, html };
}

/**
 * Generate join request approved email for user
 */
export async function generateJoinRequestApprovedEmail(
  userEmail: string,
  userName: string,
  groupName: string,
  groupUrl: string,
  locale: Locale = 'es'
) {
  const t = await getTranslations({ locale, namespace: 'emails' });

  const subject = t('joinRequest.userApproved.subject', { groupName });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a4a4a;">${t('joinRequest.userApproved.title')}</h2>
      <p>${t('joinRequest.userApproved.greeting', { userName })}</p>
      <p>${t('joinRequest.userApproved.message', { groupName })}</p>
      <p style="margin: 20px 0;">
        <a
          href="${groupUrl}"
          style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;">
          ${t('joinRequest.userApproved.viewButton')}
        </a>
      </p>
      <p>${t('joinRequest.userApproved.signature')}</p>
    </div>
  `;

  return { to: userEmail, subject, html };
}

/**
 * Generate join request rejected email for user
 */
export async function generateJoinRequestRejectedEmail(
  userEmail: string,
  userName: string,
  groupName: string,
  locale: Locale = 'es'
) {
  const t = await getTranslations({ locale, namespace: 'emails' });

  const subject = t('joinRequest.userRejected.subject', { groupName });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a4a4a;">${t('joinRequest.userRejected.title')}</h2>
      <p>${t('joinRequest.userRejected.greeting', { userName })}</p>
      <p>${t('joinRequest.userRejected.message', { groupName })}</p>
      <p style="color: #666; font-size: 14px;">
        ${t('joinRequest.userRejected.cooldown')}
      </p>
      <p>${t('joinRequest.userRejected.signature')}</p>
    </div>
  `;

  return { to: userEmail, subject, html };
}
