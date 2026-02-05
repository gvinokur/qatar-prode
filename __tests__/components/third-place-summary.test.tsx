import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import ThirdPlaceSummary from '../../app/components/qualified-teams/third-place-summary';
import { renderWithTheme } from '../utils/test-utils';
import { testFactories } from '../db/test-factories';

describe('ThirdPlaceSummary', () => {
  const mockTeams = [
    testFactories.team({ id: 'team-1', name: 'Argentina', short_name: 'ARG' }),
    testFactories.team({ id: 'team-2', name: 'Brazil', short_name: 'BRA' }),
    testFactories.team({ id: 'team-3', name: 'Chile', short_name: 'CHI' }),
    testFactories.team({ id: 'team-4', name: 'Uruguay', short_name: 'URU' }),
  ];

  describe('When Third Place is Disabled', () => {
    it('should not render when allowsThirdPlace is false', () => {
      const predictions = new Map();
      const { container } = renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('When Third Place is Enabled', () => {
    it('should render when allowsThirdPlace is true', () => {
      const predictions = new Map();
      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText('Third Place Qualifiers')).toBeInTheDocument();
    });

    it('should render as Material-UI Card', () => {
      const predictions = new Map();
      const { container } = renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Progress Indicator', () => {
    it('should show 0% when no teams selected', () => {
      const predictions = new Map();
      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText('Selected: 0 of 4')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should show correct percentage when teams selected', () => {
      const predictions = new Map([
        [
          'team-1',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-1',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-2',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-2',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
      ]);

      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText('Selected: 2 of 4')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should show 100% when all slots filled', () => {
      const predictions = new Map([
        [
          'team-1',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-1',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-2',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-2',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-3',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-3',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-4',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-4',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
      ]);

      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText('Selected: 4 of 4')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should render LinearProgress component', () => {
      const predictions = new Map();
      const { container } = renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      const progressBar = container.querySelector('.MuiLinearProgress-root');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Selected Teams Display', () => {
    it('should show info message when no teams selected', () => {
      const predictions = new Map();
      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText(/No third place teams selected yet/)).toBeInTheDocument();
      expect(screen.getByText(/Select teams from position 3/)).toBeInTheDocument();
    });

    it('should display team chips when teams are selected', () => {
      const predictions = new Map([
        [
          'team-1',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-1',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-2',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-2',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
      ]);

      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText('Argentina')).toBeInTheDocument();
      expect(screen.getByText('Brazil')).toBeInTheDocument();
    });

    it('should render chips as Material-UI Chip components', () => {
      const predictions = new Map([
        [
          'team-1',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-1',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
      ]);

      const { container } = renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      const chips = container.querySelectorAll('.MuiChip-root');
      expect(chips.length).toBe(1);
    });

    it('should only show teams in position 3 that qualify', () => {
      const predictions = new Map([
        [
          'team-1',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-1',
            predicted_position: 1,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-2',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-2',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-3',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-3',
            predicted_position: 3,
            predicted_to_qualify: false,
          }),
        ],
      ]);

      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      expect(screen.queryByText('Argentina')).not.toBeInTheDocument();
      expect(screen.getByText('Brazil')).toBeInTheDocument();
      expect(screen.queryByText('Chile')).not.toBeInTheDocument();
    });
  });

  describe('Over Limit Warning', () => {
    it('should not show warning when within limit', () => {
      const predictions = new Map([
        [
          'team-1',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-1',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-2',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-2',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
      ]);

      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      expect(screen.queryByText(/You have selected/)).not.toBeInTheDocument();
    });

    it('should show error alert when over limit', () => {
      const predictions = new Map([
        [
          'team-1',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-1',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-2',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-2',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-3',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-3',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
      ]);

      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={2}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText(/You have selected 3 teams, but only 2 can qualify/)).toBeInTheDocument();
      expect(screen.getByText(/Please deselect 1 team/)).toBeInTheDocument();
    });

    it('should show correct pluralization for multiple teams over limit', () => {
      const predictions = new Map([
        [
          'team-1',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-1',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-2',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-2',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-3',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-3',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-4',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-4',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
      ]);

      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={2}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText(/You have selected 4 teams, but only 2 can qualify/)).toBeInTheDocument();
      expect(screen.getByText(/Please deselect 2 teams/)).toBeInTheDocument();
    });

    it('should show singular form for one team over limit', () => {
      const predictions = new Map([
        [
          'team-1',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-1',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-2',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-2',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
        [
          'team-3',
          testFactories.qualifiedTeamPrediction({
            team_id: 'team-3',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
      ]);

      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={2}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText(/Please deselect 1 team\./)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty teams array', () => {
      const predictions = new Map();
      renderWithTheme(
        <ThirdPlaceSummary
          teams={[]}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText('Third Place Qualifiers')).toBeInTheDocument();
      expect(screen.getByText(/No third place teams selected yet/)).toBeInTheDocument();
    });

    it('should handle empty predictions map', () => {
      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={new Map()}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText('Third Place Qualifiers')).toBeInTheDocument();
      expect(screen.getByText(/No third place teams selected yet/)).toBeInTheDocument();
    });

    it('should handle maxThirdPlace of 0', () => {
      const predictions = new Map();
      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={0}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText('Selected: 0 of 0')).toBeInTheDocument();
    });

    it('should handle team not found in teams array', () => {
      const predictions = new Map([
        [
          'nonexistent-team',
          testFactories.qualifiedTeamPrediction({
            team_id: 'nonexistent-team',
            predicted_position: 3,
            predicted_to_qualify: true,
          }),
        ],
      ]);

      renderWithTheme(
        <ThirdPlaceSummary
          teams={mockTeams}
          predictions={predictions}
          maxThirdPlace={4}
          allowsThirdPlace={true}
        />
      );

      expect(screen.getByText(/No third place teams selected yet/)).toBeInTheDocument();
    });
  });
});
