'use server'
import nodemailer from 'nodemailer';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n.config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  locale?: Locale;
}

const createGmailClient = () => {
  // Configure Nodemailer with Gmail
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER || '',
      pass: process.env.EMAIL_SERVER_PASSWORD || '',
    },
  });
};

export async function sendEmail({
  to,
  subject,
  html,
  locale = 'es' as Locale
}: EmailOptions) {
  try {
    // Validate locale (fallback to 'es' if invalid)
    const validLocale: Locale = (locale === 'en' || locale === 'es') ? locale : 'es';

    // Get localized sender name with error handling
    let from: string;
    try {
      const t = await getTranslations({ locale: validLocale, namespace: 'emails' });
      const senderName = t('senderName');
      const emailAddress = process.env.EMAIL_FROM;
      from = `${senderName} <${emailAddress}>`;
    } catch (translationError) {
      // Fallback to hardcoded default if translations fail
      console.error('Failed to get email sender translation:', translationError);
      from = `"La Maquina" Prode Mundial <${process.env.EMAIL_FROM}>`;
    }

    // Determine which email provider to use based on environment variable
    const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';

    if (emailProvider === 'gmail') {
      // Use Gmail
      const transporter = createGmailClient();

      const mailOptions = {
        from,
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } else {
      return { success: false, messageId: "Don't have any other provider configured" };
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
}
