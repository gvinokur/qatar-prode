import { getTranslations } from 'next-intl/server';
import { Locale } from '@/i18n.config';

export interface GroupInvitationEmailParams {
  recipientEmail: string;
  recipientName: string;
  senderDisplayName: string;
  groupName: string;
  inviteLink: string;
  customMessage?: string;
  locale?: Locale;
  groupLogoUrl?: string;
  themeColor?: string;
}

export async function generateGroupInvitationEmail(params: GroupInvitationEmailParams): Promise<{to: string, subject: string, html: string, locale: Locale}> {
  const {
    recipientEmail,
    recipientName,
    senderDisplayName,
    groupName,
    inviteLink,
    customMessage,
    locale = 'es',
    groupLogoUrl,
    themeColor,
  } = params;

  const t = await getTranslations({ locale, namespace: 'emails' });

  const headerColor = themeColor ?? '#1976d2';
  const subject = t('groupInvitation.subject', { groupName });

  const logoBlock = groupLogoUrl
    ? `<img src="${groupLogoUrl}" alt="${groupName}" style="max-height: 64px; max-width: 200px; object-fit: contain; display: block; margin: 0 auto 8px;" />`
    : '';

  const customMessageBlock = customMessage
    ? `<p style="color: #444; font-size: 14px; font-style: italic; border-left: 3px solid ${headerColor}; padding-left: 12px; margin: 16px 0;">
        <strong>${t('groupInvitation.customMessageIntro')}</strong><br/>&ldquo;${customMessage}&rdquo;
      </p>`
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${headerColor}; padding: 24px 16px; text-align: center; border-radius: 4px 4px 0 0;">
        ${logoBlock}
        <h2 style="color: white; margin: 0; font-size: 20px;">${groupName}</h2>
      </div>
      <div style="padding: 24px 16px;">
        <p style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${t('groupInvitation.greeting', { recipientName })}</p>
        <p style="margin-bottom: 16px;">${t('groupInvitation.senderAttribution', { senderDisplayName, groupName })}</p>
        ${customMessageBlock}
        <p style="margin: 24px 0;">
          <a href="${inviteLink}"
            style="display: inline-block; padding: 12px 24px; background-color: ${headerColor}; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
            ${t('groupInvitation.button')}
          </a>
        </p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${inviteLink}</p>
        <p style="margin-top: 24px;">${t('groupInvitation.signature')}</p>
      </div>
    </div>
  `;

  return { to: recipientEmail, subject, html, locale };
}

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
  options: { locale?: Locale; message?: string } = {}
) {
  const { locale = 'es', message } = options;
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
      ${message ? `<p style="color: #444; font-size: 14px; font-style: italic; border-left: 3px solid #1976d2; padding-left: 12px; margin: 16px 0;">${t('joinRequest.adminNotification.personalMessage', { userName: requesterName })}<br>&ldquo;${message}&rdquo;</p>` : ''}
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
