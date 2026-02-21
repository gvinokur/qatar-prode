import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import MobileFriendlyAutocomplete from '../../../app/components/awards/mobile-friendly-autocomplete';
import { setTestLocale } from '../../../vitest.setup';
import enAwards from '../../../locales/en/awards.json';
import esAwards from '../../../locales/es/awards.json';

describe('MobileFriendlyAutocomplete - i18n', () => {
  beforeEach(() => {
    // Reset to Spanish for each test
    setTestLocale('es');
  });

  const mockOptions = [
    { id: '1', name: 'Option 1' },
    { id: '2', name: 'Option 2' },
  ];

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
    it('renders "Seleccionar" label in Spanish', () => {
      renderWithAwards(
        <MobileFriendlyAutocomplete
          options={mockOptions}
          value={null}
          onChange={() => {}}
          getOptionLabel={(option) => option.name}
          disabled={false}
        />,
        'es'
      );

      expect(screen.getByLabelText('Seleccionar')).toBeInTheDocument();
    });
  });

  describe('English translations', () => {
    it('renders "Select" label in English', () => {
      renderWithAwards(
        <MobileFriendlyAutocomplete
          options={mockOptions}
          value={null}
          onChange={() => {}}
          getOptionLabel={(option) => option.name}
          disabled={false}
        />,
        'en'
      );

      expect(screen.getByLabelText('Select')).toBeInTheDocument();
    });
  });
});
