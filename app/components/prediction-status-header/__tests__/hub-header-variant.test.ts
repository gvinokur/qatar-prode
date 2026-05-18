import { describe, it, expect, vi } from 'vitest'
import {
  computeHubPriorityVariant,
  computeLoggedOutVariant,
  computeEngagementVariant,
} from '../hub-header-variant'
import type { PriorityAttentionState } from '../../../utils/priority-attention'

// Mock translation function — returns key (with values encoded) so we can assert on keys used
const mockT = (key: string, values?: Record<string, unknown>) => {
  if (values) return `${key}:${JSON.stringify(values)}`
  return key
}

const GAMES_HREF = '/en/tournaments/t1/games'
const QT_HREF = '/en/tournaments/t1/qualified-teams'
const AWARDS_HREF = '/en/tournaments/t1/awards'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeUrgentState = (overrides: Partial<PriorityAttentionState> = {}): PriorityAttentionState => ({
  type: 'urgent-games',
  urgentCount: 3,
  firstUrgentGameId: 'game-1',
  msUntilMostUrgentGame: TWENTY_FOUR_HOURS_MS - 1,
  completedCount: 10,
  totalCount: 48,
  ...overrides,
})

const makeDeadlineState = (overrides: Partial<PriorityAttentionState> = {}): PriorityAttentionState => ({
  type: 'deadline',
  completedCount: 5,
  totalCount: 32,
  qtIncomplete: true,
  qtCompleted: 5,
  qtTotal: 32,
  awardsIncomplete: false,
  awardsCompleted: 7,
  awardsTotal: 7,
  msUntilPredictionLock: TWENTY_FOUR_HOURS_MS + 1,
  ...overrides,
})

const makePlayoffState = (overrides: Partial<PriorityAttentionState> = {}): PriorityAttentionState => ({
  type: 'now-available-playoff',
  completedCount: 0,
  totalCount: 0,
  availableRoundName: 'Round of 16',
  availableRoundFirstGameId: 'game-r16-001',
  ...overrides,
})

// ─── computeHubPriorityVariant ────────────────────────────────────────────────

describe('computeHubPriorityVariant — urgent-games', () => {
  it('returns deadlineUrgent tone when msUntilMostUrgentGame >= 2h', () => {
    const state = makeUrgentState({ msUntilMostUrgentGame: TWO_HOURS_MS })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.tone).toBe('deadlineUrgent')
    expect(variant.leadIcon).toBe('clock')
  })

  it('returns deadlineNow tone when msUntilMostUrgentGame < 2h', () => {
    const state = makeUrgentState({ msUntilMostUrgentGame: TWO_HOURS_MS - 1 })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.tone).toBe('deadlineNow')
    expect(variant.leadIcon).toBe('clock')
  })

  it('defaults to deadlineUrgent when msUntilMostUrgentGame is undefined', () => {
    const state = makeUrgentState({ msUntilMostUrgentGame: undefined })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.tone).toBe('deadlineUrgent')
  })

  it('action href links to games page with first urgent game id', () => {
    const state = makeUrgentState({ firstUrgentGameId: 'game-abc' })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.action?.href).toBe(`${GAMES_HREF}?edit=game-abc`)
  })

  it('uses urgentCount for statusText when set', () => {
    const state = makeUrgentState({ urgentCount: 5 })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.statusText).toContain('attentionWidget.urgentGames.title')
    expect(variant.statusText).toContain('"count":5')
  })
})

describe('computeHubPriorityVariant — now-available-playoff', () => {
  it('returns success tone with rocket icon', () => {
    const state = makePlayoffState()
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.tone).toBe('success')
    expect(variant.leadIcon).toBe('rocket')
  })

  it('action href links to first game in the available round', () => {
    const state = makePlayoffState({ availableRoundFirstGameId: 'game-r16-001' })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.action?.href).toBe(`${GAMES_HREF}?edit=game-r16-001`)
  })

  it('includes round name in statusText', () => {
    const state = makePlayoffState({ availableRoundName: 'Quarter Finals' })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.statusText).toContain('Quarter Finals')
  })
})

describe('computeHubPriorityVariant — deadline', () => {
  it('returns deadlineSoon when msUntilPredictionLock >= 24h', () => {
    const state = makeDeadlineState({ msUntilPredictionLock: TWENTY_FOUR_HOURS_MS })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.tone).toBe('deadlineSoon')
    expect(variant.leadIcon).toBe('clock')
  })

  it('returns deadlineUrgent when msUntilPredictionLock < 24h', () => {
    const state = makeDeadlineState({ msUntilPredictionLock: TWENTY_FOUR_HOURS_MS - 1 })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.tone).toBe('deadlineUrgent')
  })

  it('defaults to deadlineSoon when msUntilPredictionLock is undefined', () => {
    const state = makeDeadlineState({ msUntilPredictionLock: undefined })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.tone).toBe('deadlineSoon')
  })

  it('primary action links to qtHref when only QT is incomplete', () => {
    const state = makeDeadlineState({ qtIncomplete: true, awardsIncomplete: false })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.action?.href).toBe(QT_HREF)
    expect(variant.secondaryAction).toBeUndefined()
  })

  it('primary action links to awardsHref when only awards is incomplete', () => {
    const state = makeDeadlineState({ qtIncomplete: false, awardsIncomplete: true })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.action?.href).toBe(AWARDS_HREF)
    expect(variant.secondaryAction).toBeUndefined()
  })

  it('adds secondary action for awardsHref when both QT and awards are incomplete', () => {
    const state = makeDeadlineState({ qtIncomplete: true, awardsIncomplete: true })
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.action?.href).toBe(QT_HREF)
    expect(variant.secondaryAction).toBeDefined()
    expect(variant.secondaryAction?.href).toBe(AWARDS_HREF)
  })
})

describe('computeHubPriorityVariant — new-actions-qt', () => {
  it('returns success tone with rocket icon and qtHref', () => {
    const state: PriorityAttentionState = {
      type: 'new-actions-qt',
      completedCount: 48,
      totalCount: 48,
    }
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.tone).toBe('success')
    expect(variant.leadIcon).toBe('rocket')
    expect(variant.action?.href).toBe(QT_HREF)
  })
})

describe('computeHubPriorityVariant — new-actions-awards', () => {
  it('returns success tone with trophy icon and awardsHref', () => {
    const state: PriorityAttentionState = {
      type: 'new-actions-awards',
      completedCount: 32,
      totalCount: 32,
    }
    const variant = computeHubPriorityVariant(state, mockT, GAMES_HREF, QT_HREF, AWARDS_HREF)
    expect(variant.tone).toBe('success')
    expect(variant.leadIcon).toBe('trophy')
    expect(variant.action?.href).toBe(AWARDS_HREF)
  })
})

// ─── computeLoggedOutVariant ──────────────────────────────────────────────────

describe('computeLoggedOutVariant', () => {
  it('returns brand tone with login icon', () => {
    const variant = computeLoggedOutVariant(mockT, vi.fn())
    expect(variant.tone).toBe('brand')
    expect(variant.leadIcon).toBe('login')
  })

  it('primary action onClick is the provided onSignIn callback', () => {
    const onSignIn = vi.fn()
    const variant = computeLoggedOutVariant(mockT, onSignIn)
    expect(variant.action?.onClick).toBe(onSignIn)
  })

  it('statusText uses welcome key and action label uses loginOrSignup key', () => {
    const variant = computeLoggedOutVariant(mockT, vi.fn())
    expect(variant.statusText).toBe('welcome')
    expect(variant.action?.label).toBe('loginOrSignup')
  })

  it('message uses ctaDescription key for the expanded description', () => {
    const variant = computeLoggedOutVariant(mockT, vi.fn())
    expect(variant.message).toBe('ctaDescription')
  })

  it('has no secondaryAction — single CTA only', () => {
    const variant = computeLoggedOutVariant(mockT, vi.fn())
    expect(variant.secondaryAction).toBeUndefined()
  })

  it('action does not have an href (onClick only)', () => {
    const variant = computeLoggedOutVariant(mockT, vi.fn())
    expect('href' in (variant.action ?? {})).toBe(false)
  })
})

// ─── computeEngagementVariant ─────────────────────────────────────────────────

describe('computeEngagementVariant — pre-tournament-cta', () => {
  it('returns brand tone with book icon', () => {
    const variant = computeEngagementVariant('pre-tournament-cta', mockT, { predictedGames: 0, gamesEditHref: '/en/t/games?edit=next' })
    expect(variant.tone).toBe('brand')
    expect(variant.leadIcon).toBe('book')
  })

  it('primary action label uses ctaKeep key when predictedGames > 0', () => {
    const variant = computeEngagementVariant('pre-tournament-cta', mockT, { predictedGames: 3, gamesEditHref: '/games?edit=next' })
    expect(variant.action?.label).toBe('newUser.tracks.matches.ctaKeep')
  })

  it('primary action label uses cta key when predictedGames === 0', () => {
    const variant = computeEngagementVariant('pre-tournament-cta', mockT, { predictedGames: 0, gamesEditHref: '/games?edit=next' })
    expect(variant.action?.label).toBe('newUser.tracks.matches.cta')
  })

  it('primary action is an href action linking to gamesEditHref', () => {
    const href = '/en/tournaments/t1/games?edit=next'
    const variant = computeEngagementVariant('pre-tournament-cta', mockT, { predictedGames: 0, gamesEditHref: href })
    expect(variant.action?.href).toBe(href)
  })

  it('secondary action onClick is the provided onTutorial callback', () => {
    const onTutorial = vi.fn()
    const variant = computeEngagementVariant('pre-tournament-cta', mockT, { onTutorial, gamesEditHref: '/games?edit=next' })
    expect(variant.secondaryAction?.onClick).toBe(onTutorial)
  })
})

describe('computeEngagementVariant — app-install', () => {
  it('returns brand tone with mobile icon', () => {
    const variant = computeEngagementVariant('app-install', mockT, {})
    expect(variant.tone).toBe('brand')
    expect(variant.leadIcon).toBe('mobile')
  })

  it('primary action onClick is the provided onInstall callback', () => {
    const onInstall = vi.fn()
    const variant = computeEngagementVariant('app-install', mockT, { onInstall })
    expect(variant.action?.onClick).toBe(onInstall)
  })

  it('secondary action onClick is the provided onDismiss callback', () => {
    const onDismiss = vi.fn()
    const variant = computeEngagementVariant('app-install', mockT, { onDismiss })
    expect(variant.secondaryAction?.onClick).toBe(onDismiss)
  })
})

describe('computeEngagementVariant — notification-opt-in', () => {
  it('returns brand tone with bell icon', () => {
    const variant = computeEngagementVariant('notification-opt-in', mockT, {})
    expect(variant.tone).toBe('brand')
    expect(variant.leadIcon).toBe('bell')
  })

  it('primary action onClick is the provided onEnable callback', () => {
    const onEnable = vi.fn()
    const variant = computeEngagementVariant('notification-opt-in', mockT, { onEnable })
    expect(variant.action?.onClick).toBe(onEnable)
  })

  it('secondary action onClick is the provided onDismiss callback', () => {
    const onDismiss = vi.fn()
    const variant = computeEngagementVariant('notification-opt-in', mockT, { onDismiss })
    expect(variant.secondaryAction?.onClick).toBe(onDismiss)
  })
})
