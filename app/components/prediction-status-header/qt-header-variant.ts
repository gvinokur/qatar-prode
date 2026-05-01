type TFunction = (key: string, values?: Record<string, unknown>) => string
import type { StatusHeaderVariant, StatusHeaderTone } from './types';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export interface QTHeaderInput {
  isLocked: boolean;
  /** Date when QT predictions lock (tournamentStartDate + PREDICTION_LOCK_OFFSET_MS) */
  qtLockAt: Date | null;
  predictedGroupGames: number;
  totalGroupGames: number;
  qualifiersCompleted: number;
  qualifiersTotal: number;
  /** How many qualifiers have an official result defined so far */
  definedSoFar: number;
  /** How many of the user's picks match actual results */
  correctSoFar: number;
  qtPointsEarned?: number;
  /** Called when user clicks Auto-completar — header will open internal dialog */
  onAutoFillClick: () => void;
  tournamentId: string;
  locale: string;
  /** Injectable for testing; defaults to new Date() */
  now?: Date;
}

/**
 * Maps time-to-lock to urgency tone. Thresholds are exclusive (strictly less than).
 */
export function computeQTLockUrgency(qtLockAt: Date, now: Date): StatusHeaderTone {
  const msUntilLock = qtLockAt.getTime() - now.getTime();
  if (msUntilLock < TWO_HOURS_MS) return 'deadlineNow';
  if (msUntilLock < TWENTY_FOUR_HOURS_MS) return 'deadlineUrgent';
  if (msUntilLock < FORTY_EIGHT_HOURS_MS) return 'deadlineSoon';
  return 'brand';
}

function urgencyIcon(tone: StatusHeaderTone): 'error' | 'warning' | 'info' | 'rocket' {
  if (tone === 'deadlineNow') return 'error';
  if (tone === 'deadlineUrgent') return 'warning';
  if (tone === 'deadlineSoon') return 'info';
  return 'rocket';
}

function countdownLabel(qtLockAt: Date, now: Date): string {
  const ms = qtLockAt.getTime() - now.getTime();
  if (ms <= 0) return '0m';
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / 60000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d`;
  }
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
}

/**
 * Computes the PredictionStatusHeader variant for the Qualified Teams page.
 * Priority: never-filled-locked → locked-with-results → locked-pending →
 *           completed-pre-lock → lock-window-urgent → pre-tournament-auto-fill-ready
 *           → pre-tournament-urgent → pre-tournament
 */
export function computeQTHeaderVariant(input: QTHeaderInput, t: TFunction): StatusHeaderVariant {
  const now = input.now ?? new Date();
  const {
    isLocked, qtLockAt, predictedGroupGames, totalGroupGames,
    qualifiersCompleted, qualifiersTotal, definedSoFar, correctSoFar,
    qtPointsEarned, onAutoFillClick, tournamentId, locale,
  } = input;

  const chip = {
    label: t('statusHeader.chipLabel.clasificados', {
      predicted: qualifiersCompleted,
      total: qualifiersTotal,
    }),
    color: 'default' as const,
  };

  // ── VARIANT 1: never-filled-locked ──────────────────────────────────────────
  if (isLocked && qualifiersCompleted === 0) {
    return {
      tone: 'locked',
      leadIcon: 'lock',
      statusText: t('statusHeader.qt.neverFilled.status'),
      message: t('statusHeader.qt.neverFilled.detail'),
    };
  }

  // ── VARIANT 2 + 3: locked states ────────────────────────────────────────────
  if (isLocked) {
    const allResultsDefined = definedSoFar >= qualifiersTotal && qualifiersTotal > 0;

    if (allResultsDefined) {
      // locked-with-results complete
      const pointsBadge = qtPointsEarned !== undefined ? `${qtPointsEarned} pts` : undefined;
      return {
        tone: 'locked',
        leadIcon: 'lock',
        statusText: t('statusHeader.qt.lockedComplete.status', {
          correct: correctSoFar,
          total: qualifiersTotal,
        }),
        pointsBadge,
        message: t('statusHeader.qt.lockedComplete.message'),
        action: { label: t('statusHeader.qt.lockedComplete.ctaStats'), href: `/${locale}/tournaments/${tournamentId}/stats` },
        secondaryAction: { label: t('statusHeader.qt.lockedComplete.ctaGroups'), href: `/${locale}/friend-groups` },
      };
    }

    if (definedSoFar === 0) {
      // locked-pending
      return {
        tone: 'locked',
        leadIcon: 'lock',
        statusText: t('statusHeader.qt.lockedPending.status'),
        chip,
      };
    }

    // locked-with-results partial
    return {
      tone: 'locked',
      leadIcon: 'lock',
      statusText: t('statusHeader.qt.lockedPartial.status', {
        correct: correctSoFar,
        total: qualifiersTotal,
      }),
      chip,
    };
  }

  // ── VARIANT 4: completed-pre-lock ───────────────────────────────────────────
  // Require group games to be complete — if user hasn't finished groups, don't show Recalcular
  const groupsComplete = totalGroupGames > 0 && predictedGroupGames >= totalGroupGames;
  const qtComplete = groupsComplete && qualifiersCompleted >= qualifiersTotal && qualifiersTotal > 0;
  if (qtComplete) {
    const countdown = qtLockAt ? countdownLabel(qtLockAt, now) : '—';
    return {
      tone: 'success',
      leadIcon: 'check',
      statusText: t('statusHeader.qt.completedPreLock.status', { countdown }),
      chip,
      action: {
        label: t('statusHeader.qt.completedPreLock.cta'),
        onClick: onAutoFillClick,
      },
    };
  }

  // ── VARIANT 5: lock-window-urgent ───────────────────────────────────────────
  const urgencyTone = qtLockAt ? computeQTLockUrgency(qtLockAt, now) : 'brand';
  const isUrgent = urgencyTone !== 'brand';

  if (isUrgent) {
    const countdown = qtLockAt ? countdownLabel(qtLockAt, now) : '—';
    return {
      tone: urgencyTone,
      leadIcon: urgencyIcon(urgencyTone),
      statusText: t('statusHeader.qt.lockWindowUrgent.status', { countdown }),
      chip,
      message: t('statusHeader.qt.lockWindowUrgent.message', { countdown }),
      action: {
        label: t('statusHeader.qt.lockWindowUrgent.cta'),
        onClick: onAutoFillClick,
      },
    };
  }

  // ── VARIANT 6: pre-tournament-auto-fill-ready ────────────────────────────────
  const groupsAllPredicted = predictedGroupGames >= totalGroupGames && totalGroupGames > 0;
  if (groupsAllPredicted) {
    return {
      tone: 'brand',
      leadIcon: 'rocket',
      statusText: t('statusHeader.qt.autoFillReady.status'),
      chip,
      message: t('statusHeader.qt.autoFillReady.message', { total: qualifiersTotal }),
      action: {
        label: t('statusHeader.qt.autoFillReady.cta'),
        onClick: onAutoFillClick,
      },
    };
  }

  // ── VARIANT 7+8: pre-tournament (with or without urgency) ───────────────────
  return {
    tone: 'brand',
    leadIcon: 'rocket',
    statusText: t('statusHeader.qt.preTournament.status'),
    chip,
    message: t('statusHeader.qt.preTournament.message'),
    action: {
      label: t('statusHeader.qt.preTournament.cta'),
      href: `/${locale}/tournaments/${tournamentId}/games?edit=next`,
    },
  };
}
