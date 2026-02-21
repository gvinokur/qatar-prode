import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import EmptyAwardsSnackbar from '../../../app/components/awards/empty-award-notification';
import { setTestLocale } from '../../../vitest.setup';
import enAwards from '../../../locales/en/awards.json';
import esAwards from '../../../locales/es/awards.json';

describe('EmptyAwardsSnackbar - i18n', () => {
  beforeEach(() => {
    // Reset to Spanish for each test
    setTestLocale('es');
  });

  const renderWithAwards = (component: React.ReactNode, locale = 'es') => {
    // Set the global test locale to match
    setTestLocale(locale as 'es' | 'en');
    const messages = { awards: locale === 'en' ? enAwards : esAwards };
    return render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        {component}
      </NextIntlClientProvider>
    );
  };

  describe('Spanish translations', () => {
    it('renders notification title in Spanish', () => {
      renderWithAwards(<EmptyAwardsSnackbar open={true} onClose={() => {}} tournamentId="1" />, 'es');

      expect(screen.getByText('Pronóstico de Premios no Finalizado')).toBeInTheDocument();
    });

    it('renders notification message in Spanish', () => {
      renderWithAwards(<EmptyAwardsSnackbar open={true} onClose={() => {}} tournamentId="1" />, 'es');

      expect(screen.getByText(/Hemos detectado que no has elegido quién será el campeón/)).toBeInTheDocument();
      expect(screen.getByText(/La selección de dichas predicciones cierra 5 días/)).toBeInTheDocument();
    });

    it('renders button text in Spanish', () => {
      renderWithAwards(<EmptyAwardsSnackbar open={true} onClose={() => {}} tournamentId="1" />, 'es');

      expect(screen.getByText('Ir a Premios')).toBeInTheDocument();
    });
  });

  describe('English translations', () => {
    it('renders notification title in English', () => {
      renderWithAwards(<EmptyAwardsSnackbar open={true} onClose={() => {}} tournamentId="1" />, 'en');

      expect(screen.getByText('Awards Predictions Not Completed')).toBeInTheDocument();
    });

    it('renders button text in English', () => {
      renderWithAwards(<EmptyAwardsSnackbar open={true} onClose={() => {}} tournamentId="1" />, 'en');

      expect(screen.getByText('Go to Awards')).toBeInTheDocument();
    });
  });
});
