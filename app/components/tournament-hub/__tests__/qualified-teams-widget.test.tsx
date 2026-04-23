import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QualifiedTeamsWidget } from '../qualified-teams-widget'
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
  qualifiedTeams: ['1 point — correct qualified team'],
  awards: ['awards-rule'],
}

const ONE_HOUR_MS = 60 * 60 * 1000

const baseProps = {
  isLoggedOff: false,
  scoringRules: defaultScoringRules,
  qtHref: '/en/tournaments/t-1/qualified-teams',
  qualifiersCompleted: 0,
  qualifiersTotal: 32,
  msUntilPredictionLock: Number.MAX_SAFE_INTEGER,
  lockDateFormatted: 'June 16, 2026',
}

describe('QualifiedTeamsWidget', () => {
  describe('icon and title', () => {
    it('renders the QT title from i18n key', async () => {
      render(await QualifiedTeamsWidget(baseProps))
      expect(screen.getByText('hub.newUser.tracks.qualifiedTeams.title')).toBeInTheDocument()
    })
  })

  describe('count display', () => {
    it('shows count as "completed/total"', async () => {
      render(await QualifiedTeamsWidget({ ...baseProps, qualifiersCompleted: 12, qualifiersTotal: 32 }))
      expect(screen.getByText('12/32')).toBeInTheDocument()
    })

    it('shows "0/total" when isLoggedOff is true', async () => {
      render(await QualifiedTeamsWidget({ ...baseProps, isLoggedOff: true, qualifiersCompleted: 0, qualifiersTotal: 32 }))
      expect(screen.getByText('0/32')).toBeInTheDocument()
    })
  })

  describe('CTA button', () => {
    it('renders login CTA when isLoggedOff is true', async () => {
      render(await QualifiedTeamsWidget({ ...baseProps, isLoggedOff: true }))
      expect(screen.getByText('hub.gamesWidget.ctaLogin')).toBeInTheDocument()
    })

    it('renders start CTA when isLoggedOff is false and progress is 0%', async () => {
      render(await QualifiedTeamsWidget({ ...baseProps, qualifiersCompleted: 0, qualifiersTotal: 32 }))
      expect(screen.getByText('hub.newUser.tracks.qualifiedTeams.cta')).toBeInTheDocument()
    })

    it('renders ctaKeep when progress is between 0% and 90%', async () => {
      render(await QualifiedTeamsWidget({ ...baseProps, qualifiersCompleted: 16, qualifiersTotal: 32 }))
      expect(screen.getByText('hub.newUser.tracks.qualifiedTeams.ctaKeep')).toBeInTheDocument()
    })

    it('renders ctaFinish when progress is >= 90% but < 100%', async () => {
      render(await QualifiedTeamsWidget({ ...baseProps, qualifiersCompleted: 30, qualifiersTotal: 32 }))
      expect(screen.getByText('hub.newUser.tracks.qualifiedTeams.ctaFinish')).toBeInTheDocument()
    })

    it('renders ctaReview when qualifiersCompleted equals qualifiersTotal', async () => {
      render(await QualifiedTeamsWidget({ ...baseProps, qualifiersCompleted: 32, qualifiersTotal: 32 }))
      expect(screen.getByText('hub.newUser.tracks.qualifiedTeams.ctaReview')).toBeInTheDocument()
    })
  })

  describe('progress bar', () => {
    it('renders LinearProgress when qualifiersTotal > 0', async () => {
      const { container } = render(await QualifiedTeamsWidget({ ...baseProps, qualifiersCompleted: 16, qualifiersTotal: 32 }))
      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument()
    })

    it('does not render LinearProgress when qualifiersTotal is 0', async () => {
      const { container } = render(await QualifiedTeamsWidget({ ...baseProps, qualifiersTotal: 0 }))
      expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument()
    })
  })

  describe('deadline box', () => {
    it('renders normal deadline message when msUntilPredictionLock is MAX_SAFE_INTEGER', async () => {
      render(await QualifiedTeamsWidget({ ...baseProps, msUntilPredictionLock: Number.MAX_SAFE_INTEGER }))
      expect(screen.getByText('hub.statusWidget.deadlineNormal')).toBeInTheDocument()
    })

    it('renders info deadline message when msUntilPredictionLock is between 24h and 48h', async () => {
      render(await QualifiedTeamsWidget({ ...baseProps, msUntilPredictionLock: 36 * ONE_HOUR_MS }))
      expect(screen.getByText('hub.statusWidget.deadlineInfo')).toBeInTheDocument()
    })

    it('renders warning deadline message when msUntilPredictionLock is between 2h and 24h', async () => {
      render(await QualifiedTeamsWidget({ ...baseProps, msUntilPredictionLock: 12 * ONE_HOUR_MS }))
      expect(screen.getByText('hub.statusWidget.deadlineWarning')).toBeInTheDocument()
    })

    it('renders error deadline message when msUntilPredictionLock is less than 2h', async () => {
      render(await QualifiedTeamsWidget({ ...baseProps, msUntilPredictionLock: ONE_HOUR_MS }))
      expect(screen.getByText('hub.statusWidget.deadlineError')).toBeInTheDocument()
    })

    it('renders lockDateFormatted in the deadline box', async () => {
      render(await QualifiedTeamsWidget({ ...baseProps, lockDateFormatted: 'June 16, 2026' }))
      expect(screen.getByText('June 16, 2026')).toBeInTheDocument()
    })
  })

  describe('scoring rules', () => {
    it('renders scoring rules from scoringRules.qualifiedTeams', async () => {
      render(await QualifiedTeamsWidget(baseProps))
      expect(screen.getByText('• 1 point — correct qualified team')).toBeInTheDocument()
    })
  })
})
