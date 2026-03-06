import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { screen } from '@testing-library/react';
import { BoostAnalysisCard } from '../../../app/components/tournament-stats/boost-analysis-card';
import { renderWithTheme } from '../../utils/test-utils';

describe('BoostAnalysisCard', () => {
  const mockProps = {
    silverBoost: {
      available: 5,
      totalBoosts: 4,
      lockedBoosts: 4,
      activeBoosts: 0,
      used: 4,
      usedPercentage: 80.0,
      scoredGames: 3,
      successRate: 75.0,
      pointsEarned: 18,
      roi: 4.5,
      allocationByGroup: [
        { groupLetter: 'A', count: 1 },
        { groupLetter: 'B', count: 2 }
      ],
      allocationPlayoffs: 1
    },
    goldenBoost: {
      available: 3,
      totalBoosts: 2,
      lockedBoosts: 2,
      activeBoosts: 0,
      used: 2,
      usedPercentage: 66.7,
      scoredGames: 2,
      successRate: 100.0,
      pointsEarned: 20,
      roi: 10.0,
      allocationByGroup: [
        { groupLetter: 'C', count: 1 }
      ],
      allocationPlayoffs: 1
    }
  };

  describe('Rendering with data', () => {
    it('renders card header', () => {
      renderWithTheme(<BoostAnalysisCard {...mockProps} />);
      expect(screen.getByText('Análisis de Boosts')).toBeInTheDocument();
    });

    it('displays silver boost metrics', () => {
      renderWithTheme(<BoostAnalysisCard {...mockProps} />);

      expect(screen.getByText('Boosts Silver')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // available
      expect(screen.getByText(/4.*80\.0%/)).toBeInTheDocument(); // locked (not used anymore)
      expect(screen.getByText(/3.*4.*75\.0%/)).toBeInTheDocument(); // scored games / locked
      expect(screen.getByText('18')).toBeInTheDocument(); // points earned
      expect(screen.getByText(/4\.5 pts/)).toBeInTheDocument(); // ROI
    });

    it('displays golden boost metrics', () => {
      renderWithTheme(<BoostAnalysisCard {...mockProps} />);

      expect(screen.getByText('Boosts Golden')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // available
      expect(screen.getByText(/2.*66\.7%/)).toBeInTheDocument(); // locked (not used anymore)
      expect(screen.getByText(/2.*2.*100\.0%/)).toBeInTheDocument(); // scored games / locked
      expect(screen.getByText('20')).toBeInTheDocument(); // points earned
      expect(screen.getByText(/10\.0 pts/)).toBeInTheDocument(); // ROI
    });

    it('displays boost allocation summary', () => {
      renderWithTheme(<BoostAnalysisCard {...mockProps} />);

      expect(screen.getByText('Distribución de Boosts')).toBeInTheDocument();

      // Silver allocation
      expect(screen.getByText(/Grupo A \(1\), Grupo B \(2\), Playoffs \(1\)/)).toBeInTheDocument();

      // Golden allocation
      expect(screen.getByText(/Grupo C \(1\), Playoffs \(1\)/)).toBeInTheDocument();
    });

    it('hides detailed metrics when no boosts used', () => {
      const noBoostsProps = {
        silverBoost: {
          available: 5,
          totalBoosts: 0,
          lockedBoosts: 0,
          activeBoosts: 0,
          used: 0,
          usedPercentage: 0,
          scoredGames: 0,
          successRate: 0,
          pointsEarned: 0,
          roi: 0,
          allocationByGroup: [],
          allocationPlayoffs: 0
        },
        goldenBoost: {
          available: 3,
          totalBoosts: 0,
          lockedBoosts: 0,
          activeBoosts: 0,
          used: 0,
          usedPercentage: 0,
          scoredGames: 0,
          successRate: 0,
          pointsEarned: 0,
          roi: 0,
          allocationByGroup: [],
          allocationPlayoffs: 0
        }
      };

      renderWithTheme(<BoostAnalysisCard {...noBoostsProps} />);

      // Should not show detailed metrics
      expect(screen.queryByText('Partidos Acertados')).not.toBeInTheDocument();
      expect(screen.queryByText('Puntos Ganados')).not.toBeInTheDocument();
      expect(screen.queryByText('ROI')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state message when no boosts used', () => {
      const emptyProps = {
        silverBoost: {
          available: 5,
          totalBoosts: 0,
          lockedBoosts: 0,
          activeBoosts: 0,
          used: 0,
          usedPercentage: 0,
          scoredGames: 0,
          successRate: 0,
          pointsEarned: 0,
          roi: 0,
          allocationByGroup: [],
          allocationPlayoffs: 0
        },
        goldenBoost: {
          available: 3,
          totalBoosts: 0,
          lockedBoosts: 0,
          activeBoosts: 0,
          used: 0,
          usedPercentage: 0,
          scoredGames: 0,
          successRate: 0,
          pointsEarned: 0,
          roi: 0,
          allocationByGroup: [],
          allocationPlayoffs: 0
        }
      };

      renderWithTheme(<BoostAnalysisCard {...emptyProps} />);

      expect(screen.getByText(/¡Usa tus boosts para maximizar puntos!/i)).toBeInTheDocument();
      expect(screen.getByText(/Disponibles: 5 Silver, 3 Golden/i)).toBeInTheDocument();
    });
  });

  describe('Active boosts warning', () => {
    it('shows active boosts row for silver when activeBoosts > 0', () => {
      const propsWithActiveBoosts = {
        ...mockProps,
        silverBoost: {
          ...mockProps.silverBoost,
          activeBoosts: 2,
        },
      };

      renderWithTheme(<BoostAnalysisCard {...propsWithActiveBoosts} />);

      expect(screen.getByText('Activos')).toBeInTheDocument();
      expect(screen.getByText(/2.*Aún se puede cambiar/)).toBeInTheDocument();
    });

    it('shows active boosts row for golden when activeBoosts > 0', () => {
      const propsWithActiveBoosts = {
        ...mockProps,
        goldenBoost: {
          ...mockProps.goldenBoost,
          activeBoosts: 1,
        },
      };

      renderWithTheme(<BoostAnalysisCard {...propsWithActiveBoosts} />);

      expect(screen.getAllByText('Activos')).toHaveLength(1);
      expect(screen.getByText(/1.*Aún se puede cambiar/)).toBeInTheDocument();
    });

    it('hides active boosts row when activeBoosts is 0', () => {
      renderWithTheme(<BoostAnalysisCard {...mockProps} />);

      expect(screen.queryByText('Activos')).not.toBeInTheDocument();
    });
  });

  describe('ROI and Success Rate calculations', () => {
    it('displays ROI with one decimal place', () => {
      renderWithTheme(<BoostAnalysisCard {...mockProps} />);

      expect(screen.getByText(/4\.5 pts/)).toBeInTheDocument();
      expect(screen.getByText(/10\.0 pts/)).toBeInTheDocument();
    });

    it('displays success rate with one decimal place', () => {
      renderWithTheme(<BoostAnalysisCard {...mockProps} />);

      expect(screen.getByText(/3.*4.*75\.0%/)).toBeInTheDocument(); // silver: 3 / 4 (75.0%)
      expect(screen.getByText(/2.*2.*100\.0%/)).toBeInTheDocument(); // golden: 2 / 2 (100.0%)
    });

    it('handles division by zero (no boosts used)', () => {
      const zeroBoostsProps = {
        ...mockProps,
        silverBoost: {
          ...mockProps.silverBoost,
          used: 0,
          roi: 0,
          successRate: 0
        }
      };

      renderWithTheme(<BoostAnalysisCard {...zeroBoostsProps} />);

      // Should not show ROI/success rate sections for silver (used = 0)
      // But should show them for golden (used > 0)
      expect(screen.getByText(/10\.0 pts/)).toBeInTheDocument(); // golden ROI still shown
    });
  });
});
