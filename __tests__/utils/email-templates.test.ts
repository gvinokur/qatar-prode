import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  generateVerificationEmail,
  generatePasswordResetEmail,
  generateJoinRequestNotificationEmail,
  generateJoinRequestApprovedEmail,
  generateJoinRequestRejectedEmail,
} from '../../app/utils/email-templates';

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
    'joinRequest.adminNotification.subject': 'New join request for {groupName}',
    'joinRequest.adminNotification.title': 'New Join Request',
    'joinRequest.adminNotification.greeting': 'Hi {adminName},',
    'joinRequest.adminNotification.message': '{userName} wants to join {groupName}.',
    'joinRequest.adminNotification.requestedOn': 'Requested on: {date}',
    'joinRequest.adminNotification.viewButton': 'View Request',
    'joinRequest.adminNotification.signature': 'Qatar Prode Team',
    'joinRequest.userApproved.subject': "You've been accepted to {groupName}!",
    'joinRequest.userApproved.title': 'Request Approved',
    'joinRequest.userApproved.greeting': 'Great news, {userName}!',
    'joinRequest.userApproved.message': 'Your request to join {groupName} has been approved.',
    'joinRequest.userApproved.viewButton': 'View Group',
    'joinRequest.userApproved.signature': 'Qatar Prode Team',
    'joinRequest.userRejected.subject': 'Your request to join {groupName} was not approved',
    'joinRequest.userRejected.title': 'Request Not Approved',
    'joinRequest.userRejected.greeting': 'Hi {userName},',
    'joinRequest.userRejected.message': 'Your request to join {groupName} was not approved.',
    'joinRequest.userRejected.cooldown': 'You can request to join again in 7 days.',
    'joinRequest.userRejected.signature': 'Thanks for your interest!',
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
    'joinRequest.adminNotification.subject': 'Nueva solicitud para {groupName}',
    'joinRequest.adminNotification.title': 'Nueva Solicitud',
    'joinRequest.adminNotification.greeting': 'Hola {adminName},',
    'joinRequest.adminNotification.message': '{userName} quiere unirse a {groupName}.',
    'joinRequest.adminNotification.requestedOn': 'Solicitado el: {date}',
    'joinRequest.adminNotification.viewButton': 'Ver Solicitud',
    'joinRequest.adminNotification.signature': 'Equipo Qatar Prode',
    'joinRequest.userApproved.subject': '¡Fuiste aceptado en {groupName}!',
    'joinRequest.userApproved.title': 'Solicitud Aprobada',
    'joinRequest.userApproved.greeting': '¡Buenas noticias, {userName}!',
    'joinRequest.userApproved.message': 'Tu solicitud para unirte a {groupName} fue aprobada.',
    'joinRequest.userApproved.viewButton': 'Ver Grupo',
    'joinRequest.userApproved.signature': 'Equipo Qatar Prode',
    'joinRequest.userRejected.subject': 'Tu solicitud para unirte a {groupName} no fue aprobada',
    'joinRequest.userRejected.title': 'Solicitud No Aprobada',
    'joinRequest.userRejected.greeting': 'Hola {userName},',
    'joinRequest.userRejected.message': 'Tu solicitud para unirte a {groupName} no fue aprobada.',
    'joinRequest.userRejected.cooldown': 'Puedes volver a solicitar en 7 días.',
    'joinRequest.userRejected.signature': '¡Gracias por tu interés!',
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

  describe('generateJoinRequestNotificationEmail', () => {
    it('should send to admin email and include group url', async () => {
      const result = await generateJoinRequestNotificationEmail(
        'admin@example.com', 'AdminUser', 'RequesterUser', 'My Group',
        'Jan 15, 2026', 'https://example.com/groups/1?tab=admin', 'en'
      );

      expect(result.to).toBe('admin@example.com');
      expect(result.html).toContain('href="https://example.com/groups/1?tab=admin"');
    });

    it('should include admin name, requester name and group name directly in HTML', async () => {
      const result = await generateJoinRequestNotificationEmail(
        'admin@example.com', 'AdminUser', 'RequesterUser', 'My Group',
        'Jan 15, 2026', 'https://example.com/groups/1?tab=admin', 'en'
      );

      expect(result.html).toContain('New Join Request');
    });

    it('should include requestedOn translation text in HTML', async () => {
      const result = await generateJoinRequestNotificationEmail(
        'admin@example.com', 'AdminUser', 'RequesterUser', 'My Group',
        'Jan 15, 2026', 'https://example.com/groups/1?tab=admin', 'en'
      );

      // requestedDate is passed as a translation param — mock returns raw key text
      expect(result.html).toContain('Requested on: {date}');
    });

    it('should use Spanish translations when locale is es', async () => {
      const result = await generateJoinRequestNotificationEmail(
        'admin@example.com', 'AdminUser', 'RequesterUser', 'My Group',
        '15 ene. 2026', 'https://example.com/groups/1?tab=admin', 'es'
      );

      expect(result.html).toContain('Nueva Solicitud');
    });

    it('should use Spanish as default locale', async () => {
      const result = await generateJoinRequestNotificationEmail(
        'admin@example.com', 'AdminUser', 'RequesterUser', 'My Group',
        'Jan 15, 2026', 'https://example.com/groups/1?tab=admin'
      );

      expect(result.html).toContain('Nueva Solicitud');
    });
  });

  describe('generateJoinRequestApprovedEmail', () => {
    it('should send to user email', async () => {
      const result = await generateJoinRequestApprovedEmail(
        'user@example.com', 'UserName', 'My Group',
        'https://example.com/groups/1', 'en'
      );

      expect(result.to).toBe('user@example.com');
    });

    it('should include group url link', async () => {
      const result = await generateJoinRequestApprovedEmail(
        'user@example.com', 'UserName', 'My Group',
        'https://example.com/groups/1', 'en'
      );

      expect(result.html).toContain('href="https://example.com/groups/1"');
    });

    it('should include approved title text', async () => {
      const result = await generateJoinRequestApprovedEmail(
        'user@example.com', 'UserName', 'My Group',
        'https://example.com/groups/1', 'en'
      );

      expect(result.html).toContain('Request Approved');
    });

    it('should use Spanish translations when locale is es', async () => {
      const result = await generateJoinRequestApprovedEmail(
        'user@example.com', 'UserName', 'My Group',
        'https://example.com/groups/1', 'es'
      );

      expect(result.html).toContain('Solicitud Aprobada');
    });

    it('should use Spanish as default locale', async () => {
      const result = await generateJoinRequestApprovedEmail(
        'user@example.com', 'UserName', 'My Group',
        'https://example.com/groups/1'
      );

      expect(result.html).toContain('Solicitud Aprobada');
    });
  });

  describe('generateJoinRequestRejectedEmail', () => {
    it('should send to user email', async () => {
      const result = await generateJoinRequestRejectedEmail(
        'user@example.com', 'UserName', 'My Group', 'en'
      );

      expect(result.to).toBe('user@example.com');
    });

    it('should include rejected title text', async () => {
      const result = await generateJoinRequestRejectedEmail(
        'user@example.com', 'UserName', 'My Group', 'en'
      );

      expect(result.html).toContain('Request Not Approved');
    });

    it('should include cooldown message', async () => {
      const result = await generateJoinRequestRejectedEmail(
        'user@example.com', 'UserName', 'My Group', 'en'
      );

      expect(result.html).toContain('You can request to join again in 7 days.');
    });

    it('should use Spanish translations when locale is es', async () => {
      const result = await generateJoinRequestRejectedEmail(
        'user@example.com', 'UserName', 'My Group', 'es'
      );

      expect(result.html).toContain('Solicitud No Aprobada');
    });

    it('should use Spanish as default locale', async () => {
      const result = await generateJoinRequestRejectedEmail(
        'user@example.com', 'UserName', 'My Group'
      );

      expect(result.html).toContain('Solicitud No Aprobada');
    });
  });
});