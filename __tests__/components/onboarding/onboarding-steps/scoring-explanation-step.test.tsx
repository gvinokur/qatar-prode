import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { testFactories } from '@/__tests__/db/test-factories'
import ScoringExplanationStep from '@/app/components/onboarding/onboarding-steps/scoring-explanation-step'

const DEFAULT_SCORING = {
  game_exact_score_points: 2,
  game_correct_outcome_points: 1,
  champion_points: 5,
  runner_up_points: 3,
  third_place_points: 1,
  individual_award_points: 3,
  qualified_team_points: 1,
  exact_position_qualified_points: 2,
}

describe('ScoringExplanationStep', () => {
  describe('Basic Rendering', () => {
    it('renders component with tournament prop', () => {
      const tournament = testFactories.tournament({
        id: 'euro-2024',
        short_name: 'EURO',
        long_name: 'UEFA Euro 2024',
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('¿Cómo se Calcula el Puntaje?')).toBeInTheDocument()
      expect(screen.getByText('Gana puntos por predicciones correctas en partidos y torneo')).toBeInTheDocument()
    })

    it('renders component without tournament prop', () => {
      renderWithTheme(<ScoringExplanationStep />)

      expect(screen.getByText('¿Cómo se Calcula el Puntaje?')).toBeInTheDocument()
      expect(screen.getByText('Gana puntos por predicciones correctas en partidos y torneo')).toBeInTheDocument()
    })
  })

  describe('Tournament-Specific Scoring Values', () => {
    it('displays custom tournament scoring values', () => {
      const tournament = testFactories.tournament({
        id: 'world-cup',
        short_name: 'WC',
        long_name: 'FIFA World Cup',
        game_exact_score_points: 15,
        game_correct_outcome_points: 7,
        champion_points: 20,
        runner_up_points: 12,
        third_place_points: 8,
        individual_award_points: 10,
        qualified_team_points: 5,
        exact_position_qualified_points: 8,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // Game scoring
      expect(screen.getByText('15 pts')).toBeInTheDocument() // gameExact
      expect(screen.getByText('7 pts')).toBeInTheDocument() // gameOutcome

      // Tournament scoring
      expect(screen.getByText('20 pts')).toBeInTheDocument() // champion
      expect(screen.getByText('12 pts')).toBeInTheDocument() // runnerUp
      expect(screen.getByText('8 pts')).toBeInTheDocument() // thirdPlace

      // Individual awards
      expect(screen.getByText('10 pts')).toBeInTheDocument() // individualAward
      expect(screen.getByText(/Total posible: 40 pts \(4 premios × 10 pts\)/)).toBeInTheDocument()

      // Qualified teams
      const exactPositionTotal = 5 + 8 // qualifiedTeam + exactPosition
      expect(screen.getByText('13 pts')).toBeInTheDocument() // exactPositionTotal
      expect(screen.getByText('5 pts')).toBeInTheDocument() // qualifiedTeam (outlined chip)
    })
  })

  describe('Default Values Fallback', () => {
    it('uses default values when tournament is undefined', () => {
      renderWithTheme(<ScoringExplanationStep />)

      // Game scoring
      expect(screen.getByText('2 pts')).toBeInTheDocument() // gameExact (default)
      const onePtElements = screen.getAllByText('1 pt')
      expect(onePtElements.length).toBeGreaterThanOrEqual(3) // gameOutcome, thirdPlace, qualifiedTeam (all singular)

      // Tournament scoring
      expect(screen.getByText('5 pts')).toBeInTheDocument() // champion (default)
      const threePtsElements = screen.getAllByText('3 pts')
      expect(threePtsElements.length).toBeGreaterThanOrEqual(2) // runnerUp and individualAward

      // Individual awards
      expect(screen.getByText(/Total posible: 12 pts \(4 premios × 3 pts\)/)).toBeInTheDocument()

      // Qualified teams
      const exactPositionTotal = DEFAULT_SCORING.qualified_team_points + DEFAULT_SCORING.exact_position_qualified_points
      // exactPositionTotal is 3, which also appears for runnerUp and individualAward
      const allThreePts = screen.getAllByText(`${exactPositionTotal} pts`)
      expect(allThreePts.length).toBeGreaterThanOrEqual(3)
    })

    it('uses default values when tournament scoring fields are null', () => {
      const tournament = testFactories.tournament({
        id: 'test-tournament',
        short_name: 'TEST',
        long_name: 'Test Tournament',
        game_exact_score_points: null as any,
        game_correct_outcome_points: null as any,
        champion_points: null as any,
        runner_up_points: null as any,
        third_place_points: null as any,
        individual_award_points: null as any,
        qualified_team_points: null as any,
        exact_position_qualified_points: null as any,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // Should fall back to defaults
      expect(screen.getByText('2 pts')).toBeInTheDocument() // gameExact
      const onePtElements = screen.getAllByText('1 pt')
      expect(onePtElements.length).toBeGreaterThanOrEqual(3) // gameOutcome, thirdPlace, qualifiedTeam
      expect(screen.getByText('5 pts')).toBeInTheDocument() // champion
      const threePtsElements = screen.getAllByText('3 pts')
      expect(threePtsElements.length).toBeGreaterThanOrEqual(2) // runnerUp and individualAward

      // Individual awards
      expect(screen.getByText(/Total posible: 12 pts \(4 premios × 3 pts\)/)).toBeInTheDocument()

      // Qualified teams
      const exactPositionTotal = DEFAULT_SCORING.qualified_team_points + DEFAULT_SCORING.exact_position_qualified_points
      // exactPositionTotal is 3, which also appears for runnerUp and individualAward
      const allThreePts = screen.getAllByText(`${exactPositionTotal} pts`)
      expect(allThreePts.length).toBeGreaterThanOrEqual(3)
    })

    it('uses default values when tournament scoring fields are undefined', () => {
      const tournament = testFactories.tournament({
        id: 'test-tournament',
        short_name: 'TEST',
        long_name: 'Test Tournament',
        game_exact_score_points: undefined as any,
        game_correct_outcome_points: undefined as any,
        champion_points: undefined as any,
        runner_up_points: undefined as any,
        third_place_points: undefined as any,
        individual_award_points: undefined as any,
        qualified_team_points: undefined as any,
        exact_position_qualified_points: undefined as any,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // Should fall back to defaults
      expect(screen.getByText('2 pts')).toBeInTheDocument() // gameExact
      const onePtElements = screen.getAllByText('1 pt')
      expect(onePtElements.length).toBeGreaterThanOrEqual(3) // gameOutcome, thirdPlace, qualifiedTeam
      expect(screen.getByText('5 pts')).toBeInTheDocument() // champion
      const threePtsElements = screen.getAllByText('3 pts')
      expect(threePtsElements.length).toBeGreaterThanOrEqual(2) // runnerUp and individualAward

      // Individual awards
      expect(screen.getByText(/Total posible: 12 pts \(4 premios × 3 pts\)/)).toBeInTheDocument()

      // Qualified teams
      const exactPositionTotal = DEFAULT_SCORING.qualified_team_points + DEFAULT_SCORING.exact_position_qualified_points
      // exactPositionTotal is 3, which also appears for runnerUp and individualAward
      const allThreePts = screen.getAllByText(`${exactPositionTotal} pts`)
      expect(allThreePts.length).toBeGreaterThanOrEqual(3)
    })

    it('uses defaults for null fields while respecting non-null fields', () => {
      const tournament = testFactories.tournament({
        id: 'mixed-tournament',
        short_name: 'MIXED',
        long_name: 'Mixed Tournament',
        game_exact_score_points: 20, // Custom
        game_correct_outcome_points: null as any, // Should use default (1)
        champion_points: 25, // Custom
        runner_up_points: null as any, // Should use default (3)
        third_place_points: 10, // Custom
        individual_award_points: null as any, // Should use default (3)
        qualified_team_points: 7, // Custom
        exact_position_qualified_points: null as any, // Should use default (2)
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // Custom values
      expect(screen.getByText('20 pts')).toBeInTheDocument() // gameExact (custom)
      expect(screen.getByText('25 pts')).toBeInTheDocument() // champion (custom)
      expect(screen.getByText('10 pts')).toBeInTheDocument() // thirdPlace (custom)
      expect(screen.getByText('7 pts')).toBeInTheDocument() // qualifiedTeam (custom)

      // Default fallbacks
      const onePtElements = screen.getAllByText('1 pt')
      expect(onePtElements.length).toBeGreaterThanOrEqual(1) // gameOutcome (default)
      const threePtsElements = screen.getAllByText('3 pts')
      expect(threePtsElements.length).toBeGreaterThanOrEqual(2) // runnerUp (default) and individualAward (default)

      // Exact position total: custom (7) + default (2) = 9
      expect(screen.getByText('9 pts')).toBeInTheDocument()

      // Individual awards total: default (3) × 4 = 12
      expect(screen.getByText(/Total posible: 12 pts \(4 premios × 3 pts\)/)).toBeInTheDocument()
    })
  })

  describe('Tournament Name Display', () => {
    it('shows tournament name in alert when long_name is available', () => {
      const tournament = testFactories.tournament({
        id: 'euro-2024',
        short_name: 'EURO',
        long_name: 'UEFA Euro 2024',
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('Configuración de UEFA Euro 2024')).toBeInTheDocument()
      expect(screen.getByText('Estos son los valores de puntaje para este torneo específico.')).toBeInTheDocument()
    })

    it('shows short_name in alert when long_name is null', () => {
      const tournament = testFactories.tournament({
        id: 'test-tournament',
        short_name: 'TEST',
        long_name: null as any,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('Configuración de TEST')).toBeInTheDocument()
    })

    it('shows short_name in alert when long_name is empty string', () => {
      const tournament = testFactories.tournament({
        id: 'test-tournament',
        short_name: 'WC',
        long_name: '',
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('Configuración de WC')).toBeInTheDocument()
    })

    it('shows generic message when tournament is undefined', () => {
      renderWithTheme(<ScoringExplanationStep />)

      expect(screen.getByText('Importante')).toBeInTheDocument()
      expect(screen.getByText('Los valores de puntaje pueden variar según el torneo. Los valores mostrados son típicos.')).toBeInTheDocument()
    })
  })

  describe('Exact Position Total Calculation', () => {
    it('calculates exact position total correctly (qualifiedTeam + exactPosition)', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 4,
        exact_position_qualified_points: 3,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      const expectedTotal = 4 + 3 // 7
      expect(screen.getByText('7 pts')).toBeInTheDocument()
    })

    it('calculates with default values correctly', () => {
      renderWithTheme(<ScoringExplanationStep />)

      const expectedTotal = DEFAULT_SCORING.qualified_team_points + DEFAULT_SCORING.exact_position_qualified_points // 1 + 2 = 3
      // "3 pts" appears multiple times (runnerUp, individualAward, exactPositionTotal)
      const threePtsElements = screen.getAllByText(`${expectedTotal} pts`)
      expect(threePtsElements.length).toBeGreaterThanOrEqual(3)
    })

    it('calculates with large values correctly', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 100,
        exact_position_qualified_points: 50,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('150 pts')).toBeInTheDocument()
    })
  })

  describe('Scoring Categories Display', () => {
    it('displays game exact score category', () => {
      const tournament = testFactories.tournament({
        game_exact_score_points: 10,
        runner_up_points: 11, // Change to avoid collision with default runner_up (10 in factory)
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('Partidos')).toBeInTheDocument()
      expect(screen.getByText('Resultado exacto')).toBeInTheDocument()
      expect(screen.getByText('10 pts')).toBeInTheDocument()
    })

    it('displays game correct outcome category', () => {
      const tournament = testFactories.tournament({
        game_correct_outcome_points: 5,
        champion_points: 20, // Change to avoid collision with default champion (5)
        third_place_points: 6, // Change to avoid collision with default third_place (5 in factory)
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('Resultado correcto')).toBeInTheDocument()
      expect(screen.getByText('5 pts')).toBeInTheDocument()
    })

    it('displays champion points', () => {
      const tournament = testFactories.tournament({
        champion_points: 25,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('Torneo')).toBeInTheDocument()
      expect(screen.getByText('🥇 Campeón')).toBeInTheDocument()
      expect(screen.getByText('25 pts')).toBeInTheDocument()
    })

    it('displays runner-up points', () => {
      const tournament = testFactories.tournament({
        runner_up_points: 15,
        champion_points: 16, // Change to avoid collision
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('🥈 Subcampeón')).toBeInTheDocument()
      expect(screen.getByText('15 pts')).toBeInTheDocument()
    })

    it('displays third place points', () => {
      const tournament = testFactories.tournament({
        third_place_points: 8,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('🥉 Tercer lugar')).toBeInTheDocument()
      expect(screen.getByText('8 pts')).toBeInTheDocument()
    })

    it('displays individual award points', () => {
      const tournament = testFactories.tournament({
        individual_award_points: 12,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('Premios Individuales')).toBeInTheDocument()
      expect(screen.getByText('Por cada premio correcto')).toBeInTheDocument()
      expect(screen.getByText('12 pts')).toBeInTheDocument()
    })

    it('displays qualified team points', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 6,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('Clasificación')).toBeInTheDocument()
      expect(screen.getByText('Clasificado (posición incorrecta)')).toBeInTheDocument()
      expect(screen.getByText('6 pts')).toBeInTheDocument()
    })

    it('displays exact position qualified points in total', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 3,
        exact_position_qualified_points: 5,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('Posición exacta + clasificado')).toBeInTheDocument()
      expect(screen.getByText('8 pts')).toBeInTheDocument() // 3 + 5
    })
  })

  describe('Singular/Plural Text Handling', () => {
    it('displays singular "pt" for 1-point game outcome', () => {
      const tournament = testFactories.tournament({
        game_correct_outcome_points: 1,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // There will be multiple "1 pt" texts (outcome, possibly others)
      const onePtElements = screen.getAllByText('1 pt')
      expect(onePtElements.length).toBeGreaterThanOrEqual(1)
    })

    it('displays plural "pts" for multi-point game outcome', () => {
      const tournament = testFactories.tournament({
        game_correct_outcome_points: 5,
        champion_points: 20, // Change to avoid ambiguity with default champion (5)
        third_place_points: 6, // Change to avoid collision with factory default (5)
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('5 pts')).toBeInTheDocument()
    })

    it('displays singular "pt" for 1-point third place', () => {
      const tournament = testFactories.tournament({
        third_place_points: 1,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // Find the chip with "1 pt" in the third place row
      const thirdPlaceText = screen.getByText('🥉 Tercer lugar')
      expect(thirdPlaceText).toBeInTheDocument()
      // There will be multiple "1 pt" texts
      const onePtElements = screen.getAllByText(/1 pt/)
      expect(onePtElements.length).toBeGreaterThanOrEqual(1)
    })

    it('displays plural "pts" for multi-point third place', () => {
      const tournament = testFactories.tournament({
        third_place_points: 8,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('8 pts')).toBeInTheDocument()
    })

    it('displays singular "pt" for 1-point exact position total', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 0,
        exact_position_qualified_points: 1,
        third_place_points: 5, // Change to avoid ambiguity
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // Should have at least one "1 pt" for exact position total
      const onePtElements = screen.getAllByText('1 pt')
      expect(onePtElements.length).toBeGreaterThanOrEqual(1)
    })

    it('displays plural "pts" for multi-point exact position total', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 5,
        exact_position_qualified_points: 3,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('8 pts')).toBeInTheDocument()
    })

    it('displays singular "pt" for 1-point qualified team', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 1,
        third_place_points: 5, // Change to avoid ambiguity
        game_correct_outcome_points: 5, // Change to avoid ambiguity
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // Should have at least one "1 pt" for qualified team
      const onePtElements = screen.getAllByText('1 pt')
      expect(onePtElements.length).toBeGreaterThanOrEqual(1)
    })

    it('displays plural "pts" for multi-point qualified team', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 7,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('7 pts')).toBeInTheDocument()
    })
  })

  describe('Individual Awards Total Calculation', () => {
    it('shows correct total calculation (4 awards × points)', () => {
      const tournament = testFactories.tournament({
        individual_award_points: 5,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText(/Total posible: 20 pts \(4 premios × 5 pts\)/)).toBeInTheDocument()
    })

    it('calculates with default value correctly', () => {
      renderWithTheme(<ScoringExplanationStep />)

      const expectedTotal = DEFAULT_SCORING.individual_award_points * 4 // 3 × 4 = 12
      expect(screen.getByText(new RegExp(`Total posible: ${expectedTotal} pts \\(4 premios × ${DEFAULT_SCORING.individual_award_points} pts\\)`))).toBeInTheDocument()
    })

    it('displays all four individual award types', () => {
      renderWithTheme(<ScoringExplanationStep />)

      expect(screen.getByText('Mejor Jugador')).toBeInTheDocument()
      expect(screen.getByText('Goleador')).toBeInTheDocument()
      expect(screen.getByText('Mejor Arquero')).toBeInTheDocument()
      expect(screen.getByText('Jugador Joven')).toBeInTheDocument()
    })

    it('calculates with large values correctly', () => {
      const tournament = testFactories.tournament({
        individual_award_points: 25,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText(/Total posible: 100 pts \(4 premios × 25 pts\)/)).toBeInTheDocument()
    })
  })

  describe('UI Sections Rendering', () => {
    it('renders all four main sections', () => {
      renderWithTheme(<ScoringExplanationStep />)

      expect(screen.getByText('Partidos')).toBeInTheDocument() // Game section
      expect(screen.getByText('Torneo')).toBeInTheDocument() // Tournament section
      expect(screen.getByText('Premios Individuales')).toBeInTheDocument() // Individual Awards section
      expect(screen.getByText('Clasificación')).toBeInTheDocument() // Qualifiers section
    })

    it('renders alert section with info', () => {
      const tournament = testFactories.tournament({
        long_name: 'Test Tournament',
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('Configuración de Test Tournament')).toBeInTheDocument()
      expect(screen.getByText('Estos son los valores de puntaje para este torneo específico.')).toBeInTheDocument()
    })
  })

  describe('Default Scoring Constant Verification', () => {
    it('uses correct default values matching DEFAULT_SCORING constant', () => {
      renderWithTheme(<ScoringExplanationStep />)

      // Verify game scoring defaults
      expect(screen.getByText(`${DEFAULT_SCORING.game_exact_score_points} pts`)).toBeInTheDocument()
      const onePtElements = screen.getAllByText(`${DEFAULT_SCORING.game_correct_outcome_points} pt`)
      expect(onePtElements.length).toBeGreaterThanOrEqual(1)

      // Verify tournament scoring defaults
      expect(screen.getByText(`${DEFAULT_SCORING.champion_points} pts`)).toBeInTheDocument()
      const threePtsElements = screen.getAllByText(`${DEFAULT_SCORING.runner_up_points} pts`)
      expect(threePtsElements.length).toBeGreaterThanOrEqual(2) // runnerUp and individualAward and exactPositionTotal

      // Verify individual awards default
      const individualAwardsTotal = DEFAULT_SCORING.individual_award_points * 4
      expect(screen.getByText(new RegExp(`Total posible: ${individualAwardsTotal} pts`))).toBeInTheDocument()

      // Verify qualified teams defaults
      const exactPositionTotal = DEFAULT_SCORING.qualified_team_points + DEFAULT_SCORING.exact_position_qualified_points
      // exactPositionTotal is 3, which also appears for runnerUp and individualAward
      const allThreePts = screen.getAllByText(`${exactPositionTotal} pts`)
      expect(allThreePts.length).toBeGreaterThanOrEqual(3)
      // qualifiedTeam is also "1 pt"
      expect(onePtElements.length).toBeGreaterThanOrEqual(3)
    })
  })
})
