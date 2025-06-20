import { generateVerificationEmail, generatePasswordResetEmail } from '../../app/utils/email-templates';

describe('email-templates', () => {
  describe('generateVerificationEmail', () => {
    it('should generate verification email with correct structure', () => {
      const email = 'test@example.com';
      const verificationLink = 'https://example.com/verify?token=abc123';
      
      const result = generateVerificationEmail(email, verificationLink);
      
      expect(result).toEqual({
        to: email,
        subject: 'Verificación de Cuenta - La Maquina Prode',
        html: expect.stringContaining('Verifica tu dirección de correo electrónico')
      });
    });

    it('should include verification link in HTML', () => {
      const email = 'test@example.com';
      const verificationLink = 'https://example.com/verify?token=abc123';
      
      const result = generateVerificationEmail(email, verificationLink);
      
      expect(result.html).toContain(verificationLink);
      expect(result.html).toContain('Verificar correo electrónico');
      expect(result.html).toContain('Este enlace expirará en 24 horas');
    });

    it('should handle different email addresses', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@test.org';
      const verificationLink = 'https://example.com/verify?token=abc123';
      
      const result1 = generateVerificationEmail(email1, verificationLink);
      const result2 = generateVerificationEmail(email2, verificationLink);
      
      expect(result1.to).toBe(email1);
      expect(result2.to).toBe(email2);
    });

    it('should handle different verification links', () => {
      const email = 'test@example.com';
      const link1 = 'https://example.com/verify?token=abc123';
      const link2 = 'https://different.com/verify?token=xyz789';
      
      const result1 = generateVerificationEmail(email, link1);
      const result2 = generateVerificationEmail(email, link2);
      
      expect(result1.html).toContain(link1);
      expect(result2.html).toContain(link2);
    });

    it('should include proper HTML structure', () => {
      const email = 'test@example.com';
      const verificationLink = 'https://example.com/verify?token=abc123';
      
      const result = generateVerificationEmail(email, verificationLink);
      
      expect(result.html).toContain('<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">');
      expect(result.html).toContain('<h2>Verifica tu dirección de correo electrónico</h2>');
      expect(result.html).toContain('href="' + verificationLink + '"');
      expect(result.html).toContain('style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;"');
    });
  });

  describe('generatePasswordResetEmail', () => {
    it('should generate password reset email with correct structure', () => {
      const email = 'test@example.com';
      const resetLink = 'https://example.com/reset?token=abc123';
      
      const result = generatePasswordResetEmail(email, resetLink);
      
      expect(result).toEqual({
        to: email,
        subject: 'Recuperación de contraseña - La Maquina Prode',
        html: expect.stringContaining('Recuperación de contraseña')
      });
    });

    it('should include reset link in HTML', () => {
      const email = 'test@example.com';
      const resetLink = 'https://example.com/reset?token=abc123';
      
      const result = generatePasswordResetEmail(email, resetLink);
      
      expect(result.html).toContain(resetLink);
      expect(result.html).toContain('Restablecer contraseña');
      expect(result.html).toContain('Este enlace expirará en 1 hora');
    });

    it('should handle different email addresses', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@test.org';
      const resetLink = 'https://example.com/reset?token=abc123';
      
      const result1 = generatePasswordResetEmail(email1, resetLink);
      const result2 = generatePasswordResetEmail(email2, resetLink);
      
      expect(result1.to).toBe(email1);
      expect(result2.to).toBe(email2);
    });

    it('should handle different reset links', () => {
      const email = 'test@example.com';
      const link1 = 'https://example.com/reset?token=abc123';
      const link2 = 'https://different.com/reset?token=xyz789';
      
      const result1 = generatePasswordResetEmail(email, link1);
      const result2 = generatePasswordResetEmail(email, link2);
      
      expect(result1.html).toContain(link1);
      expect(result2.html).toContain(link2);
    });

    it('should include proper HTML structure', () => {
      const email = 'test@example.com';
      const resetLink = 'https://example.com/reset?token=abc123';
      
      const result = generatePasswordResetEmail(email, resetLink);
      
      expect(result.html).toContain('<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">');
      expect(result.html).toContain('<h2 style="color: #4a4a4a;">Recuperación de contraseña</h2>');
      expect(result.html).toContain('href="' + resetLink + '"');
      expect(result.html).toContain('style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;"');
      expect(result.html).toContain('El equipo de La Maquina Prode');
    });

    it('should include proper content structure', () => {
      const email = 'test@example.com';
      const resetLink = 'https://example.com/reset?token=abc123';
      
      const result = generatePasswordResetEmail(email, resetLink);
      
      expect(result.html).toContain('Hola,');
      expect(result.html).toContain('Has solicitado restablecer tu contraseña para tu cuenta en Qatar Prode.');
      expect(result.html).toContain('Haz clic en el siguiente enlace para crear una nueva contraseña:');
      expect(result.html).toContain('Si no solicitaste restablecer tu contraseña, puedes ignorar este correo electrónico.');
    });
  });
}); 