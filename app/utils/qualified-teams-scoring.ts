import { db } from '../db/database';
import { getAllUserGroupPositionsPredictions } from '../db/qualified-teams-repository';
import { findTournamentById } from '../db/tournament-repository';
import { findQualifiedTeams } from '../db/team-repository';
import { TeamPositionPrediction } from '../db/tables-definition';

/**
 * Result of scoring calculation for a single team
 */
export interface TeamScoringResult {
  teamId: string;
  teamName: string;
  groupId: string;
  predictedPosition: number;
  actualPosition: number | null;
  predictedToQualify: boolean;
  actuallyQualified: boolean;
  pointsAwarded: number;
  reason: string; // e.g., "qualified + exact position", "qualified, wrong position", "not qualified"
}

/**
 * Complete scoring result for a user in a tournament
 */
export interface QualifiedTeamsScoringResult {
  userId: string;
  tournamentId: string;
  totalScore: number;
  breakdown: {
    groupId: string;
    groupName: string;
    teams: TeamScoringResult[];
  }[];
}

/**
 * Scoring configuration from tournament
 */
interface ScoringConfig {
  qualified_team_points: number;
  exact_position_qualified_points: number;
}

/**
 * Calculate qualified teams score for a user in a tournament
 *
 * Scoring Rules:
 * 1. Direct Qualifier (pos 1-2) qualifies → 1 point (qualified_team_points)
 * 2. Exact Position Match + qualifies → +1 bonus point (exact_position_qualified_points)
 * 3. Third Place with qualify=true + actually qualifies → 1 point (qualified_team_points)
 * 4. Team doesn't qualify → 0 points (regardless of position accuracy)
 * 5. Wrong position but qualified → 1 point only (qualified_team_points, no bonus)
 *
 * Maximum: 2 points per team (1 for qualification + 1 for exact position)
 *
 * @param userId - User ID to calculate score for
 * @param tournamentId - Tournament ID
 * @returns Detailed scoring result with breakdown
 */
export async function calculateQualifiedTeamsScore(
  userId: string,
  tournamentId: string
): Promise<QualifiedTeamsScoringResult> {
  // 1. Fetch tournament config
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  const scoringConfig: ScoringConfig = {
    qualified_team_points: tournament.qualified_team_points ?? 1,
    exact_position_qualified_points: tournament.exact_position_qualified_points ?? 1,
  };

  // 2. Fetch user's JSONB predictions
  const userPredictions = await getAllUserGroupPositionsPredictions(userId, tournamentId);

  // 3. Fetch actual group standings with team names
  const groupStandings = await db
    .selectFrom('tournament_group_teams')
    .innerJoin('teams', 'teams.id', 'tournament_group_teams.team_id')
    .innerJoin('tournament_groups', 'tournament_groups.id', 'tournament_group_teams.tournament_group_id')
    .where('tournament_groups.tournament_id', '=', tournamentId)
    .select([
      'tournament_group_teams.team_id',
      'tournament_group_teams.tournament_group_id as group_id',
      'tournament_group_teams.position',
      'tournament_group_teams.is_complete',
      'teams.name as team_name',
      'tournament_groups.group_letter as group_name',
    ])
    .execute();

  // 4. Validate ALL groups are complete (fail fast)
  const incompleteGroups = groupStandings.filter((s) => !s.is_complete);
  if (incompleteGroups.length > 0) {
    const uniqueIncompleteGroups = [...new Set(incompleteGroups.map((s) => s.group_name))];
    throw new Error(
      `Cannot calculate scores: Groups ${uniqueIncompleteGroups.join(', ')} are not complete. ` +
        `All groups must be finalized before scoring.`
    );
  }

  // 5. Fetch teams that actually qualified (in playoff bracket)
  const qualifiedTeams = await findQualifiedTeams(tournamentId);
  const qualifiedTeamIds = new Set(qualifiedTeams.map((t) => t.id));

  // Build lookup maps for efficient querying
  const standingsMap = new Map(
    groupStandings.map((s) => [
      s.team_id,
      {
        position: s.position,
        groupId: s.group_id,
        teamName: s.team_name,
        groupName: s.group_name,
      },
    ])
  );

  const groupNamesMap = new Map(groupStandings.map((s) => [s.group_id, s.group_name]));

  // 6. Calculate scores for each group
  const breakdown: QualifiedTeamsScoringResult['breakdown'] = [];
  let totalScore = 0;

  for (const groupPrediction of userPredictions) {
    const groupId = groupPrediction.group_id;
    const groupName = groupNamesMap.get(groupId) || `Group ${groupId}`;
    const teamResults: TeamScoringResult[] = [];

    // Parse JSONB predictions array
    const predictions = groupPrediction.team_predicted_positions as TeamPositionPrediction[];

    for (const prediction of predictions) {
      const teamId = prediction.team_id;
      const predictedPosition = prediction.predicted_position;
      const predictedToQualify = prediction.predicted_to_qualify;

      // Get actual standings for this team
      const actualStanding = standingsMap.get(teamId);
      const actualPosition = actualStanding?.position ?? null;
      const teamName = actualStanding?.teamName ?? 'Unknown Team';

      // Check if team actually qualified
      const actuallyQualified = qualifiedTeamIds.has(teamId);

      // Calculate points based on rules
      let pointsAwarded = 0;
      let reason = '';

      if (!actuallyQualified) {
        // Rule 4: Team didn't qualify → 0 points
        pointsAwarded = 0;
        reason = 'not qualified';
      } else {
        // Team qualified
        if (actualPosition === null) {
          // Edge case: qualified but no position data
          pointsAwarded = 0;
          reason = 'qualified, but no position data';
        } else if (predictedPosition === actualPosition) {
          // Rule 2: Exact position match + qualified → base + bonus
          pointsAwarded =
            scoringConfig.qualified_team_points + scoringConfig.exact_position_qualified_points;
          reason = 'qualified + exact position';
        } else {
          // Rule 1, 3, or 5: Qualified but wrong position → base points only
          // This applies to:
          // - Positions 1-2 that qualified but wrong position (Rule 5)
          // - Position 3 with qualify=true that qualified (Rule 3)
          pointsAwarded = scoringConfig.qualified_team_points;
          reason = 'qualified, wrong position';
        }

        // Special case: Position 3 with qualify=false → 0 points
        // User didn't predict qualification even if team qualified
        if (predictedPosition === 3 && !predictedToQualify) {
          pointsAwarded = 0;
          reason = 'qualified, but user did not predict qualification';
        }
      }

      totalScore += pointsAwarded;

      teamResults.push({
        teamId,
        teamName,
        groupId,
        predictedPosition,
        actualPosition,
        predictedToQualify,
        actuallyQualified,
        pointsAwarded,
        reason,
      });
    }

    breakdown.push({
      groupId,
      groupName,
      teams: teamResults,
    });
  }

  return {
    userId,
    tournamentId,
    totalScore,
    breakdown,
  };
}
