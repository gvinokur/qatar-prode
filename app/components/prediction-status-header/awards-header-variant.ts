type TFunction = (key: string, values?: Record<string, unknown>) => string
import type { StatusHeaderVariant, StatusHeaderTone } from './types';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export interface AwardsHeaderInput {
  isLocked: boolean;
  /** Date when awards predictions lock */
  awardsLockAt: Date | null;
  awardsCompleted: number;
  awardsTotal: number;
  /** How many individual awards have an official result decided */
  decidedSoFar: number;
  /** How many of the user's picks match actual results */
  correctSoFar: number;
  awardsPointsEarned?: number;
  tournamentId: string;
  locale: string;
  /** Injectable for testing; defaults to new Date() */
  now?: Date;
}

function computeAwardsUrgencyTone(awardsLockAt: Date, now: Date): StatusHeaderTone {
  const msUntilLock = awardsLockAt.getTime() - now.getTime();
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

function countdownLabel(lockAt: Date, now: Date): string {
  const ms = lockAt.getTime() - now.getTime();
  if (ms <= 0) return '0m';
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
}

/**
 * Returns action label: "Definir" at 0 picks, "Finalizar" at N-1 or complete, "Continuar" otherwise.
 */
export function computeAwardsActionLabel(awardsCompleted: number, awardsTotal: number, t: TFunction): string {
  if (awardsCompleted === 0) return t('statusHeader.awards.preTournament.ctaStart');
  if (awardsCompleted >= awardsTotal - 1) return t('statusHeader.awards.preTournament.ctaFinish');
  return t('statusHeader.awards.preTournament.ctaContinue');
}

/**
 * Computes the PredictionStatusHeader variant for the Awards page.
 * Priority: never-filled-locked → locked-with-results → locked-pending →
 *           completed-pre-lock → pre-tournament (with urgency modifiers)
 */
export function computeAwardsHeaderVariant(input: AwardsHeaderInput, t: TFunction): StatusHeaderVariant {
  const now = input.now ?? new Date();
  const {
    isLocked, awardsLockAt, awardsCompleted, awardsTotal,
    decidedSoFar, correctSoFar, awardsPointsEarned, tournamentId, locale,
  } = input;

  const chip = {
    label: t('statusHeader.chipLabel.premios', {
      predicted: awardsCompleted,
      total: awardsTotal,
    }),
    color: 'default' as const,
  };

  // ── VARIANT 1: never-filled-locked ──────────────────────────────────────────
  if (isLocked && awardsCompleted === 0) {
    return {
      tone: 'locked',
      leadIcon: 'lock',
      statusText: t('statusHeader.awards.neverFilled.status'),
      message: t('statusHeader.awards.neverFilled.detail'),
    };
  }

  // ── VARIANT 2 + 3: locked states ────────────────────────────────────────────
  if (isLocked) {
    const allDecided = decidedSoFar >= awardsTotal && awardsTotal > 0;

    if (allDecided) {
      const pointsBadge = awardsPointsEarned !== undefined ? `${awardsPointsEarned} pts` : undefined;
      return {
        tone: 'locked',
        leadIcon: 'lock',
        statusText: t('statusHeader.awards.lockedComplete.status', {
          correct: correctSoFar,
          total: awardsTotal,
        }),
        pointsBadge,
        message: t('statusHeader.awards.lockedComplete.message'),
        action: { label: t('statusHeader.awards.lockedComplete.ctaStats'), href: `/${locale}/tournaments/${tournamentId}/stats` },
        secondaryAction: { label: t('statusHeader.awards.lockedComplete.ctaGroups'), href: `/${locale}/friend-groups` },
      };
    }

    if (decidedSoFar === 0) {
      return {
        tone: 'locked',
        leadIcon: 'lock',
        statusText: t('statusHeader.awards.lockedPending.status'),
        chip,
      };
    }

    return {
      tone: 'locked',
      leadIcon: 'lock',
      statusText: t('statusHeader.awards.lockedPartial.status', {
        correct: correctSoFar,
        total: awardsTotal,
      }),
      chip,
    };
  }

  // ── VARIANT 4: completed-pre-lock ───────────────────────────────────────────
  const awardsComplete = awardsCompleted >= awardsTotal && awardsTotal > 0;
  if (awardsComplete) {
    const countdown = awardsLockAt ? countdownLabel(awardsLockAt, now) : '—';
    return {
      tone: 'success',
      leadIcon: 'check',
      statusText: t('statusHeader.awards.completedPreLock.status', { countdown }),
      chip,
    };
  }

  // ── VARIANT 5: pre-tournament (with urgency modifiers) ──────────────────────
  const tone: StatusHeaderTone = awardsLockAt ? computeAwardsUrgencyTone(awardsLockAt, now) : 'brand';
  const ctaLabel = computeAwardsActionLabel(awardsCompleted, awardsTotal, t);

  return {
    tone,
    leadIcon: urgencyIcon(tone),
    statusText: t('statusHeader.awards.preTournament.status', {
      countdown: awardsLockAt ? countdownLabel(awardsLockAt, now) : '—',
    }),
    chip,
    message: t('statusHeader.awards.preTournament.message'),
    action: {
      label: ctaLabel,
      href: `/${locale}/tournaments/${tournamentId}/awards`,
    },
  };
}
