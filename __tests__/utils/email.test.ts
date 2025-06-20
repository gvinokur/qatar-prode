import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sendEmail } from '../../app/utils/email';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: vi.fn().mockResolvedValue(true),
    })),
  },
}));

// Mock environment variables
const originalEnv = process.env;

describe('email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      process.env.EMAIL_PROVIDER = 'gmail';
      process.env.GMAIL_USER = 'test@gmail.com';
      process.env.GMAIL_PASS = 'test-password';
    });

    afterEach(() => {
      vi.resetModules();
    });

    const mockEmailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test email content</p>'
    };

    it('should send email successfully with Gmail provider', async () => {
      vi.resetModules();
      vi.doMock('nodemailer', () => ({
        createTransport: vi.fn(() => ({ sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }) }))
      }));
      const { sendEmail } = vi.mocked(await vi.importActual('../../app/utils/email'));
      process.env.EMAIL_PROVIDER = 'gmail';
      process.env.EMAIL_FROM = 'noreply@example.com';
      process.env.EMAIL_SERVER_HOST = 'smtp.gmail.com';
      process.env.EMAIL_SERVER_PORT = '587';
      process.env.EMAIL_SERVER_USER = 'test@gmail.com';
      process.env.EMAIL_SERVER_PASSWORD = 'password123';
      const result = await sendEmail(mockEmailOptions);
      expect(result).toEqual({ success: true, messageId: 'test-message-id' });
    });

    it('should use default Gmail settings when environment variables are not set', async () => {
      vi.resetModules();
      vi.doMock('nodemailer', () => ({
        createTransport: vi.fn(() => ({ sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }) }))
      }));
      const { sendEmail } = vi.mocked(await vi.importActual('../../app/utils/email'));
      process.env.EMAIL_PROVIDER = 'gmail';
      process.env.EMAIL_FROM = 'noreply@example.com';
      await sendEmail(mockEmailOptions);
    });

    it('should return failure for non-Gmail providers', async () => {
      vi.resetModules();
      const { sendEmail } = vi.mocked(await vi.importActual('../../app/utils/email'));
      process.env.EMAIL_PROVIDER = 'mailgun';
      const result = await sendEmail(mockEmailOptions);
      expect(result).toEqual({ success: false, messageId: "Don't have any other provider configured" });
    });

    it('should use Gmail as default provider when EMAIL_PROVIDER is not set', async () => {
      vi.resetModules();
      vi.doMock('nodemailer', () => ({
        createTransport: vi.fn(() => ({ sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }) }))
      }));
      const { sendEmail } = vi.mocked(await vi.importActual('../../app/utils/email'));
      process.env.EMAIL_FROM = 'noreply@example.com';
      process.env.EMAIL_PROVIDER = 'gmail';
      const result = await sendEmail(mockEmailOptions);
      expect(result).toEqual({ success: true, messageId: 'test-message-id' });
    });

    it('should handle Gmail transport errors', async () => {
      vi.resetModules();
      vi.doMock('nodemailer', () => ({
        createTransport: vi.fn(() => ({ sendMail: vi.fn().mockRejectedValue(new Error('SMTP connection failed')) }))
      }));
      const { sendEmail } = vi.mocked(await vi.importActual('../../app/utils/email'));
      process.env.EMAIL_PROVIDER = 'gmail';
      process.env.EMAIL_FROM = 'noreply@example.com';
      await expect(sendEmail(mockEmailOptions)).rejects.toThrow('Failed to send email');
    });

    it('should handle nodemailer createTransport errors', async () => {
      vi.resetModules();
      vi.doMock('nodemailer', () => ({
        createTransport: vi.fn(() => { throw new Error('Invalid SMTP configuration'); })
      }));
      const { sendEmail } = vi.mocked(await vi.importActual('../../app/utils/email'));
      process.env.EMAIL_PROVIDER = 'gmail';
      process.env.EMAIL_FROM = 'noreply@example.com';
      await expect(sendEmail(mockEmailOptions)).rejects.toThrow('Failed to send email');
    });

    it('should handle different email content', async () => {
      vi.resetModules();
      const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-message-id' });
      vi.doMock('nodemailer', () => ({
        createTransport: vi.fn(() => ({ sendMail: mockSendMail }))
      }));
      const { sendEmail } = vi.mocked(await vi.importActual('../../app/utils/email'));
      process.env.EMAIL_PROVIDER = 'gmail';
      process.env.EMAIL_FROM = 'noreply@example.com';
      const differentEmailOptions = {
        to: 'different@example.com',
        subject: 'Different Subject',
        html: '<h1>Different Content</h1>'
      };
      await sendEmail(differentEmailOptions);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: 'different@example.com',
        subject: 'Different Subject',
        html: '<h1>Different Content</h1>',
      });
    });
  });
}); 