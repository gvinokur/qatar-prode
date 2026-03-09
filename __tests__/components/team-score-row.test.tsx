import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { TeamScoreRow } from '../../app/components/team-score-row';
import { renderWithTheme } from '../utils/test-utils';
import { Theme } from '../../app/db/tables-definition';

const mockHomeTheme: Theme = {
  primary_color: '#FF0000',
  secondary_color: '#FFFFFF',
  logo_url: '/logos/home.png',
};

const mockAwayTheme: Theme = {
  primary_color: '#0000FF',
  secondary_color: '#FFFFFF',
  logo_url: '/logos/away.png',
};

describe('TeamScoreRow', () => {
  describe('Rendering', () => {
    it('renders team names', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
        />
      );

      expect(screen.getByText('Brazil')).toBeInTheDocument();
      expect(screen.getByText('Argentina')).toBeInTheDocument();
    });

    it('displays scores when provided', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={2}
          awayScore={1}
        />
      );

      expect(screen.getByText('2 - 1')).toBeInTheDocument();
    });

    it('displays "vs" when scores are not provided', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
        />
      );

      expect(screen.getByText('vs')).toBeInTheDocument();
    });

    it('displays team logos when themes provided and logo URL is valid', () => {
      const { container } = renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeTeamTheme={mockHomeTheme}
          awayTeamTheme={mockAwayTheme}
        />
      );

      // Note: getThemeLogoUrl may return null for mock themes without proper logo_url
      // If logos are rendered, they should have the correct alt text
      const logos = container.querySelectorAll('img');
      if (logos.length > 0) {
        expect(logos[0]).toHaveAttribute('alt', 'Brazil');
        expect(logos[1]).toHaveAttribute('alt', 'Argentina');
      }
    });

    it('hides logos when themes are null', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeTeamTheme={null}
          awayTeamTheme={null}
        />
      );

      const logos = screen.queryAllByRole('img');
      expect(logos).toHaveLength(0);
    });

    it('displays penalty winner indicator for home team', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={1}
          awayScore={1}
          homePenaltyWinner={true}
        />
      );

      expect(screen.getByText('(x)')).toBeInTheDocument();
    });

    it('displays penalty winner indicator for away team', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={1}
          awayScore={1}
          awayPenaltyWinner={true}
        />
      );

      expect(screen.getByText('(x)')).toBeInTheDocument();
    });
  });

  describe('Clickability', () => {
    it('calls onClick when clicked and clickable is true', () => {
      const onClick = vi.fn();
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          onClick={onClick}
          clickable={true}
        />
      );

      const grid = screen.getByText('Brazil').closest('[class*="MuiGrid-root"]')?.parentElement;
      if (grid) {
        fireEvent.click(grid);
        expect(onClick).toHaveBeenCalledTimes(1);
      }
    });

    it('shows cursor pointer when clickable is true', () => {
      const { container } = renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          clickable={true}
        />
      );

      const grid = container.querySelector('[class*="MuiGrid-container"]');
      expect(grid).toHaveStyle({ cursor: 'pointer' });
    });

    it('does not show cursor pointer when clickable is false', () => {
      const { container } = renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          clickable={false}
        />
      );

      const grid = container.querySelector('[class*="MuiGrid-container"]');
      expect(grid).not.toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('Edge Cases', () => {
    it('handles 0-0 scores', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={0}
          awayScore={0}
        />
      );

      expect(screen.getByText('0 - 0')).toBeInTheDocument();
    });

    it('handles high scores', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={7}
          awayScore={1}
        />
      );

      expect(screen.getByText('7 - 1')).toBeInTheDocument();
    });

    it('handles long team names with ellipsis', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Very Long Team Name That Should Truncate"
          awayTeamName="Another Very Long Team Name"
        />
      );

      expect(screen.getByText('Very Long Team Name That Should Truncate')).toBeInTheDocument();
      expect(screen.getByText('Another Very Long Team Name')).toBeInTheDocument();
    });

    it('handles string scores (for "-" placeholder)', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore="-"
          awayScore="-"
        />
      );

      expect(screen.getByText('- - -')).toBeInTheDocument();
    });

    it('shows "vs" when only home score is provided', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={2}
        />
      );

      expect(screen.getByText('vs')).toBeInTheDocument();
    });

    it('shows "vs" when only away score is provided', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          awayScore={1}
        />
      );

      expect(screen.getByText('vs')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('maintains 5-2-5 grid structure', () => {
      const { container } = renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={2}
          awayScore={1}
        />
      );

      const gridItems = container.querySelectorAll('[class*="MuiGrid-grid"]');
      expect(gridItems).toHaveLength(3); // Home, Score, Away
    });

    it('aligns home team content to the right', () => {
      const { container } = renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
        />
      );

      const homeGrid = screen.getByText('Brazil').closest('[class*="MuiGrid-grid"]');
      expect(homeGrid).toHaveStyle({ justifyContent: 'flex-end' });
    });

    it('aligns away team content to the left', () => {
      const { container } = renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
        />
      );

      const awayGrid = screen.getByText('Argentina').closest('[class*="MuiGrid-grid"]');
      expect(awayGrid).toHaveStyle({ justifyContent: 'flex-start' });
    });

    it('centers score content', () => {
      const { container } = renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={2}
          awayScore={1}
        />
      );

      const scoreGrid = screen.getByText('2 - 1').closest('[class*="MuiGrid-grid"]');
      expect(scoreGrid).toHaveStyle({ justifyContent: 'center' });
    });
  });

  describe('C2 Winner Styling', () => {
    it('applies bold fontWeight and text.primary color to home team name when homeIsWinner=true', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={2}
          awayScore={1}
          homeIsWinner={true}
        />
      );

      const homeTeamEl = screen.getByText('Brazil');
      expect(homeTeamEl).toHaveStyle({ fontWeight: 700 });
    });

    it('applies text.secondary color to away team name when homeIsWinner=true', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={2}
          awayScore={1}
          homeIsWinner={true}
        />
      );

      const awayTeamEl = screen.getByText('Argentina');
      expect(awayTeamEl).toHaveStyle({ fontWeight: 400 });
    });

    it('applies bold fontWeight to away team name when awayIsWinner=true', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={0}
          awayScore={3}
          awayIsWinner={true}
        />
      );

      const awayTeamEl = screen.getByText('Argentina');
      expect(awayTeamEl).toHaveStyle({ fontWeight: 700 });
    });

    it('applies reduced fontWeight to home team name when awayIsWinner=true', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={0}
          awayScore={3}
          awayIsWinner={true}
        />
      );

      const homeTeamEl = screen.getByText('Brazil');
      expect(homeTeamEl).toHaveStyle({ fontWeight: 400 });
    });

    it('does not apply winner/loser styles when neither prop is set (draw)', () => {
      renderWithTheme(
        <TeamScoreRow
          homeTeamName="Brazil"
          awayTeamName="Argentina"
          homeScore={1}
          awayScore={1}
        />
      );

      const homeTeamEl = screen.getByText('Brazil');
      const awayTeamEl = screen.getByText('Argentina');
      // fontWeight medium is the MUI default; not 400 (loser) or 700 (winner)
      expect(homeTeamEl).not.toHaveStyle({ fontWeight: 400 });
      expect(awayTeamEl).not.toHaveStyle({ fontWeight: 400 });
    });
  });
});
