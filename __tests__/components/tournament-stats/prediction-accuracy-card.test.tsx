import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { screen } from '@testing-library/react';
import { PredictionAccuracyCard } from '../../../app/components/tournament-stats/prediction-accuracy-card';
import { renderWithTheme } from '../../utils/test-utils';

describe('PredictionAccuracyCard', () => {
  const mockProps = {
    totalPredictionsMade: 32,
    totalGamesAvailable: 38,
    completionPercentage: 84.2,
    overallCorrect: 20,
    overallCorrectPercentage: 62.5,
    overallExact: 8,
    overallExactPercentage: 25.0,
    overallMissed: 4,
    overallMissedPercentage: 12.5,
    groupCorrect: 15,
    groupCorrectPercentage: 46.9,
    groupExact: 6,
    groupExactPercentage: 18.8,
    playoffCorrect: 5,
    playoffCorrectPercentage: 15.6,
    playoffExact: 2,
    playoffExactPercentage: 6.3
  };

  describe('Rendering with data', () => {
    it('renders card header', () => {
      renderWithTheme(<PredictionAccuracyCard {...mockProps} />);
      expect(screen.getByText('Precisión de Predicciones')).toBeInTheDocument();
    });

    it('displays prediction summary', () => {
      renderWithTheme(<PredictionAccuracyCard {...mockProps} />);

      expect(screen.getByText('Predicciones Totales')).toBeInTheDocument();
      expect(screen.getByText('32 / 38')).toBeInTheDocument();
      expect(screen.getByText('84.2%')).toBeInTheDocument(); // completion percentage
    });

    it('displays overall accuracy stats', () => {
      renderWithTheme(<PredictionAccuracyCard {...mockProps} />);

      expect(screen.getByText('Precisión General')).toBeInTheDocument();
      expect(screen.getByText(/20.*62\.5%/)).toBeInTheDocument(); // correct
      expect(screen.getByText(/8.*25\.0%/)).toBeInTheDocument(); // exact
      expect(screen.getByText(/4.*12\.5%/)).toBeInTheDocument(); // missed
    });

    it('displays stage breakdown', () => {
      renderWithTheme(<PredictionAccuracyCard {...mockProps} />);

      // Group stage
      expect(screen.getByText('Fase de Grupos')).toBeInTheDocument();
      expect(screen.getByText(/15.*46\.9%/)).toBeInTheDocument();
      expect(screen.getByText(/6.*18\.8%/)).toBeInTheDocument();

      // Playoff stage
      expect(screen.getByText('Fase de Playoffs')).toBeInTheDocument();
      expect(screen.getByText(/5.*15\.6%/)).toBeInTheDocument();
      expect(screen.getByText(/2.*6\.3%/)).toBeInTheDocument();
    });

    it('formats percentages with one decimal place', () => {
      renderWithTheme(<PredictionAccuracyCard {...mockProps} />);

      // All percentages should have one decimal place
      expect(screen.getByText(/84\.2%/)).toBeInTheDocument();
      expect(screen.getByText(/62\.5%/)).toBeInTheDocument();
      expect(screen.getByText(/25\.0%/)).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state message when no predictions', () => {
      const emptyProps = {
        totalPredictionsMade: 0,
        totalGamesAvailable: 38,
        completionPercentage: 0,
        overallCorrect: 0,
        overallCorrectPercentage: 0,
        overallExact: 0,
        overallExactPercentage: 0,
        overallMissed: 0,
        overallMissedPercentage: 0,
        groupCorrect: 0,
        groupCorrectPercentage: 0,
        groupExact: 0,
        groupExactPercentage: 0,
        playoffCorrect: 0,
        playoffCorrectPercentage: 0,
        playoffExact: 0,
        playoffExactPercentage: 0
      };

      renderWithTheme(<PredictionAccuracyCard {...emptyProps} />);

      expect(screen.getByText(/Haz tu primera predicción/i)).toBeInTheDocument();
      expect(screen.getByText(/estadísticas de precisión/i)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles zero division gracefully (0% display)', () => {
      const zeroProps = {
        ...mockProps,
        totalPredictionsMade: 0,
        overallCorrectPercentage: 0,
        overallExactPercentage: 0
      };

      renderWithTheme(<PredictionAccuracyCard {...zeroProps} />);

      // Should show empty state when no predictions made
      expect(screen.getByText(/Haz tu primera predicción/i)).toBeInTheDocument();
    });
  });
});
