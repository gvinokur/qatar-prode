import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { UserTournamentStatistics } from './user-tournament-statistics'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

describe('UserTournamentStatistics', () => {
  const mockUserGameStatistics = {
    user_id: 'user-1',
    tournament_id: 'test-tournament',
    group_score: 10,
    group_boost_bonus: 2,
    playoff_score: 8,
    playoff_boost_bonus: 3,
    total_correct_guesses: 15,
    total_exact_guesses: 5,
  }

  const mockTournamentGuess = {
    id: 'guess-1',
    user_id: 'user-1',
    tournament_id: 'test-tournament',
    qualified_teams_score: 5,
    group_position_score: 0,
    honor_roll_score: 3,
    individual_awards_score: 2,
  }

  it('renders the statistics card with title', () => {
    renderWithTheme(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
        tournamentGuess={mockTournamentGuess}
        tournamentId="test-tournament"
      />
    )

    expect(screen.getByText('Tus Estadísticas')).toBeInTheDocument()
  })

  it('shows "Estás aquí" subheader when isActive is true', () => {
    renderWithTheme(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
        tournamentGuess={mockTournamentGuess}
        tournamentId="test-tournament"
        isActive={true}
      />
    )

    expect(screen.getByText('Estás aquí')).toBeInTheDocument()
  })

  it('does not show "Estás aquí" subheader when isActive is false', () => {
    renderWithTheme(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
        tournamentGuess={mockTournamentGuess}
        tournamentId="test-tournament"
        isActive={false}
      />
    )

    expect(screen.queryByText('Estás aquí')).not.toBeInTheDocument()
  })

  it('applies active state styling when isActive is true', () => {
    const { container } = renderWithTheme(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
        tournamentGuess={mockTournamentGuess}
        tournamentId="test-tournament"
        isActive={true}
      />
    )

    const card = container.querySelector('.MuiCard-root')
    // MUI sx={{ borderLeft: 3 }} renders as border-left-width
    expect(card).toHaveStyle({
      'border-left-width': '3px',
    })
  })

  it('renders "Ver Detalle" button with BarChart icon', () => {
    renderWithTheme(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
        tournamentGuess={mockTournamentGuess}
        tournamentId="test-tournament"
      />
    )

    // Button has aria-label "Ver página de estadísticas detalladas"
    const button = screen.getByRole('link', { name: /Ver página de estadísticas detalladas/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', '/tournaments/test-tournament/stats')

    // Check icon is present (MUI renders icon as svg)
    const icon = button.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('does not render button when tournamentId is not provided', () => {
    renderWithTheme(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
        tournamentGuess={mockTournamentGuess}
      />
    )

    expect(screen.queryByRole('link', { name: /Ver Detalle/i })).not.toBeInTheDocument()
  })

  it('calculates correct total points', async () => {
    renderWithTheme(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
        tournamentGuess={mockTournamentGuess}
        tournamentId="test-tournament"
      />
    )

    // Groups: 10 (game) + 2 (boost) + 5 (qualified) + 0 (position) = 17
    // Playoffs: 8 (game) + 3 (boost) + 3 (honor) + 2 (awards) = 16
    // Total: 33 pts

    // Expand to see stats
    const expandButton = screen.getByLabelText('mostrar más')
    fireEvent.click(expandButton)

    // Wait for expansion animation and check total is displayed (it should be 33)
    await waitFor(() => {
      expect(screen.getByText(/33 pts/i)).toBeInTheDocument()
    })
  })

  it('handles missing data gracefully', () => {
    renderWithTheme(
      <UserTournamentStatistics
        tournamentId="test-tournament"
      />
    )

    expect(screen.getByText('Tus Estadísticas')).toBeInTheDocument()
  })
})
