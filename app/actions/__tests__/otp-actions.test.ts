import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateOTPEmailContent } from '../otp-actions';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockImplementation(({ namespace }: { namespace: string }) => {
    const translations: Record<string, Record<string, string>> = {
      emails: {
        'otp.subject': 'Your Access Code - Prode Mundial',
        'otp.title': 'Your Access Code',
        'otp.greeting': 'You have requested a code to sign in to Prode Mundial.',
        'otp.validity': '⏱️ Valid for 3 minutes',
        'otp.attempts': 'You have a maximum of 3 attempts to enter this code.',
        'otp.securityTitle': '⚠️ Security:',
        'otp.securityTips.tip1': 'Do not share this code with anyone',
        'otp.securityTips.tip2': 'Prode Mundial will never ask you for this code by phone or email',
        'otp.securityTips.tip3': 'If you did not request this code, you can ignore this message',
        'otp.requestedFor': 'This code was requested for:',
        'otp.support': 'If you have trouble signing in, contact support.',
      },
      emails_es: {
        'otp.subject': 'Tu código de acceso - Prode Mundial',
        'otp.title': 'Tu código de acceso',
        'otp.greeting': 'Has solicitado un código para iniciar sesión en Prode Mundial.',
        'otp.validity': '⏱️ Válido por 3 minutos',
        'otp.attempts': 'Tienes un máximo de 3 intentos para ingresar este código.',
        'otp.securityTitle': '⚠️ Seguridad:',
        'otp.securityTips.tip1': 'No compartas este código con nadie',
        'otp.securityTips.tip2': 'Prode Mundial nunca te pedirá este código por teléfono o correo',
        'otp.securityTips.tip3': 'Si no solicitaste este código, puedes ignorar este mensaje',
        'otp.requestedFor': 'Este código fue solicitado para:',
        'otp.support': 'Si tienes problemas para iniciar sesión, contacta al soporte.',
      },
    };
    return Promise.resolve((key: string) => translations[namespace]?.[key] ?? key);
  }),
}));

describe('generateOTPEmailContent — OTP detection formatting', () => {
  const OTP_CODE = '847391';
  const TEST_EMAIL = 'user@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subject starts with the OTP code followed by a dash separator', async () => {
    const { subject } = await generateOTPEmailContent(TEST_EMAIL, OTP_CODE, 'en');

    expect(subject).toMatch(new RegExp(`^${OTP_CODE} - `));
  });

  it('subject ends with the existing translated suffix', async () => {
    const { subject } = await generateOTPEmailContent(TEST_EMAIL, OTP_CODE, 'en');

    expect(subject).toBe(`${OTP_CODE} - Your Access Code - Prode Mundial`);
  });

  it('plain-text body contains the OTP code on its own prominent line before the greeting', async () => {
    const { text } = await generateOTPEmailContent(TEST_EMAIL, OTP_CODE, 'en');

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const codeLine = lines[0];
    expect(codeLine).toContain(OTP_CODE);
    // Greeting appears after the code line
    const greetingIndex = lines.findIndex((l) => l.includes('requested a code'));
    const codeIndex = lines.findIndex((l) => l.includes(OTP_CODE));
    expect(codeIndex).toBeLessThan(greetingIndex);
  });

  it('html body still contains the OTP code block (no visual regression)', async () => {
    const { html } = await generateOTPEmailContent(TEST_EMAIL, OTP_CODE, 'en');

    expect(html).toContain(OTP_CODE);
  });

  it('subject prefix works for Spanish locale', async () => {
    // Re-mock for Spanish namespace
    const { getTranslations } = await import('next-intl/server');
    vi.mocked(getTranslations).mockImplementationOnce(({ namespace }: { namespace: string; locale?: string }) => {
      if (namespace === 'emails') {
        return Promise.resolve((key: string) => {
          const es: Record<string, string> = {
            'otp.subject': 'Tu código de acceso - Prode Mundial',
            'otp.title': 'Tu código de acceso',
            'otp.greeting': 'Has solicitado un código.',
            'otp.validity': 'Válido 3 minutos',
            'otp.attempts': 'Máximo 3 intentos.',
            'otp.securityTitle': 'Seguridad:',
            'otp.securityTips.tip1': 'tip1',
            'otp.securityTips.tip2': 'tip2',
            'otp.securityTips.tip3': 'tip3',
            'otp.requestedFor': 'Solicitado para:',
            'otp.support': 'Contacta soporte.',
          };
          return es[key] ?? key;
        }) as ReturnType<typeof getTranslations>;
      }
      return Promise.resolve((key: string) => key) as ReturnType<typeof getTranslations>;
    });

    const { subject } = await generateOTPEmailContent(TEST_EMAIL, OTP_CODE, 'es');

    expect(subject).toMatch(new RegExp(`^${OTP_CODE} - `));
    expect(subject).toContain('Tu código de acceso - Prode Mundial');
  });
});
