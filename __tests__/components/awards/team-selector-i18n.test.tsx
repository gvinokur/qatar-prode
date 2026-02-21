import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import TeamSelector from '../../../app/components/awards/team-selector';
import { testFactories } from '../../db/test-factories';
import { setTestLocale } from '../../../vitest.setup';
import enAwards from '../../../locales/en/awards.json';
import esAwards from '../../../locales/es/awards.json';

describe('TeamSelector - i18n', () => {
  beforeEach(() => {
    // Reset to Spanish for each test
    setTestLocale('es');
  });

  const mockTeams = [
    testFactories.team({ id: 'team-1', name: 'Team 1', short_name: 'T1' }),
    testFactories.team({ id: 'team-2', name: 'Team 2', short_name: 'T2' }),
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
    it('renders "Ninguno" for None option in Spanish', () => {
      renderWithAwards(
        <TeamSelector
          label="Test Label"
          teams={mockTeams}
          selectedTeamId=""
          name="test"
          disabled={false}
          onChange={() => {}}
        />,
        'es'
      );

      // Open the select to render menu items
      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      // Now the option should be visible
      expect(screen.getByText('Ninguno')).toBeInTheDocument();
    });
  });

  describe('English translations', () => {
    it('renders EnOf marker for None option in English', () => {
      renderWithAwards(
        <TeamSelector
          label="Test Label"
          teams={mockTeams}
          selectedTeamId=""
          name="test"
          disabled={false}
          onChange={() => {}}
        />,
        'en'
      );

      // Open the select to render menu items
      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      // Now the option should be visible
      expect(screen.getByText(/EnOf\(Ninguno\)/)).toBeInTheDocument();
    });
  });
});
