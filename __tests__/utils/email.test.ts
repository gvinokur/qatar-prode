declare global {
  // eslint-disable-next-line no-var
  var mockSendMail: ReturnType<typeof vi.fn>;
  // eslint-disable-next-line no-var
  var mockCreateTransport: ReturnType<typeof vi.fn>;
}

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sendEmail } from '../../app/utils/email';
import nodemailer from 'nodemailer';

// Mock nodemailer
vi.mock('nodemailer', () => {
  const mockSendMail = vi.fn();
  const mockCreateTransport = vi.fn(() => ({
    sendMail: mockSendMail,
    verify: vi.fn().mockResolvedValue(true),
  }));
  globalThis.mockSendMail = mockSendMail;
  globalThis.mockCreateTransport = mockCreateTransport;
  return {
    default: {
      createTransport: mockCreateTransport,
    },
  };
});

// Get the mocked functions
const mockSendMail = vi.fn();
const mockCreateTransport = vi.mocked(nodemailer.createTransport);

// Mock environment variables
const originalEnv = process.env;

describe('email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    
    // Set up default Gmail environment variables
    process.env.EMAIL_PROVIDER = 'gmail';
    process.env.EMAIL_FROM = 'noreply@example.com';
    process.env.EMAIL_SERVER_HOST = 'smtp.gmail.com';
    process.env.EMAIL_SERVER_PORT = '587';
    process.env.EMAIL_SERVER_USER = 'test@gmail.com';
    process.env.EMAIL_SERVER_PASSWORD = 'password123';
    
    // Reset and set resolved value for mockSendMail
    globalThis.mockSendMail.mockReset();
    globalThis.mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });
    // Reset and set default implementation for mockCreateTransport
    globalThis.mockCreateTransport.mockReset();
    globalThis.mockCreateTransport.mockImplementation(() => ({
      sendMail: globalThis.mockSendMail,
      verify: vi.fn().mockResolvedValue(true),
    }));
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

    it('should send email successfully with Gmail provider', async () => {
      const result = await sendEmail(mockEmailOptions);
      expect(result).toEqual({ success: true, messageId: 'test-message-id' });
      expect(globalThis.mockCreateTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@gmail.com',
          pass: 'password123',
        },
      });
    });

    it('should use default Gmail settings when environment variables are not set', async () => {
      // Clear environment variables
      delete process.env.EMAIL_SERVER_HOST;
      delete process.env.EMAIL_SERVER_PORT;
      delete process.env.EMAIL_SERVER_USER;
      delete process.env.EMAIL_SERVER_PASSWORD;
      
      await sendEmail(mockEmailOptions);
      
      expect(globalThis.mockCreateTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: '',
          pass: '',
        },
      });
    });

    it('should return failure for non-Gmail providers', async () => {
      process.env.EMAIL_PROVIDER = 'mailgun';
      const result = await sendEmail(mockEmailOptions);
      expect(result).toEqual({ success: false, messageId: "Don't have any other provider configured" });
    });

    it('should use Gmail as default provider when EMAIL_PROVIDER is not set', async () => {
      delete process.env.EMAIL_PROVIDER;
      const result = await sendEmail(mockEmailOptions);
      expect(result).toEqual({ success: true, messageId: 'test-message-id' });
    });

    it('should handle Gmail transport errors', async () => {
      globalThis.mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));
      await expect(sendEmail(mockEmailOptions)).rejects.toThrow('Failed to send email');
    });

    it('should handle nodemailer createTransport errors', async () => {
      globalThis.mockCreateTransport.mockImplementation(() => {
        throw new Error('Invalid SMTP configuration');
      });
      await expect(sendEmail(mockEmailOptions)).rejects.toThrow('Failed to send email');
    });

    it('should handle different email content', async () => {
      const differentEmailOptions = {
        to: 'different@example.com',
        subject: 'Different Subject',
        html: '<h1>Different Content</h1>'
      };
      await sendEmail(differentEmailOptions);
      expect(globalThis.mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: 'different@example.com',
        subject: 'Different Subject',
        html: '<h1>Different Content</h1>',
      });
    });
  });
}); 