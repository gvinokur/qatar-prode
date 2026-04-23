import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AwardsWidget } from '../awards-widget'
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
  matches: ['1 point — correct winner/draw'],
  qualifiedTeams: ['qt-rule'],
  awards: ['3 points — correct champion'],
}

const ONE_HOUR_MS = 60 * 60 * 1000

const baseProps = {
  isLoggedOff: false,
  scoringRules: defaultScoringRules,
  awardsHref: '/en/tournaments/t-1/awards',
  awardsCompleted: 0,
  awardsTotal: 7,
  msUntilPredictionLock: Number.MAX_SAFE_INTEGER,
  lockDateFormatted: 'June 16, 2026',
}

describe('AwardsWidget', () => {
  describe('icon and title', () => {
    it('renders the awards title from i18n key', async () => {
      render(await AwardsWidget(baseProps))
      expect(screen.getByText('hub.newUser.tracks.awards.title')).toBeInTheDocument()
    })
  })

  describe('count display', () => {
    it('shows count as "completed/total"', async () => {
      render(await AwardsWidget({ ...baseProps, awardsCompleted: 4, awardsTotal: 7 }))
      expect(screen.getByText('4/7')).toBeInTheDocument()
    })

    it('shows "0/total" when isLoggedOff is true', async () => {
      render(await AwardsWidget({ ...baseProps, isLoggedOff: true, awardsCompleted: 0, awardsTotal: 7 }))
      expect(screen.getByText('0/7')).toBeInTheDocument()
    })
  })

  describe('CTA button', () => {
    it('renders login CTA when isLoggedOff is true', async () => {
      render(await AwardsWidget({ ...baseProps, isLoggedOff: true }))
      expect(screen.getByText('hub.gamesWidget.ctaLogin')).toBeInTheDocument()
    })

    it('renders start CTA when isLoggedOff is false and progress is 0%', async () => {
      render(await AwardsWidget({ ...baseProps, awardsCompleted: 0, awardsTotal: 7 }))
      expect(screen.getByText('hub.newUser.tracks.awards.cta')).toBeInTheDocument()
    })

    it('renders ctaKeep when progress is between 0% and 90%', async () => {
      render(await AwardsWidget({ ...baseProps, awardsCompleted: 3, awardsTotal: 7 }))
      expect(screen.getByText('hub.newUser.tracks.awards.ctaKeep')).toBeInTheDocument()
    })

    it('renders ctaReview when awardsCompleted equals awardsTotal', async () => {
      render(await AwardsWidget({ ...baseProps, awardsCompleted: 7, awardsTotal: 7 }))
      expect(screen.getByText('hub.newUser.tracks.awards.ctaReview')).toBeInTheDocument()
    })
  })

  describe('deadline box', () => {
    it('renders normal deadline message when msUntilPredictionLock is MAX_SAFE_INTEGER', async () => {
      render(await AwardsWidget({ ...baseProps, msUntilPredictionLock: Number.MAX_SAFE_INTEGER }))
      expect(screen.getByText('hub.statusWidget.deadlineNormal')).toBeInTheDocument()
    })

    it('renders error deadline message when msUntilPredictionLock is less than 2h', async () => {
      render(await AwardsWidget({ ...baseProps, msUntilPredictionLock: ONE_HOUR_MS }))
      expect(screen.getByText('hub.statusWidget.deadlineError')).toBeInTheDocument()
    })

    it('renders lockDateFormatted in the deadline box', async () => {
      render(await AwardsWidget({ ...baseProps, lockDateFormatted: 'June 16, 2026' }))
      expect(screen.getByText('June 16, 2026')).toBeInTheDocument()
    })
  })

  describe('progress bar', () => {
    it('renders LinearProgress when awardsTotal > 0', async () => {
      const { container } = render(await AwardsWidget({ ...baseProps, awardsCompleted: 4, awardsTotal: 7 }))
      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument()
    })

    it('does not render LinearProgress when awardsTotal is 0', async () => {
      const { container } = render(await AwardsWidget({ ...baseProps, awardsTotal: 0 }))
      expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument()
    })
  })

  describe('scoring rules', () => {
    it('renders scoring rules from scoringRules.awards', async () => {
      render(await AwardsWidget(baseProps))
      expect(screen.getByText('• 3 points — correct champion')).toBeInTheDocument()
    })
  })
})
