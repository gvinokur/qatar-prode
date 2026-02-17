import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Rules from './rules'
import { renderWithTheme } from '@/__tests__/utils/test-utils'

describe('Rules', () => {
  const mockScoringConfig = {
    game_exact_score_points: 2,
    game_correct_outcome_points: 1,
    champion_points: 5,
    runner_up_points: 3,
    third_place_points: 1,
    individual_award_points: 3,
    qualified_team_points: 1,
    exact_position_qualified_points: 2,
    max_silver_games: 5,
    max_golden_games: 3,
  }

  it('renders the rules card with title', () => {
    renderWithTheme(<Rules scoringConfig={mockScoringConfig} />)

    expect(screen.getByText('Reglas Generales')).toBeInTheDocument()
  })

  it('shows "Estás aquí" subheader when isActive is true', () => {
    renderWithTheme(<Rules scoringConfig={mockScoringConfig} isActive={true} />)

    expect(screen.getByText('Estás aquí')).toBeInTheDocument()
  })

  it('does not show "Estás aquí" subheader when isActive is false', () => {
    renderWithTheme(<Rules scoringConfig={mockScoringConfig} isActive={false} />)

    expect(screen.queryByText('Estás aquí')).not.toBeInTheDocument()
  })

  it('applies active state styling when isActive is true', () => {
    const { container } = renderWithTheme(<Rules scoringConfig={mockScoringConfig} isActive={true} />)

    const card = container.querySelector('.MuiCard-root')
    // MUI sx={{ borderLeft: 3 }} renders as border-left-width
    expect(card).toHaveStyle({
      'border-left-width': '3px',
    })
  })

  it('renders "Ver Reglas Completas" button with Gavel icon when not fullpage', () => {
    renderWithTheme(<Rules scoringConfig={mockScoringConfig} tournamentId="test-tournament" fullpage={false} />)

    const button = screen.getByRole('link', { name: /Ver Reglas Completas/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', '/es/tournaments/test-tournament/rules')

    // Check icon is present (MUI renders icon as svg)
    const icon = button.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('does not render button when fullpage is true', () => {
    renderWithTheme(<Rules scoringConfig={mockScoringConfig} fullpage={true} />)

    expect(screen.queryByRole('link', { name: /Ver Reglas Completas/i })).not.toBeInTheDocument()
  })

  it('is expanded by default', () => {
    renderWithTheme(<Rules scoringConfig={mockScoringConfig} />)

    // Should show content when expanded
    expect(screen.getByText(/Calculo de puntos/i)).toBeInTheDocument()
  })

  it('can be collapsed when not fullpage', () => {
    renderWithTheme(<Rules scoringConfig={mockScoringConfig} expanded={false} fullpage={false} />)

    // Content should not be visible when collapsed
    expect(screen.queryByText(/Calculo de puntos/i)).not.toBeInTheDocument()
  })

  it('shows boost rules when boosts are configured', () => {
    renderWithTheme(<Rules scoringConfig={mockScoringConfig} expanded={true} />)

    expect(screen.getByText(/Boost Plateado/i)).toBeInTheDocument()
    expect(screen.getByText(/Boost Dorado/i)).toBeInTheDocument()
  })

  it('does not show boost rules when boosts are not configured', () => {
    const configWithoutBoosts = {
      ...mockScoringConfig,
      max_silver_games: 0,
      max_golden_games: 0,
    }
    renderWithTheme(<Rules scoringConfig={configWithoutBoosts} expanded={true} />)

    expect(screen.queryByText(/Boost Plateado/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Boost Dorado/i)).not.toBeInTheDocument()
  })
})
