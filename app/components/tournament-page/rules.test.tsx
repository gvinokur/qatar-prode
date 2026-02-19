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
    it('renders English title with EnOf pattern', () => {
      renderWithProviders(<Rules scoringConfig={mockScoringConfig} />, { locale: 'en' })

      expect(screen.getByText('EnOf(Reglas Generales)')).toBeInTheDocument()
    })

    it('renders English subheader when isActive', () => {
      renderWithProviders(<Rules scoringConfig={mockScoringConfig} isActive={true} />, { locale: 'en' })

      expect(screen.getByText('EnOf(Estás aquí)')).toBeInTheDocument()
    })

    it('renders English section titles', () => {
      renderWithProviders(<Rules scoringConfig={mockScoringConfig} expanded={true} />, { locale: 'en' })

      expect(screen.getByText('EnOf(Calculo de puntos)')).toBeInTheDocument()
      expect(screen.getByText('EnOf(Condiciones generales)')).toBeInTheDocument()
    })

    it('renders English button text', () => {
      renderWithProviders(<Rules scoringConfig={mockScoringConfig} tournamentId="test" fullpage={false} />, { locale: 'en' })

      expect(screen.getByRole('link', { name: /EnOf\(Ver Reglas Completas\)/i })).toBeInTheDocument()
    })
  })
})
