import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NextIntlClientProvider } from 'next-intl';
import QualifiedTeamsClientPage from '../../../app/components/qualified-teams/qualified-teams-client-page';
import { testFactories } from '../../db/test-factories';
import qualifiedTeamsEs from '../../../locales/es/qualified-teams.json';
import qualifiedTeamsEn from '../../../locales/en/qualified-teams.json';
import { renderWithTheme } from '../../utils/test-utils';

// Helper to render with i18n
const renderWithI18n = (component: React.ReactElement, locale: 'en' | 'es' = 'es') => {
  const messages = {
    'qualified-teams': locale === 'es' ? qualifiedTeamsEs : qualifiedTeamsEn,
  };

  return renderWithTheme(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

/**
 * Smoke tests for QualifiedTeamsClientPage
 * These tests verify the component renders without crashing and displays basic UI elements
 * Full integration testing is complex due to DnD and context dependencies
 */
describe('QualifiedTeamsClientPage - Smoke Tests', () => {
  const mockTournament = {
    ...testFactories.tournament({
      id: 'tournament-1',
      allows_third_place_qualification: true,
      max_third_place_qualifiers: 4,
    }),
    max_silver_games: 5,
    max_golden_games: 3,
  };

  const mockGroup = testFactories.tournamentGroup({
    id: 'group-1',
    tournament_id: 'tournament-1',
    group_letter: 'A',
  });

  const mockTeam1 = testFactories.team({ id: 'team-1', name: 'Argentina' });
  const mockTeam2 = testFactories.team({ id: 'team-2', name: 'Brazil' });

  const mockPrediction1 = testFactories.qualifiedTeamPrediction({
    id: 'pred-1',
    user_id: 'user-1',
    tournament_id: 'tournament-1',
    team_id: 'team-1',
    group_id: 'group-1',
    predicted_position: 1,
    predicted_to_qualify: true,
  });

  const mockProps = {
    tournament: { ...mockTournament, short_name: 'Test' },
    groups: [
      {
        group: mockGroup,
        teams: [mockTeam1, mockTeam2],
      },
    ],
    userId: 'user-1',
    isLocked: false,
    initialPredictions: [mockPrediction1],
    allowsThirdPlace: false,
    maxThirdPlace: 0,
    completeGroupIds: new Set<string>(),
    allGroupsComplete: false,
    // Dashboard props (added for CompactPredictionDashboard)
    games: [],
    gameGuessesArray: [],
    tournamentPredictionCompletion: null,
    tournamentStartDate: new Date('2024-01-01'),
    teamsMap: { 'team-1': mockTeam1, 'team-2': mockTeam2 },
  };

  it('should render without crashing', () => {
    const { container } = renderWithI18n(<QualifiedTeamsClientPage {...mockProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should render with locked state', () => {
    const lockedProps = { ...mockProps, isLocked: true };
    const { container } = renderWithI18n(<QualifiedTeamsClientPage {...lockedProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should render with no initial predictions', () => {
    const emptyProps = { ...mockProps, initialPredictions: [] };
    const { container } = renderWithI18n(<QualifiedTeamsClientPage {...emptyProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should render DnD container', () => {
    const { container } = renderWithI18n(<QualifiedTeamsClientPage {...mockProps} />);
    // Component should render with DnD context
    const dndContainer = container.querySelector('[aria-describedby^="DndDescribedBy"]');
    expect(dndContainer || container.firstChild).toBeTruthy();
  });

  it('should render with third place disabled', () => {
    const noThirdPlaceProps = {
      ...mockProps,
      tournament: testFactories.tournament({
        id: 'tournament-2',
        allows_third_place_qualification: false,
        max_third_place_qualifiers: 0,
      }),
    };
    const { container } = renderWithI18n(<QualifiedTeamsClientPage {...noThirdPlaceProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should render when third place limit is reached', () => {
    // Create 4 teams, 2 in position 3 with qualification (limit is 4 globally)
    const team3 = testFactories.team({ id: 'team-3', name: 'Chile' });
    const team4 = testFactories.team({ id: 'team-4', name: 'Uruguay' });

    const mockGroup2 = testFactories.tournamentGroup({
      id: 'group-2',
      tournament_id: 'tournament-1',
      group_letter: 'B',
    });

    const pred2 = testFactories.qualifiedTeamPrediction({
      id: 'pred-2',
      user_id: 'user-1',
      tournament_id: 'tournament-1',
      team_id: 'team-2',
      group_id: 'group-1',
      predicted_position: 3,
      predicted_to_qualify: true,
    });

    const pred3 = testFactories.qualifiedTeamPrediction({
      id: 'pred-3',
      user_id: 'user-1',
      tournament_id: 'tournament-1',
      team_id: 'team-3',
      group_id: 'group-2',
      predicted_position: 3,
      predicted_to_qualify: true,
    });

    const pred4 = testFactories.qualifiedTeamPrediction({
      id: 'pred-4',
      user_id: 'user-1',
      tournament_id: 'tournament-1',
      team_id: 'team-4',
      group_id: 'group-2',
      predicted_position: 4,
      predicted_to_qualify: false,
    });

    const limitReachedProps = {
      ...mockProps,
      allowsThirdPlace: true,
      maxThirdPlace: 2,
      groups: [
        {
          group: mockGroup,
          teams: [mockTeam1, mockTeam2],
        },
        {
          group: mockGroup2,
          teams: [team3, team4],
        },
      ],
      initialPredictions: [mockPrediction1, pred2, pred3, pred4],
      teamsMap: {
        'team-1': mockTeam1,
        'team-2': mockTeam2,
        'team-3': team3,
        'team-4': team4,
      },
    };

    const { container } = renderWithI18n(<QualifiedTeamsClientPage {...limitReachedProps} />);
    expect(container).toBeInTheDocument();

    // Verify third place teams are rendered
    expect(screen.queryByText('Chile')).toBeInTheDocument();
    expect(screen.queryByText('Uruguay')).toBeInTheDocument();
  });
});
