'use server'
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
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

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    // Determine which email provider to use based on environment variable
    const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';

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
      return { success: true, messageId: info.messageId };
    } else {
      return { success: false, messageId: "Don't have any other provider configured" };
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
}
