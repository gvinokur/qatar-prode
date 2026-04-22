import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GamesInfoWidget } from '../games-info-widget'
import type { ScoringRulesBySection } from '@/app/utils/scoring-rules-utils'

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (ns: string) => {
    return (key: string, params?: Record<string, unknown>) => {
      const fullKey = `${ns}.${key}`
      if (params && Object.keys(params).length > 0) {
        return `${fullKey}(${JSON.stringify(params)})`
      }
      return fullKey
    }
  }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

const defaultScoringRules: ScoringRulesBySection = {
  matches: ['1 point — correct winner/draw', '1 bonus point — exact score'],
  qualifiedTeams: ['qt-rule'],
  awards: ['awards-rule'],
}

describe('GamesInfoWidget', () => {
  describe('count display', () => {
    it('renders "0/${totalGames}" count when isLoggedOff is true', async () => {
      render(
        await GamesInfoWidget({
          isLoggedOff: true,
          scoringRules: defaultScoringRules,
          gamesHref: '/en/tournaments/t-1/games',
          predictedGames: 0,
          totalGames: 104,
        })
      )
      expect(screen.getByText('0/104')).toBeInTheDocument()
    })

    it('renders "${predictedGames}/${totalGames}" count when isLoggedOff is false', async () => {
      render(
        await GamesInfoWidget({
          isLoggedOff: false,
          scoringRules: defaultScoringRules,
          gamesHref: '/en/tournaments/t-1/games',
          predictedGames: 42,
          totalGames: 104,
        })
      )
      expect(screen.getByText('42/104')).toBeInTheDocument()
    })
  })

  describe('CTA button', () => {
    it('renders "Sign In to Predict" CTA when isLoggedOff is true', async () => {
      render(
        await GamesInfoWidget({
          isLoggedOff: true,
          scoringRules: defaultScoringRules,
          gamesHref: '/en/tournaments/t-1/games',
          predictedGames: 0,
          totalGames: 104,
        })
      )
      expect(screen.getByText('hub.gamesWidget.ctaLogin')).toBeInTheDocument()
    })

    it('renders "Start Predicting" CTA when isLoggedOff is false and predictedGames is 0', async () => {
      render(
        await GamesInfoWidget({
          isLoggedOff: false,
          scoringRules: defaultScoringRules,
          gamesHref: '/en/tournaments/t-1/games',
          predictedGames: 0,
          totalGames: 104,
        })
      )
      expect(screen.getByText('hub.newUser.tracks.matches.cta')).toBeInTheDocument()
    })

    it('renders "Keep Predicting" CTA when isLoggedOff is false and predictedGames > 0', async () => {
      render(
        await GamesInfoWidget({
          isLoggedOff: false,
          scoringRules: defaultScoringRules,
          gamesHref: '/en/tournaments/t-1/games',
          predictedGames: 10,
          totalGames: 104,
        })
      )
      expect(screen.getByText('hub.gamesWidget.ctaContinue')).toBeInTheDocument()
    })
  })

  describe('progress bar', () => {
    it('renders LinearProgress with value=0 when isLoggedOff=true and totalGames > 0', async () => {
      const { container } = render(
        await GamesInfoWidget({
          isLoggedOff: true,
          scoringRules: defaultScoringRules,
          gamesHref: '/en/tournaments/t-1/games',
          predictedGames: 0,
          totalGames: 104,
        })
      )
      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '0')
    })

    it('renders LinearProgress with non-zero value when isLoggedOff=false and predictedGames > 0', async () => {
      const { container } = render(
        await GamesInfoWidget({
          isLoggedOff: false,
          scoringRules: defaultScoringRules,
          gamesHref: '/en/tournaments/t-1/games',
          predictedGames: 52,
          totalGames: 104,
        })
      )
      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    })

    it('does not render LinearProgress when totalGames is 0', async () => {
      const { container } = render(
        await GamesInfoWidget({
          isLoggedOff: false,
          scoringRules: defaultScoringRules,
          gamesHref: '/en/tournaments/t-1/games',
          predictedGames: 0,
          totalGames: 0,
        })
      )
      expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument()
    })
  })

  describe('scoring rules box', () => {
    it('renders scoring rule strings from scoringRules.matches', async () => {
      render(
        await GamesInfoWidget({
          isLoggedOff: false,
          scoringRules: defaultScoringRules,
          gamesHref: '/en/tournaments/t-1/games',
          predictedGames: 0,
          totalGames: 64,
        })
      )
      expect(screen.getByText('• 1 point — correct winner/draw')).toBeInTheDocument()
      expect(screen.getByText('• 1 bonus point — exact score')).toBeInTheDocument()
    })
  })

  describe('deadline box', () => {
    it('renders deadline box with deadlineText key', async () => {
      render(
        await GamesInfoWidget({
          isLoggedOff: false,
          scoringRules: defaultScoringRules,
          gamesHref: '/en/tournaments/t-1/games',
          predictedGames: 0,
          totalGames: 64,
        })
      )
      expect(screen.getByText('hub.gamesWidget.deadlineText')).toBeInTheDocument()
    })
  })
})
