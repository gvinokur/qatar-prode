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

// ─── Stage windows ───────────────────────────────────────────────────────────

interface StageWindow {
  key: string;
  label: string;
  minDate: number;
  maxDate: number;
}

/** Groups games into stage windows sorted by first kickoff. */
function buildStageWindows(games: ExtendedGameData[]): StageWindow[] {
  type Bucket = { label: string; minDate: number; maxDate: number };
  const stageMap = games.reduce((map, game) => {
    const ts = new Date(game.game_date).getTime();
    let key: string;
    let label: string;

    if (game.playoffStage) {
      const { is_final, is_third_place, tournament_playoff_round_id, round_name } = game.playoffStage;
      key = (is_final || is_third_place) ? '__finals__' : tournament_playoff_round_id;
      label = round_name;
    } else {
      key = '__groups__';
      label = 'Grupos';
    }

    const existing = map.get(key);
    if (existing) {
      existing.minDate = Math.min(existing.minDate, ts);
      existing.maxDate = Math.max(existing.maxDate, ts);
      // Final round name takes priority over third-place for the __finals__ bucket
      if (game.playoffStage?.is_final) existing.label = label;
    } else {
      map.set(key, { label, minDate: ts, maxDate: ts });
    }
    return map;
  }, new Map<string, Bucket>());

  return Array.from(stageMap.entries())
    .map(([key, w]) => ({ key, ...w }))
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

  if (nowMs > stages.at(-1)!.maxDate) return 'Finalizado';

  // Safe non-null: we know nowMs <= last.maxDate, so find always matches
  return stages.find(s => nowMs <= s.maxDate)!.label;
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
  const entries = Object.entries(playoffRoundsCompletion);
  const third = entries.find(([, d]) => d.is_third_place)?.[1];

  return entries.reduce((acc, [id, data]) => {
    if (data.is_third_place) return acc; // absorbed into the final entry
    acc[id] = data.is_final && third
      ? { ...data, total: data.total + third.total, completed: data.completed + third.completed }
      : data;
    return acc;
  }, {} as Record<string, PlayoffRoundCompletionData>);
}

// ─── Data preparation ────────────────────────────────────────────────────────

type GamesVariantType =
  | 'tournament-finished'
  | 'urgent-unpredicted'
  | 'nudge-qt'
  | 'groups-complete'
  | 'pre-tournament'
  | 'stage-active-caught-up';

interface GamesHeaderData {
  stageLabel: string | undefined;
  boosts: StatusHeaderVariant['boosts'];
  liveCompletedGames: number;
  liveCompletedGroupGames: number;
  stageChipPredicted: number;
  stageChipTotal: number;
  groupsComplete: boolean;
  qtOpen: boolean;
  qtIncomplete: boolean;
  allGamesHaveResults: boolean;
  unpredictedUrgentGames: ExtendedGameData[];
  tournamentNotStarted: boolean;
}

function computeStageChip(
  stages: StageWindow[],
  games: ExtendedGameData[],
  gameGuesses: Record<string, GameGuess>,
  completion: TournamentPredictionCompletion,
  liveCompletedGroupGames: number,
  nowMs: number,
): { stageChipPredicted: number; stageChipTotal: number } {
  const currentStage = stages.find(s => nowMs <= s.maxDate);

  if (currentStage && currentStage.key !== '__groups__') {
    const stageGames = games.filter(g => {
      const ts = new Date(g.game_date).getTime();
      return ts >= currentStage.minDate && ts <= currentStage.maxDate;
    });
    const stageChipPredicted = stageGames.filter(
      g => isGuessComplete(gameGuesses[g.id], !!g.playoffStage)
    ).length;

    const collapsed = collapsePlayoffDenominator(completion.playoffRoundsCompletion);
    const roundId = currentStage.key === '__finals__'
      ? Object.keys(completion.playoffRoundsCompletion).find(id => completion.playoffRoundsCompletion[id].is_final)
      : currentStage.key;
    const stageChipTotal = roundId ? (collapsed[roundId]?.total ?? stageGames.length) : stageGames.length;

    return { stageChipPredicted, stageChipTotal };
  }

  return { stageChipPredicted: liveCompletedGroupGames, stageChipTotal: completion.totalGroupGames };
}

function prepareData(input: GamesHeaderInput, now: Date): GamesHeaderData {
  const { completion, games, urgentGames, gameGuesses } = input;
  const nowMs = now.getTime();

  const stages = buildStageWindows(games);
  let stageLabel: string | undefined;
  if (stages.length === 0) {
    stageLabel = undefined;
  } else if (nowMs > stages.at(-1)!.maxDate) {
    stageLabel = 'Finalizado';
  } else {
    stageLabel = stages.find(s => nowMs <= s.maxDate)!.label;
  }

  const groupGames = games.filter(g => !g.playoffStage);
  const liveCompletedGroupGames = groupGames.filter(g => isGuessComplete(gameGuesses[g.id], false)).length;
  const liveCompletedGames = games.filter(g => isGuessComplete(gameGuesses[g.id], !!g.playoffStage)).length;

  const { stageChipPredicted, stageChipTotal } = computeStageChip(
    stages, games, gameGuesses, completion, liveCompletedGroupGames, nowMs
  );

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
    && games.every(g => new Date(g.game_date).getTime() < nowMs);

  const unpredictedUrgentGames = urgentGames.filter(
    g => !isGuessComplete(gameGuesses[g.id], !!g.playoffStage)
  );

  const groupsComplete = liveCompletedGroupGames >= completion.totalGroupGames && completion.totalGroupGames > 0;
  const qtOpen = !completion.isPredictionLocked;
  const qtIncomplete = completion.qualifiers.completed < completion.qualifiers.total;

  const tournamentNotStarted = games.length > 0
    && games.every(g => new Date(g.game_date).getTime() > nowMs);

  return {
    stageLabel,
    boosts,
    liveCompletedGames,
    liveCompletedGroupGames,
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
  // Groups done but no QT action available (locked or complete): avoid showing group-games CTA
  if (data.groupsComplete) return 'groups-complete';
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
    pointsBadge: gamePointsEarned === undefined ? undefined : `${gamePointsEarned} pts`,
    message: t('statusHeader.games.finished.message'),
    action: { label: t('statusHeader.games.finished.ctaStats'), href: `/${locale}/tournaments/${tournamentId}/stats` },
    secondaryAction: { label: t('statusHeader.games.finished.ctaGroups'), href: `/${locale}/friend-groups` },
  };
}

function buildUrgentUnpredicted(input: GamesHeaderInput, data: GamesHeaderData, t: TFunction, now: Date): StatusHeaderVariant {
  const { unpredictedUrgentGames, stageLabel, stageChipPredicted, stageChipTotal, boosts } = data;
  const { teamsMap, locale, tournamentId } = input;

  const levels = new Set(unpredictedUrgentGames.map(g => getGameUrgencyLevel(g, now)));
  let tone: StatusHeaderTone;
  if (levels.has('deadlineNow')) {
    tone = 'deadlineNow';
  } else if (levels.has('deadlineUrgent')) {
    tone = 'deadlineUrgent';
  } else {
    tone = 'deadlineSoon';
  }

  const count = unpredictedUrgentGames.length;
  const window = urgencyWindow(tone as UrgencyLevel);

  const matchups = unpredictedUrgentGames.slice(0, 3).map(g => {
    const home = teamsMap[g.home_team ?? '']?.name;
    const away = teamsMap[g.away_team ?? '']?.name;
    if (home && away) return `${home} vs ${away}`;
    const roundName = g.playoffStage?.round_name_i18n?.[input.locale] ?? g.playoffStage?.round_name ?? '';
    return t('statusHeader.games.urgentUnpredicted.matchFallback', { number: g.game_number, round: roundName });
  });
  if (count > 3) matchups.push(`+${count - 3}`);

  let chipColor: 'error' | 'warning' | 'info';
  if (tone === 'deadlineNow') {
    chipColor = 'error';
  } else if (tone === 'deadlineUrgent') {
    chipColor = 'warning';
  } else {
    chipColor = 'info';
  }

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

function buildGroupsComplete(input: GamesHeaderInput, data: GamesHeaderData, t: TFunction): StatusHeaderVariant {
  const { stageLabel, stageChipPredicted, stageChipTotal, boosts } = data;
  return {
    tone: 'success',
    stageLabel,
    leadIcon: 'check',
    statusText: t('statusHeader.games.groupsComplete.status'),
    chip: {
      label: t('statusHeader.chipLabel.partidos', { predicted: stageChipPredicted, total: stageChipTotal }),
      color: 'success',
    },
    boosts,
    message: t('statusHeader.games.groupsComplete.message'),
  };
}

function buildPreTournament(input: GamesHeaderInput, data: GamesHeaderData, t: TFunction, now: Date): StatusHeaderVariant {
  const { completion, games, locale, tournamentId } = input;
  const { liveCompletedGroupGames, boosts } = data;

  const firstGame = games.reduce((a, b) => new Date(a.game_date) < new Date(b.game_date) ? a : b, games[0]);
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
 * Priority: tournament-finished → urgent-unpredicted → nudge-qt → groups-complete → pre-tournament → stage-active-caught-up
 */
export function computeGamesHeaderVariant(input: GamesHeaderInput, t: TFunction): StatusHeaderVariant {
  const now = input.now ?? new Date();
  const data = prepareData(input, now);
  const variant = selectVariant(data);

  switch (variant) {
    case 'tournament-finished':    return buildFinished(input, data, t);
    case 'urgent-unpredicted':     return buildUrgentUnpredicted(input, data, t, now);
    case 'nudge-qt':               return buildNudgeQT(input, data, t);
    case 'groups-complete':        return buildGroupsComplete(input, data, t);
    case 'pre-tournament':         return buildPreTournament(input, data, t, now);
    case 'stage-active-caught-up': return buildStageActive(input, data, t, now);
  }
}
