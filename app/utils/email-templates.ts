export function generateVerificationEmail(email: string, verificationLink: string) {
  const subject = 'Verificación de Cuenta - La Maquina Prode';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verifica tu dirección de correo electrónico</h2>
      <p>¡Gracias por registrarte! Por favor, verifica tu dirección de correo electrónico haciendo clic en el siguiente enlace:</p>
      <p>
        <a href="${verificationLink}" 
        style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;">
          Verificar correo electrónico
        </a>
      </p>
      <p>Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:</p>
      <p>${verificationLink}</p>
      <p>Este enlace expirará en 24 horas.</p>
      <p>Si no te registraste para una cuenta, puedes ignorar este correo electrónico.</p>
    </div>
  `;

  return {to: email, subject, html};
}
/**
 * Generate password reset email content
 */
export function generatePasswordResetEmail(email: string, resetLink: string) {
  const subject = 'Recuperación de contraseña - La Maquina Prode';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a4a4a;">Recuperación de contraseña</h2>
      <p>Hola,</p>
      <p>Has solicitado restablecer tu contraseña para tu cuenta en Qatar Prode.</p>
      <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <p style="margin: 20px 0;">
        <a 
          href="${resetLink}" 
          style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;">
        >
          Restablecer contraseña
        </a>
      </p>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo electrónico.</p>
      <p>Saludos,<br>El equipo de La Maquina Prode</p>
    </div>
  `;

  return {to: email, subject, html};
}
