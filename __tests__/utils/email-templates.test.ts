import { vi, describe, it, expect, beforeEach } from 'vitest';
import { generateVerificationEmail, generatePasswordResetEmail } from '../../app/utils/email-templates';

// Mock translations
const mockTranslations = {
  en: {
    'verification.subject': 'Account Verification - La Maquina Prode',
    'verification.title': 'Verify your email address',
    'verification.greeting': 'Thanks for signing up!',
    'verification.button': 'Verify email address',
    'verification.expiration': 'This link will expire in 24 hours.',
    'verification.signature': 'The La Maquina Prode team',
    'passwordReset.subject': 'Password Recovery - La Maquina Prode',
    'passwordReset.title': 'Reset password',
    'passwordReset.button': 'Reset password',
    'passwordReset.expiration': 'This link will expire in 1 hour.',
    'passwordReset.signature': 'The La Maquina Prode team',
  },
  es: {
    'verification.subject': 'Verificación de Cuenta - La Maquina Prode',
    'verification.title': 'Verifica tu dirección de correo electrónico',
    'verification.greeting': '¡Gracias por registrarte!',
    'verification.button': 'Verificar correo electrónico',
    'verification.expiration': 'Este enlace expirará en 24 horas.',
    'verification.signature': 'El equipo de La Maquina Prode',
    'passwordReset.subject': 'Recuperación de contraseña - La Maquina Prode',
    'passwordReset.title': 'Restablecer contraseña',
    'passwordReset.button': 'Restablecer contraseña',
    'passwordReset.expiration': 'Este enlace expirará en 1 hora.',
    'passwordReset.signature': 'El equipo de La Maquina Prode',
  },
};

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn((config: { locale: string; namespace: string }) => {
    const locale = config.locale || 'es';
    const translations = mockTranslations[locale as keyof typeof mockTranslations];
    return Promise.resolve((key: string) => translations[key as keyof typeof translations] || key);
  }),
}));

describe('email-templates', () => {
  describe('generateVerificationEmail', () => {
    it('should generate Spanish verification email by default', async () => {
      const email = 'test@example.com';
      const verificationLink = 'https://example.com/verify?token=abc123';

      const result = await generateVerificationEmail(email, verificationLink);

      expect(result.to).toBe(email);
      expect(result.subject).toBe('Verificación de Cuenta - La Maquina Prode');
      expect(result.html).toContain('Verifica tu dirección de correo electrónico');
    });

    it('should generate English verification email when locale is en', async () => {
      const email = 'test@example.com';
      const verificationLink = 'https://example.com/verify?token=abc123';

      const result = await generateVerificationEmail(email, verificationLink, 'en');

      expect(result.to).toBe(email);
      expect(result.subject).toBe('Account Verification - La Maquina Prode');
      expect(result.html).toContain('Verify your email address');
      expect(result.html).toContain('Thanks for signing up!');
    });

    it('should include verification link in HTML', async () => {
      const email = 'test@example.com';
      const verificationLink = 'https://example.com/verify?token=abc123';

      const result = await generateVerificationEmail(email, verificationLink);

      expect(result.html).toContain(verificationLink);
      expect(result.html).toContain('Verificar correo electrónico');
      expect(result.html).toContain('Este enlace expirará en 24 horas');
    });

    it('should handle different email addresses', async () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@test.org';
      const verificationLink = 'https://example.com/verify?token=abc123';

      const result1 = await generateVerificationEmail(email1, verificationLink);
      const result2 = await generateVerificationEmail(email2, verificationLink);

      expect(result1.to).toBe(email1);
      expect(result2.to).toBe(email2);
    });

    it('should handle different verification links', async () => {
      const email = 'test@example.com';
      const link1 = 'https://example.com/verify?token=abc123';
      const link2 = 'https://different.com/verify?token=xyz789';

      const result1 = await generateVerificationEmail(email, link1);
      const result2 = await generateVerificationEmail(email, link2);

      expect(result1.html).toContain(link1);
      expect(result2.html).toContain(link2);
    });

    it('should include proper HTML structure', async () => {
      const email = 'test@example.com';
      const verificationLink = 'https://example.com/verify?token=abc123';

      const result = await generateVerificationEmail(email, verificationLink);

      expect(result.html).toContain('<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">');
      expect(result.html).toContain('href="' + verificationLink + '"');
      expect(result.html).toContain('style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;"');
    });
  });

  describe('generatePasswordResetEmail', () => {
    it('should generate Spanish password reset email by default', async () => {
      const email = 'test@example.com';
      const resetLink = 'https://example.com/reset?token=abc123';

      const result = await generatePasswordResetEmail(email, resetLink);

      expect(result.to).toBe(email);
      expect(result.subject).toBe('Recuperación de contraseña - La Maquina Prode');
      expect(result.html).toContain('Restablecer contraseña');
    });

    it('should generate English password reset email when locale is en', async () => {
      const email = 'test@example.com';
      const resetLink = 'https://example.com/reset?token=abc123';

      const result = await generatePasswordResetEmail(email, resetLink, 'en');

      expect(result.to).toBe(email);
      expect(result.subject).toBe('Password Recovery - La Maquina Prode');
      expect(result.html).toContain('Reset password');
    });

    it('should include reset link in HTML', async () => {
      const email = 'test@example.com';
      const resetLink = 'https://example.com/reset?token=abc123';

      const result = await generatePasswordResetEmail(email, resetLink);

      expect(result.html).toContain(resetLink);
      expect(result.html).toContain('Restablecer contraseña');
      expect(result.html).toContain('Este enlace expirará en 1 hora');
    });

    it('should handle different email addresses', async () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@test.org';
      const resetLink = 'https://example.com/reset?token=abc123';

      const result1 = await generatePasswordResetEmail(email1, resetLink);
      const result2 = await generatePasswordResetEmail(email2, resetLink);

      expect(result1.to).toBe(email1);
      expect(result2.to).toBe(email2);
    });

    it('should handle different reset links', async () => {
      const email = 'test@example.com';
      const link1 = 'https://example.com/reset?token=abc123';
      const link2 = 'https://different.com/reset?token=xyz789';

      const result1 = await generatePasswordResetEmail(email, link1);
      const result2 = await generatePasswordResetEmail(email, link2);

      expect(result1.html).toContain(link1);
      expect(result2.html).toContain(link2);
    });

    it('should include proper HTML structure', async () => {
      const email = 'test@example.com';
      const resetLink = 'https://example.com/reset?token=abc123';

      const result = await generatePasswordResetEmail(email, resetLink);

      expect(result.html).toContain('<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">');
      expect(result.html).toContain('href="' + resetLink + '"');
      expect(result.html).toContain('style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;"');
      expect(result.html).toContain('El equipo de La Maquina Prode');
    });
  });
});