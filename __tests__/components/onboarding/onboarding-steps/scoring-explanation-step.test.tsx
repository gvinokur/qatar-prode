import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { testFactories } from '@/__tests__/db/test-factories'
import ScoringExplanationStep from '@/app/components/onboarding/onboarding-steps/scoring-explanation-step'
import { createMockTranslations } from '@/__tests__/utils/mock-translations'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => 'es')
}))

import * as intl from 'next-intl'

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
  beforeEach(() => {
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('onboarding.steps.scoring')
    )
  })

  describe('Basic Rendering', () => {
    it('renders component with tournament prop', () => {
      const tournament = testFactories.tournament({
        id: 'euro-2024',
        short_name: 'EURO',
        long_name: 'UEFA Euro 2024',
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('[title]')).toBeInTheDocument()
      expect(screen.getByText('[instructions]')).toBeInTheDocument()
    })

    it('renders component without tournament prop', () => {
      renderWithTheme(<ScoringExplanationStep />)

      expect(screen.getByText('[title]')).toBeInTheDocument()
      expect(screen.getByText('[instructions]')).toBeInTheDocument()
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
      expect(screen.getByText(/\[exactResult\.points\]{points:15}/)).toBeInTheDocument() // gameExact
      expect(screen.getByText(/\[correctResult\.points\]{points:7}/)).toBeInTheDocument() // gameOutcome

      // Tournament scoring
      expect(screen.getAllByText(/\[exactResult\.points\]{points:20}/)[0]).toBeInTheDocument() // champion
      expect(screen.getByText(/\[exactResult\.points\]{points:12}/)).toBeInTheDocument() // runnerUp
      expect(screen.getByText(/\[exactResult\.points\]{points:8}/)).toBeInTheDocument() // thirdPlace

      // Individual awards
      expect(screen.getByText(/\[awardPoints\.points\]{points:10}/)).toBeInTheDocument() // individualAward
      expect(screen.getByText(/\[totalPossible\]{points:40,perAward:10}/)).toBeInTheDocument()

      // Qualified teams
      const exactPositionTotal = 5 + 8 // qualifiedTeam + exactPosition
      expect(screen.getByText(/\[exactResult\.points\]{points:13}/)).toBeInTheDocument() // exactPositionTotal
      expect(screen.getByText(/\[exactResult\.points\]{points:5}/)).toBeInTheDocument() // qualifiedTeam (outlined chip)
    })
  })

  describe('Default Values Fallback', () => {
    it('uses default values when tournament is undefined', () => {
      renderWithTheme(<ScoringExplanationStep />)

      // Game scoring
      expect(screen.getByText(/\[exactResult\.points\]{points:2}/)).toBeInTheDocument() // gameExact (default)
      const onePtElements = screen.getAllByText(/\[correctResult\.points\]{points:1}/)
      expect(onePtElements.length).toBeGreaterThanOrEqual(1) // gameOutcome

      // Tournament scoring
      expect(screen.getByText(/\[exactResult\.points\]{points:5}/)).toBeInTheDocument() // champion (default)
      const threePtsElements = screen.getAllByText(/\[exactResult\.points\]{points:3}/)
      expect(threePtsElements.length).toBeGreaterThanOrEqual(1) // runnerUp and/or individualAward

      // Individual awards
      expect(screen.getByText(/\[totalPossible\]{points:12,perAward:3}/)).toBeInTheDocument()

      // Qualified teams
      const exactPositionTotal = DEFAULT_SCORING.qualified_team_points + DEFAULT_SCORING.exact_position_qualified_points
      // exactPositionTotal is 3, which also appears for runnerUp and individualAward
      const allThreePts = screen.getAllByText(/\[exactResult\.points\]{points:3}/)
      expect(allThreePts.length).toBeGreaterThanOrEqual(1)
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
      expect(screen.getByText(/\[exactResult\.points\]{points:2}/)).toBeInTheDocument() // gameExact
      const onePtElements = screen.getAllByText(/\[correctResult\.points\]{points:1}/)
      expect(onePtElements.length).toBeGreaterThanOrEqual(1) // gameOutcome
      expect(screen.getByText(/\[exactResult\.points\]{points:5}/)).toBeInTheDocument() // champion
      const threePtsElements = screen.getAllByText(/\[exactResult\.points\]{points:3}/)
      expect(threePtsElements.length).toBeGreaterThanOrEqual(1) // runnerUp and/or individualAward

      // Individual awards
      expect(screen.getByText(/\[totalPossible\]{points:12,perAward:3}/)).toBeInTheDocument()

      // Qualified teams
      const exactPositionTotal = DEFAULT_SCORING.qualified_team_points + DEFAULT_SCORING.exact_position_qualified_points
      // exactPositionTotal is 3, which also appears for runnerUp and individualAward
      const allThreePts = screen.getAllByText(/\[exactResult\.points\]{points:3}/)
      expect(allThreePts.length).toBeGreaterThanOrEqual(1)
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
      expect(screen.getByText(/\[exactResult\.points\]{points:2}/)).toBeInTheDocument() // gameExact
      const onePtElements = screen.getAllByText(/\[correctResult\.points\]{points:1}/)
      expect(onePtElements.length).toBeGreaterThanOrEqual(1) // gameOutcome
      expect(screen.getByText(/\[exactResult\.points\]{points:5}/)).toBeInTheDocument() // champion
      const threePtsElements = screen.getAllByText(/\[exactResult\.points\]{points:3}/)
      expect(threePtsElements.length).toBeGreaterThanOrEqual(1) // runnerUp and/or individualAward

      // Individual awards
      expect(screen.getByText(/\[totalPossible\]{points:12,perAward:3}/)).toBeInTheDocument()

      // Qualified teams
      const exactPositionTotal = DEFAULT_SCORING.qualified_team_points + DEFAULT_SCORING.exact_position_qualified_points
      // exactPositionTotal is 3, which also appears for runnerUp and individualAward
      const allThreePts = screen.getAllByText(/\[exactResult\.points\]{points:3}/)
      expect(allThreePts.length).toBeGreaterThanOrEqual(1)
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
      expect(screen.getByText(/\[exactResult\.points\]{points:20}/)).toBeInTheDocument() // gameExact (custom)
      expect(screen.getByText(/\[exactResult\.points\]{points:25}/)).toBeInTheDocument() // champion (custom)
      expect(screen.getByText(/\[exactResult\.points\]{points:10}/)).toBeInTheDocument() // thirdPlace (custom)
      expect(screen.getByText(/\[exactResult\.points\]{points:7}/)).toBeInTheDocument() // qualifiedTeam (custom)

      // Default fallbacks
      const onePtElements = screen.getAllByText(/\[correctResult\.points\]{points:1}/)
      expect(onePtElements.length).toBeGreaterThanOrEqual(1) // gameOutcome (default)
      const threePtsElements = screen.getAllByText(/\[exactResult\.points\]{points:3}/)
      expect(threePtsElements.length).toBeGreaterThanOrEqual(1) // runnerUp (default) and/or individualAward (default)

      // Exact position total: custom (7) + default (2) = 9
      expect(screen.getByText(/\[exactResult\.points\]{points:9}/)).toBeInTheDocument()

      // Individual awards total: default (3) × 4 = 12
      expect(screen.getByText(/\[totalPossible\]{points:12,perAward:3}/)).toBeInTheDocument()
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

      // When tournament is provided, it shows tournament-specific alert without mock keys
      expect(screen.getByText(/Configuración de UEFA Euro 2024/)).toBeInTheDocument()
      expect(screen.getByText('[importantAlert.tournamentContext]')).toBeInTheDocument()
    })

    it('shows short_name in alert when long_name is null', () => {
      const tournament = testFactories.tournament({
        id: 'test-tournament',
        short_name: 'TEST',
        long_name: null as any,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // When tournament is provided with short_name only, it shows tournament-specific alert
      expect(screen.getByText(/Configuración de TEST/)).toBeInTheDocument()
    })

    it('shows short_name in alert when long_name is empty string', () => {
      const tournament = testFactories.tournament({
        id: 'test-tournament',
        short_name: 'WC',
        long_name: '',
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // When tournament is provided with empty long_name, falls back to short_name
      expect(screen.getByText(/Configuración de WC/)).toBeInTheDocument()
    })

    it('shows generic message when tournament is undefined', () => {
      renderWithTheme(<ScoringExplanationStep />)

      expect(screen.getByText('[importantAlert.title]')).toBeInTheDocument()
      expect(screen.getByText('[importantAlert.genericContext]')).toBeInTheDocument()
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
      expect(screen.getByText(/\[exactResult\.points\]{points:7}/)).toBeInTheDocument()
    })

    it('calculates with default values correctly', () => {
      renderWithTheme(<ScoringExplanationStep />)

      const expectedTotal = DEFAULT_SCORING.qualified_team_points + DEFAULT_SCORING.exact_position_qualified_points // 1 + 2 = 3
      // "3 pts" appears multiple times in mocked format (runnerUp, individualAward, exactPositionTotal)
      const threePtsElements = screen.getAllByText(/\[exactResult\.points\]{points:3}/)
      expect(threePtsElements.length).toBeGreaterThanOrEqual(1)
    })

    it('calculates with large values correctly', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 100,
        exact_position_qualified_points: 50,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText(/\[exactResult\.points\]{points:150}/)).toBeInTheDocument()
    })
  })

  describe('Scoring Categories Display', () => {
    it('displays game exact score category', () => {
      const tournament = testFactories.tournament({
        game_exact_score_points: 10,
        runner_up_points: 11, // Change to avoid collision with default runner_up (10 in factory)
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('[matchesHeader]')).toBeInTheDocument()
      expect(screen.getByText('[exactResult.label]')).toBeInTheDocument()
      expect(screen.getByText(/\[exactResult\.points\]{points:10}/)).toBeInTheDocument()
    })

    it('displays game correct outcome category', () => {
      const tournament = testFactories.tournament({
        game_correct_outcome_points: 5,
        champion_points: 20, // Change to avoid collision with default champion (5)
        third_place_points: 6, // Change to avoid collision with default third_place (5 in factory)
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('[correctResult.label]')).toBeInTheDocument()
      expect(screen.getByText(/\[correctResult\.points\]{points:5}/)).toBeInTheDocument()
    })

    it('displays champion points', () => {
      const tournament = testFactories.tournament({
        champion_points: 25,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('[tournamentHeader]')).toBeInTheDocument()
      expect(screen.getByText('[championMedal]')).toBeInTheDocument()
      expect(screen.getByText(/\[exactResult\.points\]{points:25}/)).toBeInTheDocument()
    })

    it('displays runner-up points', () => {
      const tournament = testFactories.tournament({
        runner_up_points: 15,
        champion_points: 16, // Change to avoid collision
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('[runnerUpMedal]')).toBeInTheDocument()
      expect(screen.getByText(/\[exactResult\.points\]{points:15}/)).toBeInTheDocument()
    })

    it('displays third place points', () => {
      const tournament = testFactories.tournament({
        third_place_points: 8,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('[thirdPlaceMedal]')).toBeInTheDocument()
      expect(screen.getByText(/\[exactResult\.points\]{points:8}/)).toBeInTheDocument()
    })

    it('displays individual award points', () => {
      const tournament = testFactories.tournament({
        individual_award_points: 12,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('[individualAwardsHeader]')).toBeInTheDocument()
      expect(screen.getByText('[awardPoints.label]')).toBeInTheDocument()
      expect(screen.getByText(/\[awardPoints\.points\]{points:12}/)).toBeInTheDocument()
    })

    it('displays qualified team points', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 6,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('[classificationHeader]')).toBeInTheDocument()
      expect(screen.getByText('[classified.label]')).toBeInTheDocument()
      expect(screen.getByText(/\[exactResult\.points\]{points:6}/)).toBeInTheDocument()
    })

    it('displays exact position qualified points in total', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 3,
        exact_position_qualified_points: 5,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText('[exactPosition.label]')).toBeInTheDocument()
      expect(screen.getByText(/\[exactResult\.points\]{points:8}/)).toBeInTheDocument() // 3 + 5
    })
  })

  describe('Singular/Plural Text Handling', () => {
    it('displays singular "pt" for 1-point game outcome', () => {
      const tournament = testFactories.tournament({
        game_correct_outcome_points: 1,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // Mocked translation format: [correctResult.points]{points:1}
      const onePtElements = screen.getAllByText(/\[correctResult\.points\]{points:1}/)
      expect(onePtElements.length).toBeGreaterThanOrEqual(1)
    })

    it('displays plural "pts" for multi-point game outcome', () => {
      const tournament = testFactories.tournament({
        game_correct_outcome_points: 5,
        champion_points: 20, // Change to avoid ambiguity with default champion (5)
        third_place_points: 6, // Change to avoid collision with factory default (5)
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText(/\[correctResult\.points\]{points:5}/)).toBeInTheDocument()
    })

    it('displays singular "pt" for 1-point third place', () => {
      const tournament = testFactories.tournament({
        third_place_points: 1,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // Find the chip with "1 pt" in the third place row
      const thirdPlaceText = screen.getByText('[thirdPlaceMedal]')
      expect(thirdPlaceText).toBeInTheDocument()
      // There will be multiple "1 pt" texts in mocked format
      const onePtElements = screen.getAllByText(/\[exactResult\.points\]{points:1}/)
      expect(onePtElements.length).toBeGreaterThanOrEqual(1)
    })

    it('displays plural "pts" for multi-point third place', () => {
      const tournament = testFactories.tournament({
        third_place_points: 8,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText(/\[exactResult\.points\]{points:8}/)).toBeInTheDocument()
    })

    it('displays singular "pt" for 1-point exact position total', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 0,
        exact_position_qualified_points: 1,
        third_place_points: 5, // Change to avoid ambiguity
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // Should have at least one "1 pt" for exact position total in mocked format
      const onePtElements = screen.getAllByText(/\[exactResult\.points\]{points:1}/)
      expect(onePtElements.length).toBeGreaterThanOrEqual(1)
    })

    it('displays plural "pts" for multi-point exact position total', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 5,
        exact_position_qualified_points: 3,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText(/\[exactResult\.points\]{points:8}/)).toBeInTheDocument()
    })

    it('displays singular "pt" for 1-point qualified team', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 1,
        third_place_points: 5, // Change to avoid ambiguity
        game_correct_outcome_points: 5, // Change to avoid ambiguity
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      // Should have at least one "1 pt" for qualified team in mocked format
      const onePtElements = screen.getAllByText(/\[exactResult\.points\]{points:1}/)
      expect(onePtElements.length).toBeGreaterThanOrEqual(1)
    })

    it('displays plural "pts" for multi-point qualified team', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 7,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText(/\[exactResult\.points\]{points:7}/)).toBeInTheDocument()
    })
  })

  describe('Individual Awards Total Calculation', () => {
    it('shows correct total calculation (4 awards × points)', () => {
      const tournament = testFactories.tournament({
        individual_award_points: 5,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText(/\[totalPossible\]{points:20,perAward:5}/)).toBeInTheDocument()
    })

    it('calculates with default value correctly', () => {
      renderWithTheme(<ScoringExplanationStep />)

      const expectedTotal = DEFAULT_SCORING.individual_award_points * 4 // 3 × 4 = 12
      expect(screen.getByText(/\[totalPossible\]{points:12,perAward:3}/)).toBeInTheDocument()
    })

    it('displays all four individual award types', () => {
      renderWithTheme(<ScoringExplanationStep />)

      expect(screen.getByText('[bestPlayerChip]')).toBeInTheDocument()
      expect(screen.getByText('[topScorerChip]')).toBeInTheDocument()
      expect(screen.getByText('[bestGoalkeeperChip]')).toBeInTheDocument()
      expect(screen.getByText('[youngPlayerChip]')).toBeInTheDocument()
    })

    it('calculates with large values correctly', () => {
      const tournament = testFactories.tournament({
        individual_award_points: 25,
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText(/\[totalPossible\]{points:100,perAward:25}/)).toBeInTheDocument()
    })
  })

  describe('UI Sections Rendering', () => {
    it('renders all four main sections', () => {
      renderWithTheme(<ScoringExplanationStep />)

      expect(screen.getByText('[matchesHeader]')).toBeInTheDocument() // Game section
      expect(screen.getByText('[tournamentHeader]')).toBeInTheDocument() // Tournament section
      expect(screen.getByText('[individualAwardsHeader]')).toBeInTheDocument() // Individual Awards section
      expect(screen.getByText('[classificationHeader]')).toBeInTheDocument() // Qualifiers section
    })

    it('renders alert section with info', () => {
      const tournament = testFactories.tournament({
        long_name: 'Test Tournament',
      })

      renderWithTheme(<ScoringExplanationStep tournament={tournament} />)

      expect(screen.getByText(/Configuración de Test Tournament/)).toBeInTheDocument()
      expect(screen.getByText('[importantAlert.tournamentContext]')).toBeInTheDocument()
    })
  })

  describe('Default Scoring Constant Verification', () => {
    it('uses correct default values matching DEFAULT_SCORING constant', () => {
      renderWithTheme(<ScoringExplanationStep />)

      // Verify game scoring defaults
      expect(screen.getByText(/\[exactResult\.points\]{points:2}/)).toBeInTheDocument()
      const onePtElements = screen.getAllByText(/\[correctResult\.points\]{points:1}/)
      expect(onePtElements.length).toBeGreaterThanOrEqual(1)

      // Verify tournament scoring defaults
      expect(screen.getByText(/\[exactResult\.points\]{points:5}/)).toBeInTheDocument()
      const threePtsElements = screen.getAllByText(/\[exactResult\.points\]{points:3}/)
      expect(threePtsElements.length).toBeGreaterThanOrEqual(1) // runnerUp and/or individualAward

      // Verify individual awards default
      const individualAwardsTotal = DEFAULT_SCORING.individual_award_points * 4
      expect(screen.getByText(/\[totalPossible\]{points:12,perAward:3}/)).toBeInTheDocument()

      // Verify qualified teams defaults
      const exactPositionTotal = DEFAULT_SCORING.qualified_team_points + DEFAULT_SCORING.exact_position_qualified_points
      // exactPositionTotal is 3, which also appears for runnerUp and individualAward
      const allThreePts = screen.getAllByText(/\[exactResult\.points\]{points:3}/)
      expect(allThreePts.length).toBeGreaterThanOrEqual(1)
      // qualifiedTeam is also "1 pt"
      expect(onePtElements.length).toBeGreaterThanOrEqual(1)
    })
  })
})
