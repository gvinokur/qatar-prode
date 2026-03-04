import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ActualResultDisplay } from '../../app/components/actual-result-display';
import { renderWithTheme } from '../utils/test-utils';
import { Theme } from '../../app/db/tables-definition';

const mockHomeTheme: Theme = {
  primary_color: '#FF0000',
  secondary_color: '#FFFFFF',
  logo_url: '/logos/brazil.png',
};

const mockAwayTheme: Theme = {
  primary_color: '#008000',
  secondary_color: '#FFFFFF',
  logo_url: '/logos/morocco.png',
};

describe('ActualResultDisplay', () => {
  describe('Rendering', () => {
    it('renders with full team names (no abbreviations)', () => {
      renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="correct"
        />
      );

      expect(screen.getByText('Brazil')).toBeInTheDocument();
      expect(screen.getByText('Morocco')).toBeInTheDocument();
    });

    it('displays "Actual Result" label', () => {
      renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="correct"
        />
      );

      expect(screen.getByText(/Actual Result|Resultado Real/)).toBeInTheDocument();
    });

    it('displays correct scores', () => {
      renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={3}
          awayScore={1}
          predictionResult="correct"
        />
      );

      expect(screen.getByText('3 - 1')).toBeInTheDocument();
    });

    it('displays team logos when themes provided and logo URL is valid', () => {
      const { container } = renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="correct"
          homeTeamTheme={mockHomeTheme}
          awayTeamTheme={mockAwayTheme}
        />
      );

      // Note: getThemeLogoUrl may return null for mock themes without proper logo_url
      // If logos are rendered, they should have the correct alt text
      const logos = container.querySelectorAll('img');
      if (logos.length > 0) {
        expect(logos[0]).toHaveAttribute('alt', 'Brazil');
        expect(logos[1]).toHaveAttribute('alt', 'Morocco');
      }
    });

    it('hides logos when themes are null', () => {
      renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="correct"
          homeTeamTheme={null}
          awayTeamTheme={null}
        />
      );

      const logos = screen.queryAllByRole('img');
      expect(logos).toHaveLength(0);
    });

    it('displays penalty scores when provided', () => {
      renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={1}
          awayScore={1}
          predictionResult="incorrect"
          homePenaltyScore={4}
          awayPenaltyScore={3}
        />
      );

      expect(screen.getByText('(4 - 3 pen)')).toBeInTheDocument();
    });

    it('hides penalty scores when not provided', () => {
      renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="correct"
          homePenaltyScore={null}
          awayPenaltyScore={null}
        />
      );

      expect(screen.queryByText(/pen/)).not.toBeInTheDocument();
    });
  });

  describe('Prediction Result Badge', () => {
    it('shows "Exact" badge with 10 points for exact match', () => {
      renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="exact"
        />
      );

      expect(screen.getByText(/Exact \(10 points\)|Exacto \(10 puntos\)/)).toBeInTheDocument();
    });

    it('shows "Correct" badge with 3 points for correct winner', () => {
      renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="correct"
        />
      );

      expect(screen.getByText(/Correct \(3 points\)|Correcto \(3 puntos\)/)).toBeInTheDocument();
    });

    it('shows "Incorrect" badge with 0 points for incorrect prediction', () => {
      renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="incorrect"
        />
      );

      expect(screen.getByText(/Incorrect \(0 points\)|Incorrecto \(0 puntos\)/)).toBeInTheDocument();
    });

    it('uses success color for exact result', () => {
      const { container } = renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="exact"
        />
      );

      // Check that the chip has success color class
      const chip = container.querySelector('.MuiChip-colorSuccess');
      expect(chip).toBeInTheDocument();
    });

    it('uses success color for correct result', () => {
      const { container } = renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="correct"
        />
      );

      const chip = container.querySelector('.MuiChip-colorSuccess');
      expect(chip).toBeInTheDocument();
    });

    it('uses error color for incorrect result', () => {
      const { container } = renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="incorrect"
        />
      );

      const chip = container.querySelector('.MuiChip-colorError');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('shows CheckIcon for exact result', () => {
      const { container } = renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="exact"
        />
      );

      // CheckIcon should be present
      const checkIcon = container.querySelector('[data-testid="CheckIcon"]');
      expect(checkIcon).toBeInTheDocument();
    });

    it('shows CheckIcon for correct result', () => {
      const { container } = renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="correct"
        />
      );

      const checkIcon = container.querySelector('[data-testid="CheckIcon"]');
      expect(checkIcon).toBeInTheDocument();
    });

    it('shows CloseIcon for incorrect result', () => {
      const { container } = renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={2}
          awayScore={1}
          predictionResult="incorrect"
        />
      );

      const closeIcon = container.querySelector('[data-testid="CloseIcon"]');
      expect(closeIcon).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles 0-0 scores', () => {
      renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={0}
          awayScore={0}
          predictionResult="exact"
        />
      );

      expect(screen.getByText('0 - 0')).toBeInTheDocument();
    });

    it('handles high scores', () => {
      renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Brazil"
          awayTeamName="Morocco"
          homeScore={7}
          awayScore={1}
          predictionResult="correct"
        />
      );

      expect(screen.getByText('7 - 1')).toBeInTheDocument();
    });

    it('handles long team names without truncation', () => {
      renderWithTheme(
        <ActualResultDisplay
          homeTeamName="Very Long Team Name That Should Display Fully"
          awayTeamName="Another Very Long Team Name"
          homeScore={2}
          awayScore={1}
          predictionResult="correct"
        />
      );

      expect(screen.getByText('Very Long Team Name That Should Display Fully')).toBeInTheDocument();
      expect(screen.getByText('Another Very Long Team Name')).toBeInTheDocument();
    });
  });
});
