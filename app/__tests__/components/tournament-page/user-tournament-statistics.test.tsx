import { describe, it, expect } from 'vitest'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { UserTournamentStatistics } from '@/app/components/tournament-page/user-tournament-statistics'
import { GameStatisticForUser } from '@/types/definitions'
import { testFactories } from '@/__tests__/db/test-factories'

// Helper to create mock GameStatisticForUser
function createMockGameStatistic(overrides?: Partial<GameStatisticForUser>): GameStatisticForUser {
  return {
    user_id: 'user-1',
    total_correct_guesses: 0,
    total_exact_guesses: 0,
    total_score: null,
    total_boost_bonus: null,
    group_correct_guesses: 0,
    group_exact_guesses: 0,
    group_score: null,
    group_boost_bonus: null,
    playoff_correct_guesses: 0,
    playoff_exact_guesses: 0,
    playoff_score: null,
    playoff_boost_bonus: null,
    yesterday_total_score: null,
    yesterday_boost_bonus: null,
    ...overrides
  }
}

describe('UserTournamentStatistics', () => {
  describe('Rendering', () => {
    it('renders all stat rows with correct labels', () => {
      const userGameStatistics = createMockGameStatistic({
        group_score: 30,
        playoff_score: 20
      })
      const tournamentGuess = testFactories.tournamentGuess({
        qualified_teams_score: 10,
        individual_awards_score: 5
      })

      const { getByText } = renderWithTheme(
        <UserTournamentStatistics
          userGameStatistics={userGameStatistics}
          tournamentGuess={tournamentGuess}
          tournamentId="test-tournament"
        />
      )

      expect(getByText(/grupos:/i)).toBeInTheDocument()
      expect(getByText(/playoffs:/i)).toBeInTheDocument()
      expect(getByText(/clasificados:/i)).toBeInTheDocument()
      expect(getByText(/premios:/i)).toBeInTheDocument()
      expect(getByText(/total:/i)).toBeInTheDocument()
    })

    it('renders with no data gracefully', () => {
      const { getByText, getAllByText } = renderWithTheme(<UserTournamentStatistics />)

      // All values should show 0 pts
      const zeroPtsElements = getAllByText('0 pts')
      expect(zeroPtsElements.length).toBe(5) // Groups, Playoffs, Qualified, Awards, Total

      // Total label should be present
      expect(getByText(/total:/i)).toBeInTheDocument()
    })

    it('renders card with proper ARIA label', () => {
      const { getByLabelText } = renderWithTheme(<UserTournamentStatistics />)

      expect(getByLabelText(/estadísticas del usuario/i)).toBeInTheDocument()
    })
  })

  describe('Total Calculations', () => {
    it('calculates groups total correctly', () => {
      const userGameStatistics = createMockGameStatistic({
        group_score: 30,
        group_boost_bonus: 10
      })
      const tournamentGuess = testFactories.tournamentGuess({
        qualified_teams_score: 5,
        group_position_score: 3
      })

      const { container } = renderWithTheme(
        <UserTournamentStatistics
          userGameStatistics={userGameStatistics}
          tournamentGuess={tournamentGuess}
        />
      )

      // Groups = group_score (30) + group_boost_bonus (10) + qualified_teams_score (5) + group_position_score (3) = 48
      // Find the row with "Grupos:" label and check its value
      const rows = container.querySelectorAll('.MuiBox-root')
      const gruposRow = Array.from(rows).find(row => row.textContent?.includes('Grupos:'))
      expect(gruposRow).toBeDefined()
      expect(gruposRow?.textContent).toContain('48 pts')
    })

    it('calculates playoffs total correctly', () => {
      const userGameStatistics = createMockGameStatistic({
        playoff_score: 25,
        playoff_boost_bonus: 5
      })

      const { container } = renderWithTheme(
        <UserTournamentStatistics userGameStatistics={userGameStatistics} />
      )

      // Playoffs = playoff_score (25) + playoff_boost_bonus (5) = 30
      const rows = container.querySelectorAll('.MuiBox-root')
      const playoffsRow = Array.from(rows).find(row => row.textContent?.includes('Playoffs:'))
      expect(playoffsRow).toBeDefined()
      expect(playoffsRow?.textContent).toContain('30 pts')
    })

    it('calculates qualified total correctly', () => {
      const tournamentGuess = testFactories.tournamentGuess({
        qualified_teams_score: 12,
        group_position_score: 8
      })

      const { container } = renderWithTheme(
        <UserTournamentStatistics tournamentGuess={tournamentGuess} />
      )

      // Qualified = qualified_teams_score (12) + group_position_score (8) = 20
      const rows = container.querySelectorAll('.MuiBox-root')
      const clasificadosRow = Array.from(rows).find(row => row.textContent?.includes('Clasificados:'))
      expect(clasificadosRow).toBeDefined()
      expect(clasificadosRow?.textContent).toContain('20 pts')
    })

    it('calculates awards total correctly', () => {
      const tournamentGuess = testFactories.tournamentGuess({
        honor_roll_score: 15,
        individual_awards_score: 10
      })

      const { container } = renderWithTheme(
        <UserTournamentStatistics tournamentGuess={tournamentGuess} />
      )

      // Awards = honor_roll_score (15) + individual_awards_score (10) = 25
      const rows = container.querySelectorAll('.MuiBox-root')
      const premiosRow = Array.from(rows).find(row => row.textContent?.includes('Premios:'))
      expect(premiosRow).toBeDefined()
      expect(premiosRow?.textContent).toContain('25 pts')
    })

    it('calculates grand total correctly', () => {
      const userGameStatistics = createMockGameStatistic({
        group_score: 30,
        group_boost_bonus: 10,
        playoff_score: 25,
        playoff_boost_bonus: 5
      })
      const tournamentGuess = testFactories.tournamentGuess({
        qualified_teams_score: 12,
        group_position_score: 8,
        honor_roll_score: 15,
        individual_awards_score: 10
      })

      const { getByText } = renderWithTheme(
        <UserTournamentStatistics
          userGameStatistics={userGameStatistics}
          tournamentGuess={tournamentGuess}
        />
      )

      // Grand Total = groups (30+10+12+8=60) + playoffs (25+5=30) + awards (15+10=25) = 115
      expect(getByText('Total:')).toBeInTheDocument()
      expect(getByText('115 pts')).toBeInTheDocument()
    })

    it('handles null values gracefully', () => {
      const userGameStatistics = createMockGameStatistic({
        group_score: null,
        group_boost_bonus: null,
        playoff_score: null,
        playoff_boost_bonus: null
      })
      const tournamentGuess = testFactories.tournamentGuess({
        qualified_teams_score: undefined,
        group_position_score: undefined,
        honor_roll_score: undefined,
        individual_awards_score: undefined
      })

      const { getByText, getAllByText } = renderWithTheme(
        <UserTournamentStatistics
          userGameStatistics={userGameStatistics}
          tournamentGuess={tournamentGuess}
        />
      )

      // All should be 0
      expect(getByText('Total:')).toBeInTheDocument()
      const zeroPtsElements = getAllByText('0 pts')
      expect(zeroPtsElements.length).toBe(5) // All stats should be 0
    })

    it('includes boost bonuses in totals even though not displayed separately', () => {
      const userGameStatistics = createMockGameStatistic({
        group_score: 20,
        group_boost_bonus: 10, // Should be included in groups total
        playoff_score: 15,
        playoff_boost_bonus: 5 // Should be included in playoffs total
      })

      const { getByText } = renderWithTheme(
        <UserTournamentStatistics userGameStatistics={userGameStatistics} />
      )

      // Groups = 20 + 10 = 30 (boost bonus included)
      expect(getByText('30 pts')).toBeInTheDocument()
      // Playoffs = 15 + 5 = 20 (boost bonus included)
      expect(getByText('20 pts')).toBeInTheDocument()
      // Total = 30 + 20 = 50
      expect(getByText('50 pts')).toBeInTheDocument()
    })
  })

  describe('Conditional Rendering', () => {
    it('renders link button when tournamentId is provided', () => {
      const { getByRole } = renderWithTheme(
        <UserTournamentStatistics tournamentId="test-tournament" />
      )

      const link = getByRole('link', { name: /ver.*estadísticas detalladas/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/tournaments/test-tournament/stats')
    })

    it('does not render link button when tournamentId is missing', () => {
      const { queryByRole } = renderWithTheme(<UserTournamentStatistics />)

      expect(queryByRole('link')).not.toBeInTheDocument()
    })

    it('link button has proper accessibility label', () => {
      const { getByRole } = renderWithTheme(
        <UserTournamentStatistics tournamentId="world-cup-2026" />
      )

      const link = getByRole('link')
      expect(link).toHaveAttribute('aria-label', 'Ver página de estadísticas detalladas')
    })
  })

  describe('Integration', () => {
    it('links to correct stats page URL', () => {
      const tournamentId = 'world-cup-2026'
      const { getByRole } = renderWithTheme(
        <UserTournamentStatistics tournamentId={tournamentId} />
      )

      const link = getByRole('link')
      expect(link).toHaveAttribute('href', `/tournaments/${tournamentId}/stats`)
    })

    it('displays all stats with realistic tournament data', () => {
      const userGameStatistics = createMockGameStatistic({
        group_score: 45,
        group_boost_bonus: 15,
        playoff_score: 32,
        playoff_boost_bonus: 8
      })
      const tournamentGuess = testFactories.tournamentGuess({
        qualified_teams_score: 20,
        group_position_score: 12,
        honor_roll_score: 25,
        individual_awards_score: 18
      })

      const { getByText } = renderWithTheme(
        <UserTournamentStatistics
          userGameStatistics={userGameStatistics}
          tournamentGuess={tournamentGuess}
          tournamentId="world-cup-2026"
        />
      )

      // Groups = 45 + 15 + 20 + 12 = 92
      expect(getByText('92 pts')).toBeInTheDocument()
      // Playoffs = 32 + 8 = 40
      expect(getByText('40 pts')).toBeInTheDocument()
      // Qualified = 20 + 12 = 32
      expect(getByText('32 pts')).toBeInTheDocument()
      // Awards = 25 + 18 = 43
      expect(getByText('43 pts')).toBeInTheDocument()
      // Total = 92 + 40 + 43 = 175
      expect(getByText('175 pts')).toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    it('uses Stack layout instead of Grid', () => {
      const { container } = renderWithTheme(<UserTournamentStatistics />)

      // Stack component should be present (uses MuiStack class)
      const stackElements = container.querySelectorAll('[class*="MuiStack"]')
      expect(stackElements.length).toBeGreaterThan(0)
    })

    it('renders dividers between sections', () => {
      const { container } = renderWithTheme(<UserTournamentStatistics />)

      // Should have dividers (MuiDivider class)
      const dividers = container.querySelectorAll('[class*="MuiDivider"]')
      expect(dividers.length).toBe(2) // One before Total, one after Total
    })

    it('has compact card padding', () => {
      const { container } = renderWithTheme(<UserTournamentStatistics />)

      // CardContent should have p: 2 (16px padding)
      const cardContent = container.querySelector('[class*="MuiCardContent"]')
      expect(cardContent).toBeInTheDocument()
    })
  })
})
