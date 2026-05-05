import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { UserTournamentStatistics } from './user-tournament-statistics'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { NextIntlClientProvider } from 'next-intl'

// Mock next-intl hooks
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl')
  return {
    ...actual,
    useLocale: () => 'es',
  }
})

describe('UserTournamentStatistics', () => {
  // Spanish translations for stats.sidebar
  const spanishMessages = {
    stats: {
      sidebar: {
        title: 'Tus Estadísticas',
        activeIndicator: 'Estás aquí',
        labels: {
          groups: 'Grupos:',
          playoffs: 'Playoffs:',
          qualified: 'Clasificados:',
          awards: 'Premios:',
          total: 'Total:',
        },
        viewDetails: 'Ver Detalle',
        ariaLabels: {
          card: 'Estadísticas del usuario',
          expandButton: 'mostrar más',
          viewDetailsButton: 'Ver página de estadísticas detalladas',
        },
      },
    },
  }

  // Helper to render with NextIntlClientProvider
  const renderWithIntl = (ui: React.ReactElement) => {
    return renderWithTheme(
      <NextIntlClientProvider locale="es" messages={spanishMessages}>
        {ui}
      </NextIntlClientProvider>
    )
  }

  const mockUserGameStatistics = {
    user_id: 'user-1',
    tournament_id: 'test-tournament',
    group_score: 10,
    group_boost_bonus: 2,
    playoff_score: 8,
    playoff_boost_bonus: 3,
    total_correct_guesses: 15,
    total_exact_guesses: 5,
    // Extended tournament-level score fields
    qualified_teams_score: 5,
    group_position_score: 0,
    honor_roll_score: 3,
    individual_awards_score: 2,
  }

  it('renders the statistics card with title', () => {
    renderWithIntl(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
        tournamentId="test-tournament"
      />
    )

    expect(screen.getByText('Tus Estadísticas')).toBeInTheDocument()
  })

  it('shows "Estás aquí" subheader when isActive is true', () => {
    renderWithIntl(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
        tournamentId="test-tournament"
        isActive={true}
      />
    )

    expect(screen.getByText('Estás aquí')).toBeInTheDocument()
  })

  it('does not show "Estás aquí" subheader when isActive is false', () => {
    renderWithIntl(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
        tournamentId="test-tournament"
        isActive={false}
      />
    )

    expect(screen.queryByText('Estás aquí')).not.toBeInTheDocument()
  })

  it('applies active state styling when isActive is true', () => {
    const { container } = renderWithIntl(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
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
    renderWithIntl(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
        tournamentId="test-tournament"
      />
    )

    const button = screen.getByRole('link', { name: /Ver página de estadísticas detalladas/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', '/es/tournaments/test-tournament/stats')

    const icon = button.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('does not render button when tournamentId is not provided', () => {
    renderWithIntl(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
      />
    )

    expect(screen.queryByRole('link', { name: /Ver Detalle/i })).not.toBeInTheDocument()
  })

  it('calculates correct total points from extended userGameStatistics fields', async () => {
    renderWithIntl(
      <UserTournamentStatistics
        userGameStatistics={mockUserGameStatistics}
        tournamentId="test-tournament"
      />
    )

    // Groups: 10 + 2 boost = 12
    // Playoffs: 8 + 3 boost = 11
    // Qualified: 5 + 0 = 5
    // Awards: 3 + 2 = 5
    // Total: 33 pts
    const expandButton = screen.getByLabelText('mostrar más')
    fireEvent.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText(/33 pts/i)).toBeInTheDocument()
    })
  })

  it('computes qualifiedTotal from userGameStatistics.qualified_teams_score and group_position_score', async () => {
    const statsWithQualified = { ...mockUserGameStatistics, qualified_teams_score: 7, group_position_score: 3 }
    renderWithIntl(
      <UserTournamentStatistics
        userGameStatistics={statsWithQualified}
        tournamentId="test-tournament"
      />
    )

    const expandButton = screen.getByLabelText('mostrar más')
    fireEvent.click(expandButton)

    await waitFor(() => {
      // qualifiedTotal = 7 + 3 = 10
      expect(screen.getByText(/10 pts/i)).toBeInTheDocument()
    })
  })

  it('computes awardsTotal from userGameStatistics.honor_roll_score and individual_awards_score', async () => {
    const statsWithAwards = { ...mockUserGameStatistics, honor_roll_score: 6, individual_awards_score: 4, qualified_teams_score: 0, group_position_score: 0 }
    renderWithIntl(
      <UserTournamentStatistics
        userGameStatistics={statsWithAwards}
        tournamentId="test-tournament"
      />
    )

    const expandButton = screen.getByLabelText('mostrar más')
    fireEvent.click(expandButton)

    await waitFor(() => {
      // awardsTotal = 6 + 4 = 10
      expect(screen.getByText(/10 pts/i)).toBeInTheDocument()
    })
  })

  it('shows grandTotal as 0 when userGameStatistics is undefined', async () => {
    renderWithIntl(
      <UserTournamentStatistics
        tournamentId="test-tournament"
      />
    )

    const expandButton = screen.getByLabelText('mostrar más')
    fireEvent.click(expandButton)

    await waitFor(() => {
      const zeroPts = screen.getAllByText(/0 pts/i)
      expect(zeroPts.length).toBe(5) // Groups, Playoffs, Qualified, Awards, Total
    })
  })

  it('handles missing data gracefully', () => {
    renderWithIntl(
      <UserTournamentStatistics
        tournamentId="test-tournament"
      />
    )

    expect(screen.getByText('Tus Estadísticas')).toBeInTheDocument()
  })
})
