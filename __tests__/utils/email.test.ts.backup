import { sendEmail } from '../../app/utils/email';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn()
  }))
}));

// Mock environment variables
const originalEnv = process.env;

describe('email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendEmail', () => {
    const mockEmailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test email content</p>'
    };

    afterEach(() => {
      jest.resetModules();
      jest.dontMock('nodemailer');
    });

    it('should send email successfully with Gmail provider', async () => {
      jest.resetModules();
      jest.doMock('nodemailer', () => ({
        createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }) }))
      }));
      const { sendEmail } = require('../../app/utils/email');
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
      jest.resetModules();
      jest.doMock('nodemailer', () => ({
        createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }) }))
      }));
      const { sendEmail } = require('../../app/utils/email');
      process.env.EMAIL_PROVIDER = 'gmail';
      process.env.EMAIL_FROM = 'noreply@example.com';
      await sendEmail(mockEmailOptions);
    });

    it('should return failure for non-Gmail providers', async () => {
      jest.resetModules();
      const { sendEmail } = require('../../app/utils/email');
      process.env.EMAIL_PROVIDER = 'mailgun';
      const result = await sendEmail(mockEmailOptions);
      expect(result).toEqual({ success: false, messageId: "Don't have any other provider configured" });
    });

    it('should use Gmail as default provider when EMAIL_PROVIDER is not set', async () => {
      jest.resetModules();
      jest.doMock('nodemailer', () => ({
        createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }) }))
      }));
      const { sendEmail } = require('../../app/utils/email');
      process.env.EMAIL_FROM = 'noreply@example.com';
      process.env.EMAIL_PROVIDER = 'gmail';
      const result = await sendEmail(mockEmailOptions);
      expect(result).toEqual({ success: true, messageId: 'test-message-id' });
    });

    it('should handle Gmail transport errors', async () => {
      jest.resetModules();
      jest.doMock('nodemailer', () => ({
        createTransport: jest.fn(() => ({ sendMail: jest.fn().mockRejectedValue(new Error('SMTP connection failed')) }))
      }));
      const { sendEmail } = require('../../app/utils/email');
      process.env.EMAIL_PROVIDER = 'gmail';
      process.env.EMAIL_FROM = 'noreply@example.com';
      await expect(sendEmail(mockEmailOptions)).rejects.toThrow('Failed to send email');
    });

    it('should handle nodemailer createTransport errors', async () => {
      jest.resetModules();
      jest.doMock('nodemailer', () => ({
        createTransport: jest.fn(() => { throw new Error('Invalid SMTP configuration'); })
      }));
      const { sendEmail } = require('../../app/utils/email');
      process.env.EMAIL_PROVIDER = 'gmail';
      process.env.EMAIL_FROM = 'noreply@example.com';
      await expect(sendEmail(mockEmailOptions)).rejects.toThrow('Failed to send email');
    });

    it('should handle different email content', async () => {
      jest.resetModules();
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
      jest.doMock('nodemailer', () => ({
        createTransport: jest.fn(() => ({ sendMail: mockSendMail }))
      }));
      const { sendEmail } = require('../../app/utils/email');
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