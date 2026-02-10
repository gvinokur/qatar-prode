import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { screen } from '@testing-library/react';
import { PerformanceOverviewCard } from '../../../app/components/tournament-stats/performance-overview-card';
import { renderWithTheme } from '../../utils/test-utils';

describe('PerformanceOverviewCard', () => {
  const mockProps = {
    totalPoints: 247,
    groupStagePoints: 142,
    groupGamePoints: 92,
    groupBoostBonus: 15,
    groupQualifiedTeamsPoints: 8,
    groupPositionPoints: 27,
    playoffStagePoints: 105,
    playoffGamePoints: 45,
    playoffBoostBonus: 10,
    honorRollPoints: 35,
    individualAwardsPoints: 15
  };

  describe('Rendering with data', () => {
    it('renders card header', () => {
      renderWithTheme(<PerformanceOverviewCard {...mockProps} />);
      expect(screen.getByText('Rendimiento General')).toBeInTheDocument();
    });

    it('displays total points prominently', () => {
      renderWithTheme(<PerformanceOverviewCard {...mockProps} />);
      expect(screen.getByText('247')).toBeInTheDocument();
      expect(screen.getByText('Puntos Totales en Torneo')).toBeInTheDocument();
    });

    it.skip('displays group stage breakdown', () => {
      renderWithTheme(<PerformanceOverviewCard {...mockProps} />);

      expect(screen.getByText('Fase de Grupos')).toBeInTheDocument();
      expect(screen.getByText('92')).toBeInTheDocument(); // group game points
      expect(screen.getByText('8')).toBeInTheDocument(); // qualified teams
      expect(screen.getByText('27')).toBeInTheDocument(); // group positions
      expect(screen.getByText('142')).toBeInTheDocument(); // group stage total
    });

    it('displays boost bonus with success color when present', () => {
      renderWithTheme(<PerformanceOverviewCard {...mockProps} />);

      // Should show boost bonuses (there are 2: group and playoff)
      expect(screen.getAllByText('+ Bonus por Boosts')).toHaveLength(2);
      expect(screen.getByText('+15')).toBeInTheDocument(); // group boost
      expect(screen.getByText('+10')).toBeInTheDocument(); // playoff boost
    });

    it('displays playoff stage breakdown', () => {
      renderWithTheme(<PerformanceOverviewCard {...mockProps} />);

      expect(screen.getByText('Fase de Playoffs')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument(); // playoff game points
      expect(screen.getByText('35')).toBeInTheDocument(); // honor roll
      expect(screen.getByText('15')).toBeInTheDocument(); // individual awards
      expect(screen.getByText('105')).toBeInTheDocument(); // playoff total
    });

    it('hides boost bonus when zero', () => {
      const propsWithoutBoost = {
        ...mockProps,
        groupBoostBonus: 0,
        playoffBoostBonus: 0
      };

      renderWithTheme(<PerformanceOverviewCard {...propsWithoutBoost} />);

      // Boost bonus sections should not be rendered
      expect(screen.queryByText('+ Bonus por Boosts')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state message when no points', () => {
      const emptyProps = {
        totalPoints: 0,
        groupStagePoints: 0,
        groupGamePoints: 0,
        groupBoostBonus: 0,
        groupQualifiedTeamsPoints: 0,
        groupPositionPoints: 0,
        playoffStagePoints: 0,
        playoffGamePoints: 0,
        playoffBoostBonus: 0,
        honorRollPoints: 0,
        individualAwardsPoints: 0
      };

      renderWithTheme(<PerformanceOverviewCard {...emptyProps} />);

      expect(screen.getByText(/No hay predicciones aún/i)).toBeInTheDocument();
      expect(screen.getByText(/Comienza a predecir/i)).toBeInTheDocument();
    });
  });

  describe('Calculations', () => {
    it('correctly displays all point categories', () => {
      renderWithTheme(<PerformanceOverviewCard {...mockProps} />);

      // Check all numerical values are displayed
      expect(screen.getByText('247')).toBeInTheDocument(); // total
      expect(screen.getByText('142')).toBeInTheDocument(); // group stage
      expect(screen.getByText('105')).toBeInTheDocument(); // playoff stage
    });
  });
});
