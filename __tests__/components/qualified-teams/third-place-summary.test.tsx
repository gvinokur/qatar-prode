import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThirdPlaceSummary from '../../../app/components/qualified-teams/third-place-summary';
import { renderWithTheme } from '../../utils/test-utils';
import { testFactories } from '../../db/test-factories';

describe('ThirdPlaceSummary', () => {
  const mockTeam1 = testFactories.team({ id: 'team-1', name: 'Argentina' });
  const mockTeam2 = testFactories.team({ id: 'team-2', name: 'Brazil' });
  const mockTeam3 = testFactories.team({ id: 'team-3', name: 'Chile' });

  const mockPrediction1 = testFactories.qualifiedTeamPrediction({
    team_id: 'team-1',
    predicted_position: 3,
    predicted_to_qualify: true,
  });

  const mockPrediction2 = testFactories.qualifiedTeamPrediction({
    team_id: 'team-2',
    predicted_position: 3,
    predicted_to_qualify: true,
  });

  const mockPrediction3 = testFactories.qualifiedTeamPrediction({
    team_id: 'team-3',
    predicted_position: 1,
    predicted_to_qualify: true,
  });

  it('should not render when allowsThirdPlace is false', () => {
    const teams = [mockTeam1];
    const predictions = new Map([[mockTeam1.id, mockPrediction1]]);

    const { container } = renderWithTheme(
      <ThirdPlaceSummary
        teams={teams}
        predictions={predictions}
        maxThirdPlace={4}
        allowsThirdPlace={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render header and progress indicator', () => {
    const teams = [mockTeam1, mockTeam2];
    const predictions = new Map([
      [mockTeam1.id, mockPrediction1],
      [mockTeam2.id, mockPrediction2],
    ]);

    renderWithTheme(
      <ThirdPlaceSummary
        teams={teams}
        predictions={predictions}
        maxThirdPlace={4}
        allowsThirdPlace={true}
      />
    );

    expect(screen.getByText('Clasificados en Tercer Lugar')).toBeInTheDocument();
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should display selected third place teams', () => {
    const teams = [mockTeam1, mockTeam2];
    const predictions = new Map([
      [mockTeam1.id, mockPrediction1],
      [mockTeam2.id, mockPrediction2],
    ]);

    renderWithTheme(
      <ThirdPlaceSummary
        teams={teams}
        predictions={predictions}
        maxThirdPlace={4}
        allowsThirdPlace={true}
      />
    );

    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Brazil')).toBeInTheDocument();
  });

  it('should show info alert when no teams selected', () => {
    const teams = [mockTeam3];
    const predictions = new Map([[mockTeam3.id, mockPrediction3]]);

    renderWithTheme(
      <ThirdPlaceSummary
        teams={teams}
        predictions={predictions}
        maxThirdPlace={4}
        allowsThirdPlace={true}
      />
    );

    expect(screen.getByText(/Aún no has seleccionado equipos de tercer lugar/)).toBeInTheDocument();
  });

  it('should show error alert when exceeding max limit', () => {
    const teams = [mockTeam1, mockTeam2];
    const predictions = new Map([
      [mockTeam1.id, mockPrediction1],
      [mockTeam2.id, mockPrediction2],
    ]);

    renderWithTheme(
      <ThirdPlaceSummary
        teams={teams}
        predictions={predictions}
        maxThirdPlace={1}
        allowsThirdPlace={true}
      />
    );

    expect(screen.getByText(/Has seleccionado 2 equipos, pero solo 1 pueden clasificar/)).toBeInTheDocument();
    expect(screen.getByText(/Deselecciona 1 equipo/)).toBeInTheDocument();
  });

  it('should show 100% progress when at max limit', () => {
    const teams = [mockTeam1, mockTeam2];
    const predictions = new Map([
      [mockTeam1.id, mockPrediction1],
      [mockTeam2.id, mockPrediction2],
    ]);

    renderWithTheme(
      <ThirdPlaceSummary
        teams={teams}
        predictions={predictions}
        maxThirdPlace={2}
        allowsThirdPlace={true}
      />
    );

    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should only count teams in position 3 that are qualified', () => {
    const notQualifiedPred = testFactories.qualifiedTeamPrediction({
      team_id: 'team-2',
      predicted_position: 3,
      predicted_to_qualify: false,
    });

    const teams = [mockTeam1, mockTeam2];
    const predictions = new Map([
      [mockTeam1.id, mockPrediction1], // position 3, qualified
      [mockTeam2.id, notQualifiedPred], // position 3, not qualified
    ]);

    renderWithTheme(
      <ThirdPlaceSummary
        teams={teams}
        predictions={predictions}
        maxThirdPlace={4}
        allowsThirdPlace={true}
      />
    );

    // Only Argentina should be shown (not Brazil)
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.queryByText('Brazil')).not.toBeInTheDocument();
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
  });
});
