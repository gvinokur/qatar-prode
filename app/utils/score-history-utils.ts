import type { UserScoreHistory } from '../actions/score-history-actions';

/**
 * Compute latest and penultimate snapshot scores for each user from pre-filled user histories.
 * Reads the `data` arrays built by `getScoreHistoryForGroup` (which applies LOCF with score=0).
 *
 * Returns a Map from userId → { latest: number; penultimate: number | undefined }.
 * `penultimate` is undefined when fewer than 2 distinct snapshot dates exist.
 * Returns an empty Map when `userHistories` is empty.
 */
export function computeSnapshotScores(
  userHistories: UserScoreHistory[]
): Map<string, { latest: number; penultimate: number | undefined }> {
  if (userHistories.length === 0) return new Map();

  // Collect all distinct dates across all users, sort ascending
  const dateSet = new Set<number>();
  for (const history of userHistories) {
    for (const point of history.data) {
      dateSet.add(point.date);
    }
  }
  const sortedDates = [...dateSet].sort((a, b) => a - b);

  if (sortedDates.length === 0) return new Map();

  const latestDate = sortedDates[sortedDates.length - 1];
  const penultimateDate = sortedDates.length >= 2 ? sortedDates[sortedDates.length - 2] : undefined;

  const result = new Map<string, { latest: number; penultimate: number | undefined }>();
  for (const history of userHistories) {
    const latest = history.data.find(p => p.date === latestDate)?.totalPoints ?? 0;
    const penultimate = penultimateDate !== undefined
      ? (history.data.find(p => p.date === penultimateDate)?.totalPoints ?? 0)
      : undefined;
    result.set(history.userId, { latest, penultimate });
  }
  return result;
}
