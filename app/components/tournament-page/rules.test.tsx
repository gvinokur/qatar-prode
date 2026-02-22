import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Rules from './rules'
import { renderWithProviders } from '@/__tests__/utils/test-utils'

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
    renderWithProviders(<Rules scoringConfig={mockScoringConfig} />)

    expect(screen.getByText('Reglas Generales')).toBeInTheDocument()
  })

  it('shows "Estás aquí" subheader when isActive is true', () => {
    renderWithProviders(<Rules scoringConfig={mockScoringConfig} isActive={true} />)

    expect(screen.getByText('Estás aquí')).toBeInTheDocument()
  })

  it('does not show "Estás aquí" subheader when isActive is false', () => {
    renderWithProviders(<Rules scoringConfig={mockScoringConfig} isActive={false} />)

    expect(screen.queryByText('Estás aquí')).not.toBeInTheDocument()
  })

  it('applies active state styling when isActive is true', () => {
    const { container } = renderWithProviders(<Rules scoringConfig={mockScoringConfig} isActive={true} />)

    const card = container.querySelector('.MuiCard-root')
    // MUI sx={{ borderLeft: 3 }} renders as border-left-width
    expect(card).toHaveStyle({
      'border-left-width': '3px',
    })
  })

  it('renders "Ver Reglas Completas" button with Gavel icon when not fullpage', () => {
    renderWithProviders(<Rules scoringConfig={mockScoringConfig} tournamentId="test-tournament" fullpage={false} />)

    const button = screen.getByRole('link', { name: /Ver Reglas Completas/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', '/es/tournaments/test-tournament/rules')

    // Check icon is present (MUI renders icon as svg)
    const icon = button.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('does not render button when fullpage is true', () => {
    renderWithProviders(<Rules scoringConfig={mockScoringConfig} fullpage={true} />)

    expect(screen.queryByRole('link', { name: /Ver Reglas Completas/i })).not.toBeInTheDocument()
  })

  it('is expanded by default', () => {
    renderWithProviders(<Rules scoringConfig={mockScoringConfig} />)

    // Should show content when expanded
    expect(screen.getByText(/Calculo de puntos/i)).toBeInTheDocument()
  })

  it('can be collapsed when not fullpage', () => {
    renderWithProviders(<Rules scoringConfig={mockScoringConfig} expanded={false} fullpage={false} />)

    // Content should not be visible when collapsed
    expect(screen.queryByText(/Calculo de puntos/i)).not.toBeInTheDocument()
  })

  it('shows boost rules when boosts are configured', () => {
    renderWithProviders(<Rules scoringConfig={mockScoringConfig} expanded={true} />)

    expect(screen.getByText(/Boost Plateado/i)).toBeInTheDocument()
    expect(screen.getByText(/Boost Dorado/i)).toBeInTheDocument()
  })

  it('does not show boost rules when boosts are not configured', () => {
    const configWithoutBoosts = {
      ...mockScoringConfig,
      max_silver_games: 0,
      max_golden_games: 0,
    }
    renderWithProviders(<Rules scoringConfig={configWithoutBoosts} expanded={true} />)

    expect(screen.queryByText(/Boost Plateado/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Boost Dorado/i)).not.toBeInTheDocument()
  })

  // Pluralization tests
  describe('Pluralization', () => {
    it('uses singular form for 1 point rules', () => {
      const configWithSingular = {
        ...mockScoringConfig,
        game_correct_outcome_points: 1,
        champion_points: 1,
      }
      renderWithProviders(<Rules scoringConfig={configWithSingular} expanded={true} />)

      expect(screen.getByText(/1 Punto por Ganador\/Empate acertado/i)).toBeInTheDocument()
      expect(screen.getByText(/1 Punto por campeon/i)).toBeInTheDocument()
    })

    it('uses plural form for 2+ points rules', () => {
      const configWithPlural = {
        ...mockScoringConfig,
        game_correct_outcome_points: 3,
        champion_points: 5,
      }
      renderWithProviders(<Rules scoringConfig={configWithPlural} expanded={true} />)

      expect(screen.getByText(/3 Puntos por Ganador\/Empate acertado/i)).toBeInTheDocument()
      expect(screen.getByText(/5 Puntos por campeon/i)).toBeInTheDocument()
    })

    it('uses singular form for 1 boost game', () => {
      const configWithSingularBoost = {
        ...mockScoringConfig,
        max_silver_games: 1,
        max_golden_games: 1,
      }
      renderWithProviders(<Rules scoringConfig={configWithSingularBoost} expanded={true} />)

      expect(screen.getByText(/Boost Plateado: Puedes seleccionar hasta 1 partido que valdrá el doble/i)).toBeInTheDocument()
      expect(screen.getByText(/Boost Dorado: Puedes seleccionar hasta 1 partido que valdrá el triple/i)).toBeInTheDocument()
    })

    it('uses plural form for multiple boost games', () => {
      renderWithProviders(<Rules scoringConfig={mockScoringConfig} expanded={true} />)

      expect(screen.getByText(/hasta 5 partidos que valdrán/i)).toBeInTheDocument()
      expect(screen.getByText(/hasta 3 partidos que valdrán/i)).toBeInTheDocument()
    })
  })

  // English translation tests
  describe('English translations', () => {
    it('renders English title', () => {
      renderWithProviders(<Rules scoringConfig={mockScoringConfig} />, { locale: 'en' })

      expect(screen.getByText('General Rules')).toBeInTheDocument()
    })

    it('renders English subheader when isActive', () => {
      renderWithProviders(<Rules scoringConfig={mockScoringConfig} isActive={true} />, { locale: 'en' })

      expect(screen.getByText('You are here')).toBeInTheDocument()
    })

    it('renders English section titles', () => {
      renderWithProviders(<Rules scoringConfig={mockScoringConfig} expanded={true} />, { locale: 'en' })

      expect(screen.getByText('Points Calculation')).toBeInTheDocument()
      expect(screen.getByText('General Conditions')).toBeInTheDocument()
    })

    it('renders English button text', () => {
      renderWithProviders(<Rules scoringConfig={mockScoringConfig} tournamentId="test" fullpage={false} />, { locale: 'en' })

      expect(screen.getByRole('link', { name: /View Full Rules/i })).toBeInTheDocument()
    })
  })

  // Parameterized examples tests
  describe('Parameterized Examples', () => {
    it('renders example with correct point values from config', () => {
      const customConfig = {
        ...mockScoringConfig,
        champion_points: 10,
        runner_up_points: 7,
        individual_award_points: 4,
      }
      renderWithProviders(<Rules scoringConfig={customConfig} expanded={true} fullpage={true} />)

      // Examples should display the dynamic point values
      expect(screen.getByText(/10 puntos/i)).toBeInTheDocument()
      expect(screen.getByText(/7 puntos/i)).toBeInTheDocument()
      expect(screen.getByText(/4 puntos/i)).toBeInTheDocument()
    })

    it('renders examples with singular form when points is 1', () => {
      const configWithSingularPoints = {
        ...mockScoringConfig,
        champion_points: 1,
        third_place_points: 1,
        individual_award_points: 1,
      }
      renderWithProviders(<Rules scoringConfig={configWithSingularPoints} expanded={true} fullpage={false} />)

      // Check that rule labels use singular form "Punto" (not "Puntos")
      expect(screen.getByText(/1 Punto por campeon/i)).toBeInTheDocument()
      expect(screen.getByText(/1 Punto por tercer puesto/i)).toBeInTheDocument()
      expect(screen.getByText(/1 Punto por cada premio acertado/i)).toBeInTheDocument()
    })

    it('renders examples with plural form when points is greater than 1', () => {
      const configWithPluralPoints = {
        ...mockScoringConfig,
        champion_points: 8,
        runner_up_points: 6,
      }
      renderWithProviders(<Rules scoringConfig={configWithPluralPoints} expanded={true} fullpage={true} />)

      // Should use "puntos" (plural)
      expect(screen.getByText(/8 puntos/i)).toBeInTheDocument()
      expect(screen.getByText(/6 puntos/i)).toBeInTheDocument()
    })

    it('renders exact score example with correct bonus calculation', () => {
      const customConfig = {
        ...mockScoringConfig,
        game_exact_score_points: 5,
        game_correct_outcome_points: 2,
      }
      renderWithProviders(<Rules scoringConfig={customConfig} expanded={true} fullpage={false} />)

      // Bonus should be 5 - 2 = 3, total should be 5
      // Check the label shows correct values
      expect(screen.getByText(/3 puntos extra por resultado exacto.*total: 5 puntos/i)).toBeInTheDocument()
    })

    it('renders group position example with correct total points', () => {
      const customConfig = {
        ...mockScoringConfig,
        qualified_team_points: 2,
        exact_position_qualified_points: 3,
      }
      renderWithProviders(<Rules scoringConfig={customConfig} expanded={true} fullpage={false} />)

      // Total should be 2 + 3 = 5
      // Check the label shows correct total
      expect(screen.getByText(/3 Puntos adicionales por posición exacta.*total: 5 puntos por equipo clasificado en posición exacta/i)).toBeInTheDocument()
    })
  })

  // Qualified teams constraint tests
  describe('Qualified Teams Constraint', () => {
    it('renders qualified teams prediction time constraint', () => {
      renderWithProviders(<Rules scoringConfig={mockScoringConfig} expanded={true} />)

      expect(screen.getByText(/Se permite modificar pronosticos de equipos clasificados/i)).toBeInTheDocument()
    })

    it('renders qualified teams constraint in English', () => {
      renderWithProviders(<Rules scoringConfig={mockScoringConfig} expanded={true} />, { locale: 'en' })

      expect(screen.getByText(/You can modify qualified teams predictions up to 2 days after the tournament starts/i)).toBeInTheDocument()
    })
  })
})
