'use server'
import mailgun from 'mailgun-js';
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const createMailgunClient = () => {
  // Configure Mailgun client
  return mailgun({
    apiKey: process.env.EMAIL_SERVER_MG_KEY || '',
    domain: process.env.EMAIL_SERVER_MG_DOMAIN || ''
  });
};

const createGmailClient = () => {
  // Configure Nodemailer with Gmail
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: true,
    auth: {
      user: process.env.EMAIL_SERVER_USER || '',
      pass: process.env.EMAIL_SERVER_PASSWORD || '',
    },
  });
};

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    // Determine which email provider to use based on environment variable
    const emailProvider = process.env.EMAIL_PROVIDER || 'mailgun';

    if (emailProvider === 'gmail') {
      // Use Gmail
      const transporter = createGmailClient();

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent via Gmail:', info.messageId);
      return { success: true, messageId: info.messageId };
    } else {
      // Use Mailgun (default)
      const mg = createMailgunClient();

      const data = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      };

      const response = await mg.messages().send(data);
      console.log('Email sent via Mailgun:', response.id);
      return { success: true, messageId: response.id };
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
}
