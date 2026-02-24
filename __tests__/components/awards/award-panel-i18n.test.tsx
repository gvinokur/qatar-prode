import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import AwardsPanel from '../../../app/components/awards/award-panel';
import { testFactories } from '../../db/test-factories';
import { setTestLocale } from '../../../vitest.setup';
import enAwards from '../../../locales/en/awards.json';
import esAwards from '../../../locales/es/awards.json';

// Mock the actions
vi.mock('../../../app/actions/guesses-actions', () => ({
  updateOrCreateTournamentGuess: vi.fn(),
}));

describe('AwardsPanel - i18n', () => {
  beforeEach(() => {
    // Reset to Spanish for each test
    setTestLocale('es');
  });

  const mockTournament = testFactories.tournament();
  const mockTeams = [
    testFactories.team({ id: 'team-1', name: 'Team 1', short_name: 'T1' }),
    testFactories.team({ id: 'team-2', name: 'Team 2', short_name: 'T2' }),
  ];
  const mockPlayers = [
    {
      id: 'player-1',
      name: 'Player 1',
      team: mockTeams[0],
      team_id: 'team-1',
      tournament_id: mockTournament.id,
      position: 'Forward',
      jersey_number: 10,
    },
  ];

  const mockTournamentGuess = testFactories.tournamentGuess({
    user_id: 'user-1',
    tournament_id: mockTournament.id,
  });

  // Mock dashboard data (added for CompactPredictionDashboard)
  const mockGames: any[] = [];
  const mockGameGuessesArray: any[] = [];
  const mockTournamentPredictionCompletion = null;
  const mockTournamentStartDate = new Date('2024-01-01');
  const mockTeamsMap = {
    'team-1': mockTeams[0],
    'team-2': mockTeams[1],
  };

  // Default props for all tests
  const defaultProps = {
    allPlayers: mockPlayers,
    tournamentGuesses: mockTournamentGuess,
    teams: mockTeams,
    hasThirdPlaceGame: false,
    isPredictionLocked: false,
    tournament: mockTournament,
    games: mockGames,
    gameGuessesArray: mockGameGuessesArray,
    tournamentPredictionCompletion: mockTournamentPredictionCompletion,
    tournamentStartDate: mockTournamentStartDate,
    teamsMap: mockTeamsMap,
  };

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
    it('renders podium title in Spanish', () => {
      renderWithAwards(
        <AwardsPanel {...defaultProps} />,
        'es'
      );

      expect(screen.getByText('Podio del Torneo')).toBeInTheDocument();
    });

    it('renders individual awards title in Spanish with correct spelling', () => {
      renderWithAwards(
        <AwardsPanel {...defaultProps} />,
        'es'
      );

      // Should be "Individuales" not "Inviduales" (typo fix)
      expect(screen.getByText('Premios Individuales')).toBeInTheDocument();
      expect(screen.queryByText(/Inviduales/)).not.toBeInTheDocument();
    });

    it('renders podium labels in Spanish', () => {
      renderWithAwards(
        <AwardsPanel {...defaultProps} />,
        'es'
      );

      // Labels appear in both label element and fieldset legend
      expect(screen.getAllByText('Campeón').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Subcampeón').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Tercer Lugar').length).toBeGreaterThan(0);
    });

    it('renders locked alert in Spanish when predictions locked', () => {
      renderWithAwards(
        <AwardsPanel {...defaultProps} />,
        'es'
      );

      expect(screen.getByText('Las predicciones están bloqueadas para este torneo. Puedes ver tus predicciones pero no puedes hacer cambios.')).toBeInTheDocument();
    });
  });

  describe('English translations', () => {
    it('renders podium title in English', () => {
      renderWithAwards(
        <AwardsPanel {...defaultProps} />,
        'en'
      );

      expect(screen.getByText('Tournament Podium')).toBeInTheDocument();
    });

    it('renders individual awards title in English', () => {
      renderWithAwards(
        <AwardsPanel {...defaultProps} />,
        'en'
      );

      expect(screen.getByText('Individual Awards')).toBeInTheDocument();
    });
  });

  describe('Bug fixes', () => {
    it('fixes typo: "Individuales" not "Inviduales"', () => {
      renderWithAwards(
        <AwardsPanel {...defaultProps} />,
        'es'
      );

      // Correct spelling
      expect(screen.getByText('Premios Individuales')).toBeInTheDocument();
      // Typo should not appear
      expect(screen.queryByText(/Inviduales/)).not.toBeInTheDocument();
    });

    it('fixes language inconsistency: "Tercer Lugar" not "Third Place"', () => {
      renderWithAwards(
        <AwardsPanel {...defaultProps} />,
        'es'
      );

      // Should be Spanish (appears in label and legend)
      expect(screen.getAllByText('Tercer Lugar').length).toBeGreaterThan(0);
      // English text should not appear
      expect(screen.queryByText('Third Place')).not.toBeInTheDocument();
    });

    it('fixes language inconsistency: locked alert in Spanish', () => {
      renderWithAwards(
        <AwardsPanel {...defaultProps} />,
        'es'
      );

      // Should be Spanish
      expect(screen.getByText('Las predicciones están bloqueadas para este torneo. Puedes ver tus predicciones pero no puedes hacer cambios.')).toBeInTheDocument();
      // English text should not appear
      expect(screen.queryByText('Predictions are locked for this tournament. You can view your predictions but cannot make changes.')).not.toBeInTheDocument();
    });
  });

  describe('Award categories', () => {
    it('renders translated award categories in Spanish', () => {
      renderWithAwards(
        <AwardsPanel {...defaultProps} />,
        'es'
      );

      // Award labels appear in label element and possibly in autocomplete options
      expect(screen.getAllByText('Mejor Jugador').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Goleador').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Mejor Arquero').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Mejor Jugador Joven').length).toBeGreaterThan(0);
    });
  });
});
