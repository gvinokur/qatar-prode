import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateOTPEmailContent } from '../otp-actions';

const EN_OTP_TRANSLATIONS: Record<string, string> = {
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
};

const ES_OTP_TRANSLATIONS: Record<string, string> = {
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
};

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockImplementation(({ locale, namespace }: { locale: string; namespace: string }) => {
    if (namespace === 'emails') {
      const map = locale === 'es' ? ES_OTP_TRANSLATIONS : EN_OTP_TRANSLATIONS;
      return Promise.resolve((key: string) => map[key] ?? key);
    }
    return Promise.resolve((key: string) => key);
  }),
}));

describe('generateOTPEmailContent — OTP detection formatting', () => {
  const OTP_CODE = '847391';
  const TEST_EMAIL = 'user@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subject is prefixed with the OTP code and retains the translated suffix', async () => {
    const { subject } = await generateOTPEmailContent(TEST_EMAIL, OTP_CODE, 'en');

    expect(subject).toBe(`${OTP_CODE} - Your Access Code - Prode Mundial`);
  });

  it('plain-text body has the OTP code on its own line before the greeting', async () => {
    const { text } = await generateOTPEmailContent(TEST_EMAIL, OTP_CODE, 'en');

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    expect(lines[0]).toContain(OTP_CODE);
    const greetingIndex = lines.findIndex((l) => l.includes('requested a code'));
    expect(greetingIndex).toBeGreaterThan(0);
  });

  it('html body still contains the OTP code block (no visual regression)', async () => {
    const { html } = await generateOTPEmailContent(TEST_EMAIL, OTP_CODE, 'en');

    expect(html).toContain(OTP_CODE);
  });

  it('subject is correctly prefixed for Spanish locale', async () => {
    const { subject } = await generateOTPEmailContent(TEST_EMAIL, OTP_CODE, 'es');

    expect(subject).toBe(`${OTP_CODE} - Tu código de acceso - Prode Mundial`);
  });
});
