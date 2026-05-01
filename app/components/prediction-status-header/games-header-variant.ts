type TFunction = (key: string, values?: Record<string, unknown>) => string
import type { ExtendedGameData } from '../../definitions';
import type { Team, GameGuess, TournamentPredictionCompletion, PlayoffRoundCompletionData } from '../../db/tables-definition';
import type { StatusHeaderVariant } from './types';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export interface GamesHeaderInput {
  completion: TournamentPredictionCompletion;
  /** All games for the tournament — used by deriveStageLabel for date-based phase detection */
  games: ExtendedGameData[];
  /** Games closing within 48h — already filtered by the page */
  urgentGames: ExtendedGameData[];
  gameGuesses: Record<string, GameGuess>;
  teamsMap: Record<string, Team>;
  tournamentId: string;
  gamePointsEarned?: number;
  locale: string;
  /** Injectable for testing; defaults to new Date() */
  now?: Date;
}

type UrgencyLevel = 'deadlineNow' | 'deadlineUrgent' | 'deadlineSoon';

function getGameUrgencyLevel(game: ExtendedGameData, now: Date): UrgencyLevel {
  const msUntilStart = new Date(game.game_date).getTime() - now.getTime();
  if (msUntilStart < TWO_HOURS_MS) return 'deadlineNow';
  if (msUntilStart < TWENTY_FOUR_HOURS_MS) return 'deadlineUrgent';
  return 'deadlineSoon';
}

/**
 * Returns countdown label like "< 2h" / "< 24h" / "< 48h" for a given urgency level
 */
function urgencyWindow(level: UrgencyLevel): string {
  if (level === 'deadlineNow') return '< 2h';
  if (level === 'deadlineUrgent') return '< 24h';
  return '< 48h';
}

/**
 * Returns text "N partidos hoy/mañana/en D días" for the next batch of upcoming games.
 */
export function getNextBatchSummary(games: ExtendedGameData[], now: Date, t: TFunction): string {
  const upcoming = games
    .filter(g => new Date(g.game_date).getTime() > now.getTime())
    .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime());

  if (upcoming.length === 0) return '';

  const earliest = new Date(upcoming[0].game_date);
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(earliest.getFullYear(), earliest.getMonth(), earliest.getDate());
  const diffDays = Math.round((targetDate.getTime() - nowDate.getTime()) / (24 * 60 * 60 * 1000));

  // Count games on the same day as earliest
  const sameDay = upcoming.filter(g => {
    const d = new Date(g.game_date);
    return d.getFullYear() === earliest.getFullYear() &&
      d.getMonth() === earliest.getMonth() &&
      d.getDate() === earliest.getDate();
  });
  const count = sameDay.length;

  if (diffDays === 0) {
    return t('statusHeader.games.stageActive.statusToday', { count });
  }
  if (diffDays === 1) {
    return t('statusHeader.games.stageActive.statusTomorrow', { count });
  }
  return t('statusHeader.games.stageActive.statusDays', { count, days: diffDays });
}

interface StageBucket {
  label: string;
  startDate: Date;
  maxDate: Date;
}

/**
 * Derives the current tournament stage label from game dates using the interval model.
 * Final + Third-place games (identified by playoffStage.is_final / is_third_place) are merged
 * into one "Finals" bucket labeled with the Final round's round_name.
 */
export function deriveStageLabel(games: ExtendedGameData[], now: Date): string | undefined {
  if (games.length === 0) return undefined;

  // Separate group games and playoff games
  const groupGames = games.filter(g => !g.playoffStage);
  const playoffGames = games.filter(g => !!g.playoffStage);

  if (groupGames.length === 0 && playoffGames.length === 0) return undefined;

  // Build per-round buckets for playoff games (merge Final+Third-place)
  const roundBuckets = new Map<string, { label: string; dates: Date[]; isFinal: boolean; isThirdPlace: boolean }>();

  let finalLabel: string | undefined;

  for (const game of playoffGames) {
    const stage = game.playoffStage!;
    const key = stage.is_final || stage.is_third_place ? '__finals__' : stage.tournament_playoff_round_id;
    if (!roundBuckets.has(key)) {
      roundBuckets.set(key, {
        label: stage.round_name,
        dates: [],
        isFinal: stage.is_final,
        isThirdPlace: stage.is_third_place,
      });
    }
    if (stage.is_final) finalLabel = stage.round_name;
    roundBuckets.get(key)!.dates.push(new Date(game.game_date));
  }

  // If finals bucket exists, use Final round's label
  if (finalLabel && roundBuckets.has('__finals__')) {
    roundBuckets.get('__finals__')!.label = finalLabel;
  }

  // Sort playoff buckets by their maxDate ascending (approximates round order)
  const sortedPlayoffBuckets = Array.from(roundBuckets.values()).sort(
    (a, b) => Math.max(...a.dates.map(d => d.getTime())) - Math.max(...b.dates.map(d => d.getTime()))
  );

  // Build ordered stage list
  const buckets: StageBucket[] = [];

  if (groupGames.length > 0) {
    const dates = groupGames.map(g => new Date(g.game_date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    buckets.push({ label: 'Grupos', startDate: minDate, maxDate });
  }

  for (const bucket of sortedPlayoffBuckets) {
    const prevMaxDate = buckets.length > 0 ? buckets[buckets.length - 1].maxDate : new Date(0);
    const maxDate = new Date(Math.max(...bucket.dates.map(d => d.getTime())));
    buckets.push({ label: bucket.label, startDate: prevMaxDate, maxDate });
  }

  if (buckets.length === 0) return undefined;

  const firstBucket = buckets[0];
  const lastBucket = buckets[buckets.length - 1];

  // Pre-tournament: before first group game
  if (now.getTime() < firstBucket.startDate.getTime()) return firstBucket.label;

  // Post-tournament: after last stage's maxDate
  if (now.getTime() > lastBucket.maxDate.getTime()) return 'Finalizado';

  // Find current bucket: startDate <= now <= maxDate
  for (const bucket of buckets) {
    if (now.getTime() >= bucket.startDate.getTime() && now.getTime() <= bucket.maxDate.getTime()) {
      return bucket.label;
    }
  }

  return lastBucket.label;
}

/**
 * Merges Final and Third-place rounds into one "Finals" chip slot using is_final/is_third_place flags.
 */
export function collapsePlayoffDenominator(
  playoffRoundsCompletion: Record<string, PlayoffRoundCompletionData>
): Record<string, PlayoffRoundCompletionData> {
  const result: Record<string, PlayoffRoundCompletionData> = {};
  let finalKey: string | undefined;
  let thirdKey: string | undefined;

  for (const [id, data] of Object.entries(playoffRoundsCompletion)) {
    if (data.is_final) finalKey = id;
    else if (data.is_third_place) thirdKey = id;
    else result[id] = data;
  }

  if (!finalKey) return result;

  const finalData = playoffRoundsCompletion[finalKey];
  if (thirdKey) {
    const thirdData = playoffRoundsCompletion[thirdKey];
    result[finalKey] = {
      ...finalData,
      total: finalData.total + thirdData.total,
      completed: finalData.completed + thirdData.completed,
    };
  } else {
    result[finalKey] = finalData;
  }

  return result;
}

/**
 * Computes the PredictionStatusHeader variant for the Games page.
 * Priority: tournament-finished → urgent-unpredicted → pre-groups-complete-nudge-qt
 *           → pre-tournament → stage-active-caught-up
 */
export function computeGamesHeaderVariant(input: GamesHeaderInput, t: TFunction): StatusHeaderVariant {
  const now = input.now ?? new Date();
  const { completion, games, urgentGames, gameGuesses, teamsMap, tournamentId, gamePointsEarned, locale } = input;

  const stageLabel = deriveStageLabel(games, now);
  const hasBoosts = (completion.silverBoostsMax > 0) || (completion.goldenBoostsMax > 0);
  const boosts = hasBoosts ? {
    silverUsed: completion.silverBoostsUsed,
    silverMax: completion.silverBoostsMax,
    goldenUsed: completion.goldenBoostsUsed,
    goldenMax: completion.goldenBoostsMax,
  } : undefined;

  const collapsedRounds = collapsePlayoffDenominator(completion.playoffRoundsCompletion);
  const roundChipParts = Object.values(collapsedRounds).map(r => `${r.completed}/${r.total}`);
  const roundChipLabel = roundChipParts.join(' · ');

  // ── VARIANT 1: tournament-finished ──────────────────────────────────────────
  const allGamesHaveResults = completion.completedGames > 0 && completion.completedGames >= completion.totalGames && games.every(g => new Date(g.game_date).getTime() < now.getTime());
  if (allGamesHaveResults) {
    const pts = gamePointsEarned !== undefined ? ` · ${gamePointsEarned} pts` : '';
    return {
      tone: 'locked',
      stageLabel: 'Finalizado',
      leadIcon: 'lock',
      statusText: t('statusHeader.games.finished.status', {
        correct: completion.completedGames,
        total: completion.totalGames,
      }),
      pointsBadge: gamePointsEarned !== undefined ? `${gamePointsEarned} pts` : undefined,
      message: t('statusHeader.games.finished.message') + pts,
      action: { label: t('statusHeader.games.finished.ctaStats'), href: `/${locale}/tournaments/${tournamentId}/stats` },
      secondaryAction: { label: t('statusHeader.games.finished.ctaGroups'), href: `/${locale}/friend-groups` },
    };
  }

  // ── VARIANT 2: urgent-unpredicted ───────────────────────────────────────────
  const unpredictedUrgentGames = urgentGames.filter(g => {
    const guess = gameGuesses[g.id];
    return !guess || guess.home_score == null || guess.away_score == null;
  });

  if (unpredictedUrgentGames.length > 0) {
    // Determine highest urgency level
    const levels = unpredictedUrgentGames.map(g => getGameUrgencyLevel(g, now));
    const tone = levels.includes('deadlineNow') ? 'deadlineNow'
      : levels.includes('deadlineUrgent') ? 'deadlineUrgent'
      : 'deadlineSoon';

    const window = urgencyWindow(tone);
    const count = unpredictedUrgentGames.length;

    // Build inline matchup list for message (team names from teamsMap; home_team is a team ID)
    const matchups = unpredictedUrgentGames.slice(0, 3).map(g => {
      const home = teamsMap[g.home_team ?? '']?.name ?? '?';
      const away = teamsMap[g.away_team ?? '']?.name ?? '?';
      return `${home} vs ${away}`;
    });
    if (unpredictedUrgentGames.length > 3) matchups.push(`+${unpredictedUrgentGames.length - 3}`);
    const message = matchups.join(' · ');

    const firstGame = unpredictedUrgentGames[0];
    const ctaLabel = count === 1
      ? t('statusHeader.games.urgentUnpredicted.ctaSingle')
      : t('statusHeader.games.urgentUnpredicted.ctaMultiple');

    const chipColor = tone === 'deadlineNow' ? 'error' : tone === 'deadlineUrgent' ? 'warning' : 'info';
    return {
      tone,
      stageLabel,
      leadIcon: 'info',
      statusText: t('statusHeader.games.urgentUnpredicted.status', { count, window }),
      chip: {
        label: t('statusHeader.chipLabel.partidos', {
          predicted: completion.completedGames,
          total: completion.totalGames,
        }),
        color: chipColor,
      },
      boosts,
      message,
      action: {
        label: ctaLabel,
        href: `/${locale}/tournaments/${tournamentId}/games?game=${firstGame.id}`,
      },
    };
  }

  // ── VARIANT 3: pre-groups-complete-nudge-qt ─────────────────────────────────
  const groupsComplete = completion.completedGroupGames >= completion.totalGroupGames && completion.totalGroupGames > 0;
  const qtOpen = !completion.isPredictionLocked;
  const qtIncomplete = completion.qualifiers.completed < completion.qualifiers.total;

  if (groupsComplete && qtOpen && qtIncomplete) {
    return {
      tone: 'success',
      stageLabel,
      leadIcon: 'check',
      statusText: t('statusHeader.games.nudgeQT.status', {
        countdown: '—', // no live countdown available at static render time
      }),
      boosts,
      message: t('statusHeader.games.nudgeQT.message'),
      action: {
        label: t('statusHeader.games.nudgeQT.cta'),
        href: `/${locale}/tournaments/${tournamentId}/qualified-teams`,
      },
    };
  }

  // ── VARIANT 4: pre-tournament ───────────────────────────────────────────────
  const tournamentNotStarted = games.length > 0 && games.every(g => new Date(g.game_date).getTime() > now.getTime());
  if (tournamentNotStarted) {
    const firstGame = games.reduce((a, b) => new Date(a.game_date) < new Date(b.game_date) ? a : b);
    const daysUntil = Math.ceil((new Date(firstGame.game_date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    const predicted = completion.completedGroupGames;
    let ctaLabel: string;
    if (predicted === 0) {
      ctaLabel = t('statusHeader.games.preTournament.ctaStart');
    } else if (predicted >= completion.totalGroupGames) {
      ctaLabel = t('statusHeader.games.preTournament.ctaFinish');
    } else {
      ctaLabel = t('statusHeader.games.preTournament.ctaContinue');
    }

    return {
      tone: 'brand',
      stageLabel: 'Grupos',
      leadIcon: 'rocket',
      statusText: t('statusHeader.games.preTournament.status', { days: daysUntil }),
      chip: {
        label: t('statusHeader.chipLabel.partidos', {
          predicted: completion.completedGroupGames,
          total: completion.totalGroupGames,
        }),
        color: 'default',
      },
      boosts,
      message: t('statusHeader.games.preTournament.message'),
      action: {
        label: ctaLabel,
        href: `/${locale}/tournaments/${tournamentId}/games?edit=next`,
      },
    };
  }

  // ── VARIANT 5: stage-active-caught-up ──────────────────────────────────────
  const nextBatchText = getNextBatchSummary(games, now, t);
  const allPredicted = completion.completedGames >= completion.totalGames && completion.totalGames > 0;

  return {
    tone: 'calm',
    stageLabel,
    leadIcon: 'check',
    statusColor: 'success.main',
    statusText: nextBatchText,
    chip: {
      label: t('statusHeader.chipLabel.partidos', {
        predicted: completion.completedGames,
        total: completion.totalGames,
      }),
      color: allPredicted ? 'success' : 'default',
    },
    boosts,
  };
}
