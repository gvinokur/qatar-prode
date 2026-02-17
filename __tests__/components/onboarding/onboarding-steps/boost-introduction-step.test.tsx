import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import BoostIntroductionStep from '@/app/components/onboarding/onboarding-steps/boost-introduction-step'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { testFactories } from '@/__tests__/db/test-factories'
import { createMockTranslations } from '@/__tests__/utils/mock-translations'
import * as intl from 'next-intl'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => 'es')
}))

describe('BoostIntroductionStep', () => {
  beforeEach(() => {
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('onboarding.steps.boosts')
    )
  })

  describe('Component Rendering', () => {
    it('renders component with tournament prop', () => {
      const tournament = testFactories.tournament({
        id: 'euro-2024',
        long_name: 'UEFA Euro 2024',
        max_silver_games: 5,
        max_golden_games: 3,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('[title]')).toBeInTheDocument()
      expect(screen.getByText('[instructions]')).toBeInTheDocument()
    })

    it('renders all UI elements (cards, chips, alerts)', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 5,
        max_golden_games: 3,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      // Check card titles
      expect(screen.getByText('[silverBoost.label]')).toBeInTheDocument()
      expect(screen.getByText('[goldenBoost.label]')).toBeInTheDocument()

      // Check chips - now using translation keys with pluralization
      expect(screen.getByText(/\[silverBoost\.available\]{count:5}/)).toBeInTheDocument()
      expect(screen.getByText(/\[goldenBoost\.available\]{count:3}/)).toBeInTheDocument()

      // Check multiplier values
      expect(screen.getByText('[silverBoost.multiplier]')).toBeInTheDocument()
      expect(screen.getByText('[goldenBoost.multiplier]')).toBeInTheDocument()

      // Check descriptions
      expect(screen.getByText('[silverBoost.description]')).toBeInTheDocument()
      expect(screen.getByText('[goldenBoost.description]')).toBeInTheDocument()

      // Check alert content
      expect(screen.getByText('[configAlert.subheader]')).toBeInTheDocument()
      expect(screen.getByText('• [configAlert.bullet1]')).toBeInTheDocument()
      expect(screen.getByText('• [configAlert.bullet2]')).toBeInTheDocument()
      expect(screen.getByText('• [configAlert.bullet3]')).toBeInTheDocument()
    })

    it('displays strategic tip', () => {
      const tournament = testFactories.tournament()

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('[strategicTip.title]')).toBeInTheDocument()
      expect(screen.getByText('[strategicTip.text]')).toBeInTheDocument()
    })
  })

  describe('Boost Count Display', () => {
    it('displays silver boost count from tournament (max_silver_games)', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 7,
        max_golden_games: 2,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:7}/)).toBeInTheDocument()
    })

    it('displays golden boost count from tournament (max_golden_games)', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 3,
        max_golden_games: 4,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:4}/)).toBeInTheDocument()
    })

    it('displays both silver and golden boosts', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 5,
        max_golden_games: 3,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:5}/)).toBeInTheDocument()
      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:3}/)).toBeInTheDocument()
    })
  })

  describe('Undefined/Null Tournament Handling', () => {
    it('handles undefined tournament gracefully (shows 0 boosts)', () => {
      renderWithTheme(<BoostIntroductionStep tournament={undefined} />)

      // Should show 0 for both boost types (2 instances)
      expect(screen.getAllByText(/\[(silverBoost|goldenBoost)\.available\]{count:0}/)).toHaveLength(2)
      // Component should still render without errors
      expect(screen.getByText('[title]')).toBeInTheDocument()
    })

    it('handles tournament with null boost values (treated as 0)', () => {
      const tournament = testFactories.tournament({
        max_silver_games: null as unknown as number,
        max_golden_games: null as unknown as number,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      // Both should show 0
      expect(screen.getAllByText(/\[(silverBoost|goldenBoost)\.available\]{count:0}/)).toHaveLength(2)
    })
  })

  describe('Singular/Plural Text', () => {
    it('displays singular text for 1 silver boost', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 1,
        max_golden_games: 3,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:1}/)).toBeInTheDocument()
    })

    it('displays singular text for 1 golden boost', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 5,
        max_golden_games: 1,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:1}/)).toBeInTheDocument()
    })

    it('displays plural text for multiple silver boosts', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 10,
        max_golden_games: 2,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:10}/)).toBeInTheDocument()
    })

    it('displays plural text for multiple golden boosts', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 3,
        max_golden_games: 8,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:8}/)).toBeInTheDocument()
    })

    it('displays correct singular/plural when both boosts are 1', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 1,
        max_golden_games: 1,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getAllByText(/\[(silverBoost|goldenBoost)\.available\]{count:1}/)).toHaveLength(2)
    })
  })

  describe('Tournament Name Display', () => {
    it('shows tournament long_name when available', () => {
      const tournament = testFactories.tournament({
        long_name: 'FIFA World Cup 2026',
        short_name: 'WC26',
        max_silver_games: 5,
        max_golden_games: 3,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      // Configuration header shows tournament name through interpolation
      expect(screen.getByText(/\[configAlert\.header\]\{tournament:FIFA World Cup 2026\}/)).toBeInTheDocument()
    })

    it('falls back to short_name when long_name is null', () => {
      const tournament = testFactories.tournament({
        long_name: null as unknown as string,
        short_name: 'WC26',
        max_silver_games: 5,
        max_golden_games: 3,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText(/\[configAlert\.header\]\{tournament:WC26\}/)).toBeInTheDocument()
    })

    it('does not show tournament name when tournament is undefined', () => {
      renderWithTheme(<BoostIntroductionStep tournament={undefined} />)

      expect(screen.queryByText(/\[configAlert\.header\]/)).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles tournament with only silver boosts (0 golden)', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 10,
        max_golden_games: 0,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:10}/)).toBeInTheDocument()
      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:0}/)).toBeInTheDocument()
    })

    it('handles tournament with only golden boosts (0 silver)', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 0,
        max_golden_games: 5,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:0}/)).toBeInTheDocument()
      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:5}/)).toBeInTheDocument()
    })

    it('handles tournament with 0 boosts for both types', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 0,
        max_golden_games: 0,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getAllByText(/\[(silverBoost|goldenBoost)\.available\]{count:0}/)).toHaveLength(2)
    })

    it('handles large boost numbers', () => {
      const tournament = testFactories.tournament({
        max_silver_games: 999,
        max_golden_games: 888,
      })

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:999}/)).toBeInTheDocument()
      expect(screen.getByText(/\[(silverBoost|goldenBoost)\.available\]{count:888}/)).toBeInTheDocument()
    })
  })

  describe('Multiplier Display', () => {
    it('shows ×2 multiplier for silver boost', () => {
      const tournament = testFactories.tournament()

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('[silverBoost.multiplier]')).toBeInTheDocument()
    })

    it('shows ×3 multiplier for golden boost', () => {
      const tournament = testFactories.tournament()

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('[goldenBoost.multiplier]')).toBeInTheDocument()
    })
  })

  describe('Visual Elements', () => {
    it('renders silver medal emoji', () => {
      const tournament = testFactories.tournament()

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('🥈')).toBeInTheDocument()
    })

    it('renders strategic tip emoji', () => {
      const tournament = testFactories.tournament()

      renderWithTheme(<BoostIntroductionStep tournament={tournament} />)

      expect(screen.getByText('[strategicTip.title]')).toBeInTheDocument()
    })
  })
})
