/**
 * Computes PredictionStatusHeader variants for the Tournament Hub page.
 * Follows the same pattern as games-header-variant.ts, qt-header-variant.ts, awards-header-variant.ts.
 *
 * Three exported functions:
 * - computeHubPriorityVariant  — P1–P5: maps PriorityAttentionState → StatusHeaderVariant
 * - computeLoggedOutVariant    — S1: logged-out CTA banner
 * - computeEngagementVariant   — P6–P8: tutorial, app install, notification opt-in
 */

type TFunction = (key: string, values?: Record<string, string | number | Date>) => string

import type { PriorityAttentionState } from '../../utils/priority-attention'
import type { StatusHeaderVariant } from './types'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

// ─── P1–P5: Priority attention states ────────────────────────────────────────

function urgentGamesTone(msUntilMostUrgentGame: number | undefined): 'deadlineNow' | 'deadlineUrgent' {
  if (msUntilMostUrgentGame === undefined) return 'deadlineUrgent'
  return msUntilMostUrgentGame < TWO_HOURS_MS ? 'deadlineNow' : 'deadlineUrgent'
}

function deadlineTone(msUntilPredictionLock: number | undefined): 'deadlineUrgent' | 'deadlineSoon' {
  if (msUntilPredictionLock === undefined) return 'deadlineSoon'
  return msUntilPredictionLock < TWENTY_FOUR_HOURS_MS ? 'deadlineUrgent' : 'deadlineSoon'
}

/**
 * Maps a PriorityAttentionState (P1–P5) to a StatusHeaderVariant for the Hub banner.
 * Uses `hub.attentionWidget.*` translation keys.
 *
 * @param state - Non-null priority attention state from computePriorityAttention()
 * @param t - Translation function bound to the 'hub' namespace
 * @param gamesHref - Absolute href to the games page (/{locale}/tournaments/{id}/games)
 * @param qtHref - Absolute href to the qualified-teams page
 * @param awardsHref - Absolute href to the awards page
 */
export function computeHubPriorityVariant(
  state: PriorityAttentionState,
  t: TFunction,
  gamesHref: string,
  qtHref: string,
  awardsHref: string,
): StatusHeaderVariant {
  const gamesEditHref = `${gamesHref}?edit=${state.firstUrgentGameId ?? 'next'}`

  switch (state.type) {
    case 'urgent-games': {
      const tone = urgentGamesTone(state.msUntilMostUrgentGame)
      return {
        tone,
        leadIcon: 'clock',
        statusText: t('attentionWidget.urgentGames.title', { count: state.urgentCount ?? state.totalCount }),
        message: t('attentionWidget.urgentGames.subtitle'),
        action: { label: t('attentionWidget.urgentGames.cta'), href: gamesEditHref },
      }
    }

    case 'now-available-playoff':
      return {
        tone: 'success',
        leadIcon: 'rocket',
        statusText: t('attentionWidget.nowAvailablePlayoff.title', { roundName: state.availableRoundName ?? '' }),
        message: t('attentionWidget.nowAvailablePlayoff.subtitle'),
        action: {
          label: t('attentionWidget.nowAvailablePlayoff.cta'),
          href: `${gamesHref}?edit=${state.availableRoundFirstGameId ?? 'next'}`,
        },
      }

    case 'deadline': {
      const tone = deadlineTone(state.msUntilPredictionLock)
      const qtIncomplete = state.qtIncomplete ?? false
      const awardsIncomplete = state.awardsIncomplete ?? false
      const primaryHref = qtIncomplete ? qtHref : awardsHref
      const primaryLabel = qtIncomplete
        ? t('attentionWidget.deadline.ctaQt')
        : t('attentionWidget.deadline.ctaAwards')
      const secondaryAction =
        qtIncomplete && awardsIncomplete
          ? ({ label: t('attentionWidget.deadline.ctaAwards'), href: awardsHref } as StatusHeaderVariant['secondaryAction'])
          : undefined

      return {
        tone,
        leadIcon: 'clock',
        statusText: t('attentionWidget.deadline.title'),
        message: t('attentionWidget.deadline.subtitle'),
        action: { label: primaryLabel, href: primaryHref },
        ...(secondaryAction && { secondaryAction }),
      }
    }

    case 'new-actions-qt':
      return {
        tone: 'success',
        leadIcon: 'rocket',
        statusText: t('attentionWidget.newActionsQt.title'),
        message: t('attentionWidget.newActionsQt.subtitle'),
        action: { label: t('attentionWidget.newActionsQt.cta'), href: qtHref },
      }

    case 'new-actions-awards':
      return {
        tone: 'success',
        leadIcon: 'trophy',
        statusText: t('attentionWidget.newActionsAwards.title'),
        message: t('attentionWidget.newActionsAwards.subtitle'),
        action: { label: t('attentionWidget.newActionsAwards.cta'), href: awardsHref },
      }
  }
}

// ─── S1: Logged-out CTA ───────────────────────────────────────────────────────

/**
 * Returns a StatusHeaderVariant for the S1 logged-out CTA state.
 * Uses `tournament.public.*` translation keys.
 * Both actions use onClick callbacks (login/onboarding dialogs, no hrefs).
 *
 * @param t - Translation function bound to the 'tournament.public' namespace
 * @param onSignIn - Callback to open the login/signup dialog
 * @param onLearnHow - Callback to open the onboarding dialog
 */
export function computeLoggedOutVariant(
  t: TFunction,
  onSignIn: () => void,
  onLearnHow: () => void,
): StatusHeaderVariant {
  return {
    tone: 'brand',
    leadIcon: 'login',
    statusText: t('ctaMessage'),
    action: { label: t('loginOrSignup'), onClick: onSignIn },
    secondaryAction: { label: t('learnHow'), onClick: onLearnHow },
  }
}

// ─── P6–P8: Engagement rotation states ───────────────────────────────────────

export type EngagementCardType = 'pre-tournament-cta' | 'app-install' | 'notification-opt-in'

export interface EngagementVariantProps {
  /** pre-tournament-cta: number of games the user has already predicted (0 = fresh) */
  predictedGames?: number
  /** pre-tournament-cta: full href to games page with ?edit=EDIT_NEXT_TOKEN appended */
  gamesEditHref?: string
  /** pre-tournament-cta: callback to open the tutorial/onboarding dialog */
  onTutorial?: () => void
  /** app-install: callback to trigger the PWA install prompt */
  onInstall?: () => void
  /** app-install | notification-opt-in: callback to dismiss and hide this card */
  onDismiss?: () => void
  /** notification-opt-in: callback to request notification permission */
  onEnable?: () => void
}

/**
 * Maps an engagement card type (P6–P8) to a StatusHeaderVariant.
 * Uses `hub.newUser.*` and `hub.attentionWidget.*` translation keys.
 *
 * @param cardType - Which engagement card to render
 * @param t - Translation function bound to the 'hub' namespace
 * @param props - Card-specific callbacks and data
 */
export function computeEngagementVariant(
  cardType: EngagementCardType,
  t: TFunction,
  props: EngagementVariantProps,
): StatusHeaderVariant {
  switch (cardType) {
    case 'pre-tournament-cta': {
      const secondaryLabel =
        (props.predictedGames ?? 0) > 0
          ? t('newUser.tracks.matches.ctaKeep')
          : t('newUser.tracks.matches.cta')
      return {
        tone: 'brand',
        leadIcon: 'book',
        statusText: t('newUser.tutorial.title'),
        message: t('newUser.tutorial.subtitle'),
        action: { label: t('newUser.tutorial.cta'), onClick: props.onTutorial ?? (() => undefined) },
        secondaryAction: { label: secondaryLabel, href: props.gamesEditHref ?? '#' },
      }
    }

    case 'app-install':
      return {
        tone: 'brand',
        leadIcon: 'mobile',
        statusText: t('attentionWidget.appInstall.title'),
        message: t('attentionWidget.appInstall.subtitle'),
        action: { label: t('attentionWidget.appInstall.cta'), onClick: props.onInstall ?? (() => undefined) },
        secondaryAction: { label: t('attentionWidget.notificationOptIn.dismiss'), onClick: props.onDismiss ?? (() => undefined) },
      }

    case 'notification-opt-in':
      return {
        tone: 'brand',
        leadIcon: 'bell',
        statusText: t('attentionWidget.notificationOptIn.title'),
        message: t('attentionWidget.notificationOptIn.subtitle'),
        action: { label: t('attentionWidget.notificationOptIn.cta'), onClick: props.onEnable ?? (() => undefined) },
        secondaryAction: { label: t('attentionWidget.notificationOptIn.dismiss'), onClick: props.onDismiss ?? (() => undefined) },
      }
  }
}
