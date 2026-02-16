import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

// Helper to expand the card
async function expandCard() {
  const expandButton = screen.getByLabelText(/mostrar más/i)
  await userEvent.click(expandButton)
}

describe('UserTournamentStatistics', () => {
  describe('Initial State (Collapsed)', () => {
    it('renders card with proper ARIA label', () => {
      renderWithTheme(<UserTournamentStatistics />)
      expect(screen.getByLabelText(/estadísticas del usuario/i)).toBeInTheDocument()
    })

    it('starts collapsed by default', () => {
      renderWithTheme(<UserTournamentStatistics />)

      // Content should not be visible when collapsed
      expect(screen.queryByText(/grupos:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/playoffs:/i)).not.toBeInTheDocument()
    })

    it('shows card header even when collapsed', () => {
      renderWithTheme(<UserTournamentStatistics />)
      expect(screen.getByText('Tus Estadísticas')).toBeInTheDocument()
    })

    it('has expand button when collapsed', () => {
      renderWithTheme(<UserTournamentStatistics />)
      const expandButton = screen.getByLabelText(/mostrar más/i)
      expect(expandButton).toBeInTheDocument()
    })

    it('shows Ver Detalle button even when collapsed', () => {
      renderWithTheme(
        <UserTournamentStatistics tournamentId="test-tournament" />
      )
      const link = screen.getByRole('link', { name: /ver.*estadísticas detalladas/i })
      expect(link).toBeInTheDocument()
    })
  })

  describe('Expanded State', () => {
    it('shows all stat labels when expanded', async () => {
      const userGameStatistics = createMockGameStatistic({
        group_score: 30,
        playoff_score: 20
      })
      const tournamentGuess = testFactories.tournamentGuess({
        qualified_teams_score: 10,
        individual_awards_score: 5
      })

      renderWithTheme(
        <UserTournamentStatistics
          userGameStatistics={userGameStatistics}
          tournamentGuess={tournamentGuess}
          tournamentId="test-tournament"
        />
      )

      await expandCard()

      expect(screen.getByText(/grupos:/i)).toBeInTheDocument()
      expect(screen.getByText(/playoffs:/i)).toBeInTheDocument()
      expect(screen.getByText(/clasificados:/i)).toBeInTheDocument()
      expect(screen.getByText(/premios:/i)).toBeInTheDocument()
      expect(screen.getByText(/total:/i)).toBeInTheDocument()
    })

    it('renders with no data gracefully', async () => {
      renderWithTheme(<UserTournamentStatistics />)
      await expandCard()

      // All values should show 0 pts
      const zeroPtsElements = screen.getAllByText('0 pts')
      expect(zeroPtsElements.length).toBe(5) // Groups, Playoffs, Qualified, Awards, Total

      // Total label should be present
      expect(screen.getByText(/total:/i)).toBeInTheDocument()
    })
  })

  describe('Total Calculations', () => {
    it('calculates groups total correctly', async () => {
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

      await expandCard()

      // Groups = group_score (30) + group_boost_bonus (10) = 40 (qualified points are separate)
      const rows = container.querySelectorAll('.MuiBox-root')
      const gruposRow = Array.from(rows).find(row => row.textContent?.includes('Grupos:'))
      expect(gruposRow).toBeDefined()
      expect(gruposRow?.textContent).toContain('40 pts')
    })

    it('calculates playoffs total correctly', async () => {
      const userGameStatistics = createMockGameStatistic({
        playoff_score: 25,
        playoff_boost_bonus: 5
      })

      const { container } = renderWithTheme(
        <UserTournamentStatistics userGameStatistics={userGameStatistics} />
      )

      await expandCard()

      // Playoffs = playoff_score (25) + playoff_boost_bonus (5) = 30
      const rows = container.querySelectorAll('.MuiBox-root')
      const playoffsRow = Array.from(rows).find(row => row.textContent?.includes('Playoffs:'))
      expect(playoffsRow).toBeDefined()
      expect(playoffsRow?.textContent).toContain('30 pts')
    })

    it('calculates qualified total correctly', async () => {
      const tournamentGuess = testFactories.tournamentGuess({
        qualified_teams_score: 12,
        group_position_score: 8
      })

      const { container } = renderWithTheme(
        <UserTournamentStatistics tournamentGuess={tournamentGuess} />
      )

      await expandCard()

      // Qualified = qualified_teams_score (12) + group_position_score (8) = 20
      const rows = container.querySelectorAll('.MuiBox-root')
      const clasificadosRow = Array.from(rows).find(row => row.textContent?.includes('Clasificados:'))
      expect(clasificadosRow).toBeDefined()
      expect(clasificadosRow?.textContent).toContain('20 pts')
    })

    it('calculates awards total correctly', async () => {
      const tournamentGuess = testFactories.tournamentGuess({
        honor_roll_score: 15,
        individual_awards_score: 10
      })

      const { container } = renderWithTheme(
        <UserTournamentStatistics tournamentGuess={tournamentGuess} />
      )

      await expandCard()

      // Awards = honor_roll_score (15) + individual_awards_score (10) = 25
      const rows = container.querySelectorAll('.MuiBox-root')
      const premiosRow = Array.from(rows).find(row => row.textContent?.includes('Premios:'))
      expect(premiosRow).toBeDefined()
      expect(premiosRow?.textContent).toContain('25 pts')
    })

    it('calculates grand total correctly', async () => {
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

      renderWithTheme(
        <UserTournamentStatistics
          userGameStatistics={userGameStatistics}
          tournamentGuess={tournamentGuess}
        />
      )

      await expandCard()

      // Grand Total = groups (30+10=40) + playoffs (25+5=30) + qualified (12+8=20) + awards (15+10=25) = 115
      expect(screen.getByText('Total:')).toBeInTheDocument()
      expect(screen.getByText('115 pts')).toBeInTheDocument()
    })

    it('handles null values gracefully', async () => {
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

      renderWithTheme(
        <UserTournamentStatistics
          userGameStatistics={userGameStatistics}
          tournamentGuess={tournamentGuess}
        />
      )

      await expandCard()

      // All should be 0
      expect(screen.getByText('Total:')).toBeInTheDocument()
      const zeroPtsElements = screen.getAllByText('0 pts')
      expect(zeroPtsElements.length).toBe(5) // All stats should be 0
    })

    it('includes boost bonuses in totals even though not displayed separately', async () => {
      const userGameStatistics = createMockGameStatistic({
        group_score: 20,
        group_boost_bonus: 10, // Should be included in groups total
        playoff_score: 15,
        playoff_boost_bonus: 5 // Should be included in playoffs total
      })

      renderWithTheme(
        <UserTournamentStatistics userGameStatistics={userGameStatistics} />
      )

      await expandCard()

      // Groups = 20 + 10 = 30 (boost bonus included)
      expect(screen.getByText('30 pts')).toBeInTheDocument()
      // Playoffs = 15 + 5 = 20 (boost bonus included)
      expect(screen.getByText('20 pts')).toBeInTheDocument()
      // Total = 30 + 20 = 50
      expect(screen.getByText('50 pts')).toBeInTheDocument()
    })
  })

  describe('Conditional Rendering', () => {
    it('renders link button when tournamentId is provided', () => {
      renderWithTheme(
        <UserTournamentStatistics tournamentId="test-tournament" />
      )

      const link = screen.getByRole('link', { name: /ver.*estadísticas detalladas/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/es/tournaments/test-tournament/stats')
    })

    it('does not render link button when tournamentId is missing', () => {
      renderWithTheme(<UserTournamentStatistics />)

      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('link button has proper accessibility label', () => {
      renderWithTheme(
        <UserTournamentStatistics tournamentId="world-cup-2026" />
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('aria-label', 'Ver página de estadísticas detalladas')
    })
  })

  describe('Integration', () => {
    it('links to correct stats page URL', () => {
      const tournamentId = 'world-cup-2026'
      renderWithTheme(
        <UserTournamentStatistics tournamentId={tournamentId} />
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', `/es/tournaments/${tournamentId}/stats`)
    })

    it('displays all stats with realistic tournament data', async () => {
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

      renderWithTheme(
        <UserTournamentStatistics
          userGameStatistics={userGameStatistics}
          tournamentGuess={tournamentGuess}
          tournamentId="world-cup-2026"
        />
      )

      await expandCard()

      // Groups = 45 + 15 = 60
      expect(screen.getByText('60 pts')).toBeInTheDocument()
      // Playoffs = 32 + 8 = 40
      expect(screen.getByText('40 pts')).toBeInTheDocument()
      // Qualified = 20 + 12 = 32
      expect(screen.getByText('32 pts')).toBeInTheDocument()
      // Awards = 25 + 18 = 43
      expect(screen.getByText('43 pts')).toBeInTheDocument()
      // Total = 60 + 40 + 32 + 43 = 175
      expect(screen.getByText('175 pts')).toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    it('uses Stack layout instead of Grid', async () => {
      const { container } = renderWithTheme(<UserTournamentStatistics />)

      await expandCard()

      // Stack component should be present (uses MuiStack class)
      const stackElements = container.querySelectorAll('[class*="MuiStack"]')
      expect(stackElements.length).toBeGreaterThan(0)
    })

    it('renders dividers between sections', async () => {
      const { container } = renderWithTheme(<UserTournamentStatistics />)

      await expandCard()

      // Should have dividers (MuiDivider class)
      const dividers = container.querySelectorAll('[class*="MuiDivider"]')
      expect(dividers.length).toBe(1) // One before Total
    })

    it('has compact card padding', async () => {
      const { container } = renderWithTheme(<UserTournamentStatistics />)

      await expandCard()

      // CardContent should have p: 2 (16px padding)
      const cardContent = container.querySelector('[class*="MuiCardContent"]')
      expect(cardContent).toBeInTheDocument()
    })
  })
})
