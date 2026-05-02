type TFunction = (key: string, values?: Record<string, unknown>) => string
import type { ExtendedGameData } from '../../definitions';
import type { Team, GameGuess, TournamentPredictionCompletion, PlayoffRoundCompletionData } from '../../db/tables-definition';
import type { StatusHeaderVariant, StatusHeaderTone } from './types';
import { isGuessComplete } from '../../utils/guess-utils';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export interface GamesHeaderInput {
  completion: TournamentPredictionCompletion;
  /** All games for the tournament */
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

// ─── Urgency helpers ────────────────────────────────────────────────────────

type UrgencyLevel = 'deadlineNow' | 'deadlineUrgent' | 'deadlineSoon';

function getGameUrgencyLevel(game: ExtendedGameData, now: Date): UrgencyLevel {
  const msUntilStart = new Date(game.game_date).getTime() - now.getTime();
  if (msUntilStart < TWO_HOURS_MS) return 'deadlineNow';
  if (msUntilStart < TWENTY_FOUR_HOURS_MS) return 'deadlineUrgent';
  return 'deadlineSoon';
}

function urgencyWindow(level: UrgencyLevel): string {
  if (level === 'deadlineNow') return '< 2h';
  if (level === 'deadlineUrgent') return '< 24h';
  return '< 48h';
}

// ─── Stage label ─────────────────────────────────────────────────────────────

interface StageWindow {
  label: string;
  minDate: number;
  maxDate: number;
}

/** Groups games into stage windows sorted by first kickoff. */
function buildStageWindows(games: ExtendedGameData[]): StageWindow[] {
  type Bucket = { label: string; dates: number[] };
  const map = new Map<string, Bucket>();

  const bucket = (key: string, label: string): Bucket => {
    if (!map.has(key)) map.set(key, { label, dates: [] });
    return map.get(key)!;
  };

  for (const game of games) {
    const ts = new Date(game.game_date).getTime();

    if (!game.playoffStage) {
      bucket('__groups__', 'Grupos').dates.push(ts);
    } else {
      const { is_final, is_third_place, tournament_playoff_round_id, round_name } = game.playoffStage;
      const key = (is_final || is_third_place) ? '__finals__' : tournament_playoff_round_id;
      const b = bucket(key, round_name);
      b.dates.push(ts);
      // Final round name takes priority — third-place game may be encountered first
      if (is_final) b.label = round_name;
    }
  }

  return Array.from(map.values())
    .map(({ label, dates }) => ({
      label,
      minDate: Math.min(...dates),
      maxDate: Math.max(...dates),
    }))
    .sort((a, b) => a.minDate - b.minDate);
}

/**
 * Derives the current tournament stage label from game kickoff dates.
 * Returns the first stage whose maxDate is still >= now, or 'Finalizado' if all are past.
 */
export function deriveStageLabel(games: ExtendedGameData[], now: Date): string | undefined {
  if (games.length === 0) return undefined;

  const stages = buildStageWindows(games);
  if (stages.length === 0) return undefined;

  const nowMs = now.getTime();
  const first = stages[0];
  const last = stages[stages.length - 1];

  if (nowMs < first.minDate) return first.label;   // pre-tournament
  if (nowMs > last.maxDate) return 'Finalizado';   // post-tournament

  return stages.find(s => nowMs <= s.maxDate)?.label ?? last.label;
}

// ─── Next-batch summary ──────────────────────────────────────────────────────

export function getNextBatchSummary(games: ExtendedGameData[], now: Date, t: TFunction): string {
  const upcoming = games
    .filter(g => new Date(g.game_date).getTime() > now.getTime())
    .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime());

  if (upcoming.length === 0) return '';

  const earliest = new Date(upcoming[0].game_date);
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(earliest.getFullYear(), earliest.getMonth(), earliest.getDate());
  const diffDays = Math.round((targetDate.getTime() - nowDate.getTime()) / (24 * 60 * 60 * 1000));

  const sameDay = upcoming.filter(g => {
    const d = new Date(g.game_date);
    return d.getFullYear() === earliest.getFullYear() &&
      d.getMonth() === earliest.getMonth() &&
      d.getDate() === earliest.getDate();
  });
  const count = sameDay.length;

  if (diffDays === 0) return t('statusHeader.games.stageActive.statusToday', { count });
  if (diffDays === 1) return t('statusHeader.games.stageActive.statusTomorrow', { count });
  return t('statusHeader.games.stageActive.statusDays', { count, days: diffDays });
}

// ─── Playoff denominator collapse ────────────────────────────────────────────

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

// ─── Data preparation ────────────────────────────────────────────────────────

type GamesVariantType =
  | 'tournament-finished'
  | 'urgent-unpredicted'
  | 'nudge-qt'
  | 'pre-tournament'
  | 'stage-active-caught-up';

interface GamesHeaderData {
  stageLabel: string | undefined;
  boosts: StatusHeaderVariant['boosts'];
  liveCompletedGames: number;
  groupGames: ExtendedGameData[];
  liveCompletedGroupGames: number;
  isGroupStagePrimary: boolean;
  stageChipPredicted: number;
  stageChipTotal: number;
  groupsComplete: boolean;
  qtOpen: boolean;
  qtIncomplete: boolean;
  allGamesHaveResults: boolean;
  unpredictedUrgentGames: ExtendedGameData[];
  tournamentNotStarted: boolean;
}

function prepareData(input: GamesHeaderInput, now: Date): GamesHeaderData {
  const { completion, games, urgentGames, gameGuesses } = input;

  const stageLabel = deriveStageLabel(games, now);

  const groupGames = games.filter(g => !g.playoffStage);
  const liveCompletedGroupGames = groupGames.filter(g => isGuessComplete(gameGuesses[g.id], false)).length;
  const liveCompletedGames = games.filter(g => isGuessComplete(gameGuesses[g.id], !!g.playoffStage)).length;

  const isGroupStagePrimary = stageLabel === 'Grupos';
  const stageChipPredicted = isGroupStagePrimary ? liveCompletedGroupGames : liveCompletedGames;
  const stageChipTotal = isGroupStagePrimary ? completion.totalGroupGames : completion.totalGames;

  const hasBoosts = completion.silverBoostsMax > 0 || completion.goldenBoostsMax > 0;
  const liveBoostCounts = Object.values(gameGuesses).reduce(
    (acc, g) => {
      if (g.boost_type === 'silver') acc.silverUsed++;
      if (g.boost_type === 'golden') acc.goldenUsed++;
      return acc;
    },
    { silverUsed: 0, goldenUsed: 0 }
  );
  const boosts = hasBoosts ? {
    silverUsed: liveBoostCounts.silverUsed,
    silverMax: completion.silverBoostsMax,
    goldenUsed: liveBoostCounts.goldenUsed,
    goldenMax: completion.goldenBoostsMax,
  } : undefined;

  const allGamesHaveResults = completion.completedGames > 0
    && completion.completedGames >= completion.totalGames
    && games.every(g => new Date(g.game_date).getTime() < now.getTime());

  const unpredictedUrgentGames = urgentGames.filter(
    g => !isGuessComplete(gameGuesses[g.id], !!g.playoffStage)
  );

  const groupsComplete = liveCompletedGroupGames >= completion.totalGroupGames && completion.totalGroupGames > 0;
  const qtOpen = !completion.isPredictionLocked;
  const qtIncomplete = completion.qualifiers.completed < completion.qualifiers.total;

  const tournamentNotStarted = games.length > 0
    && games.every(g => new Date(g.game_date).getTime() > now.getTime());

  return {
    stageLabel,
    boosts,
    liveCompletedGames,
    groupGames,
    liveCompletedGroupGames,
    isGroupStagePrimary,
    stageChipPredicted,
    stageChipTotal,
    groupsComplete,
    qtOpen,
    qtIncomplete,
    allGamesHaveResults,
    unpredictedUrgentGames,
    tournamentNotStarted,
  };
}

// ─── Variant selector ────────────────────────────────────────────────────────

function selectVariant(data: GamesHeaderData): GamesVariantType {
  if (data.allGamesHaveResults) return 'tournament-finished';
  if (data.unpredictedUrgentGames.length > 0) return 'urgent-unpredicted';
  if (data.groupsComplete && data.qtOpen && data.qtIncomplete) return 'nudge-qt';
  if (data.tournamentNotStarted) return 'pre-tournament';
  return 'stage-active-caught-up';
}

// ─── Per-variant builders ────────────────────────────────────────────────────

function buildFinished(input: GamesHeaderInput, data: GamesHeaderData, t: TFunction): StatusHeaderVariant {
  const { completion, locale, tournamentId, gamePointsEarned } = input;
  return {
    tone: 'locked',
    stageLabel: 'Finalizado',
    leadIcon: 'lock',
    statusText: t('statusHeader.games.finished.status', {
      correct: completion.completedGames,
      total: completion.totalGames,
    }),
    pointsBadge: gamePointsEarned !== undefined ? `${gamePointsEarned} pts` : undefined,
    message: t('statusHeader.games.finished.message'),
    action: { label: t('statusHeader.games.finished.ctaStats'), href: `/${locale}/tournaments/${tournamentId}/stats` },
    secondaryAction: { label: t('statusHeader.games.finished.ctaGroups'), href: `/${locale}/friend-groups` },
  };
}

function buildUrgentUnpredicted(input: GamesHeaderInput, data: GamesHeaderData, t: TFunction): StatusHeaderVariant {
  const { unpredictedUrgentGames, stageLabel, stageChipPredicted, stageChipTotal, boosts } = data;
  const { teamsMap, locale, tournamentId } = input;

  const levels = unpredictedUrgentGames.map(g => getGameUrgencyLevel(g, input.now ?? new Date()));
  const tone: StatusHeaderTone = levels.includes('deadlineNow') ? 'deadlineNow'
    : levels.includes('deadlineUrgent') ? 'deadlineUrgent'
    : 'deadlineSoon';

  const count = unpredictedUrgentGames.length;
  const window = urgencyWindow(tone as UrgencyLevel);

  const matchups = unpredictedUrgentGames.slice(0, 3).map(g => {
    const home = teamsMap[g.home_team ?? '']?.name ?? '?';
    const away = teamsMap[g.away_team ?? '']?.name ?? '?';
    return `${home} vs ${away}`;
  });
  if (count > 3) matchups.push(`+${count - 3}`);

  const chipColor = tone === 'deadlineNow' ? 'error' : tone === 'deadlineUrgent' ? 'warning' : 'info';

  return {
    tone,
    stageLabel,
    leadIcon: 'info',
    statusText: t('statusHeader.games.urgentUnpredicted.status', { count, window }),
    chip: {
      label: t('statusHeader.chipLabel.partidos', { predicted: stageChipPredicted, total: stageChipTotal }),
      color: chipColor,
    },
    boosts,
    message: matchups.join(' · '),
    action: {
      label: count === 1
        ? t('statusHeader.games.urgentUnpredicted.ctaSingle')
        : t('statusHeader.games.urgentUnpredicted.ctaMultiple'),
      href: `/${locale}/tournaments/${tournamentId}/games?edit=${unpredictedUrgentGames[0].id}`,
    },
  };
}

function buildNudgeQT(input: GamesHeaderInput, data: GamesHeaderData, t: TFunction): StatusHeaderVariant {
  const { locale, tournamentId } = input;
  return {
    tone: 'success',
    stageLabel: data.stageLabel,
    leadIcon: 'check',
    statusText: t('statusHeader.games.nudgeQT.status', { countdown: '—' }),
    boosts: data.boosts,
    message: t('statusHeader.games.nudgeQT.message'),
    action: {
      label: t('statusHeader.games.nudgeQT.cta'),
      href: `/${locale}/tournaments/${tournamentId}/qualified-teams`,
    },
  };
}

function buildPreTournament(input: GamesHeaderInput, data: GamesHeaderData, t: TFunction, now: Date): StatusHeaderVariant {
  const { completion, games, locale, tournamentId } = input;
  const { liveCompletedGroupGames, boosts } = data;

  const firstGame = games.reduce((a, b) => new Date(a.game_date) < new Date(b.game_date) ? a : b);
  const daysUntil = Math.ceil((new Date(firstGame.game_date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  let ctaLabel: string;
  if (liveCompletedGroupGames === 0) {
    ctaLabel = t('statusHeader.games.preTournament.ctaStart');
  } else if (liveCompletedGroupGames >= completion.totalGroupGames) {
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
        predicted: liveCompletedGroupGames,
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

function buildStageActive(input: GamesHeaderInput, data: GamesHeaderData, t: TFunction, now: Date): StatusHeaderVariant {
  const { stageLabel, stageChipPredicted, stageChipTotal, boosts } = data;
  const nextBatchText = getNextBatchSummary(input.games, now, t);
  const allPredicted = stageChipTotal > 0 && stageChipPredicted >= stageChipTotal;

  return {
    tone: 'calm',
    stageLabel,
    leadIcon: 'check',
    statusColor: 'success.main',
    statusText: nextBatchText,
    chip: {
      label: t('statusHeader.chipLabel.partidos', { predicted: stageChipPredicted, total: stageChipTotal }),
      color: allPredicted ? 'success' : 'default',
    },
    boosts,
  };
}

// ─── Public entry point ──────────────────────────────────────────────────────

/**
 * Computes the PredictionStatusHeader variant for the Games page.
 * Priority: tournament-finished → urgent-unpredicted → nudge-qt → pre-tournament → stage-active-caught-up
 */
export function computeGamesHeaderVariant(input: GamesHeaderInput, t: TFunction): StatusHeaderVariant {
  const now = input.now ?? new Date();
  const data = prepareData(input, now);
  const variant = selectVariant(data);

  switch (variant) {
    case 'tournament-finished':    return buildFinished(input, data, t);
    case 'urgent-unpredicted':     return buildUrgentUnpredicted(input, data, t);
    case 'nudge-qt':               return buildNudgeQT(input, data, t);
    case 'pre-tournament':         return buildPreTournament(input, data, t, now);
    case 'stage-active-caught-up': return buildStageActive(input, data, t, now);
  }
}
