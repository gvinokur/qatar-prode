import { db } from '../db/database';
import { getAllUserGroupPositionsPredictions } from '../db/qualified-teams-repository';
import { findTournamentById } from '../db/tournament-repository';
import { findQualifiedTeams } from '../db/team-repository';

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
 * Helper: Calculate points and reason for a single team prediction
 */
function calculateTeamPoints(
  predictedPosition: number,
  predictedToQualify: boolean,
  actuallyQualified: boolean,
  actualPosition: number | null,
  scoringConfig: ScoringConfig
): { points: number; reason: string } {
  // If user didn't predict this team to qualify (predictedToQualify = false),
  // they get 0 points regardless of actual outcome
  // This handles initialization state where all teams have qualify=false by default
  if (!predictedToQualify) {
    return {
      points: 0,
      reason: actuallyQualified
        ? 'qualified, but user did not predict qualification'
        : 'user did not predict qualification'
    };
  }

  // User predicted this team to qualify (predictedToQualify = true)
  // Now check if the team actually qualified
  if (!actuallyQualified) {
    return {
      points: 0,
      reason: actualPosition === null ? 'group not complete' : 'predicted qualification, but did not qualify'
    };
  }

  // Team qualified AND user predicted it
  if (actualPosition === null) {
    return { points: 0, reason: 'qualified, but no position data' };
  }

  // Check for exact position match
  if (predictedPosition === actualPosition) {
    return {
      points: scoringConfig.qualified_team_points + scoringConfig.exact_position_qualified_points,
      reason: 'qualified + exact position'
    };
  }

  // Wrong position but qualified
  return {
    points: scoringConfig.qualified_team_points,
    reason: 'qualified, wrong position'
  };
}

/**
 * Calculate qualified teams score for a user in a tournament
 *
 * Scoring Rules:
 * 0. **User must explicitly set predicted_to_qualify = true** to earn points (default is false)
 * 1. predicted_to_qualify = false → 0 points (initialization state, no prediction made)
 * 2. predicted_to_qualify = true + team qualifies → 1 point (qualified_team_points)
 * 3. predicted_to_qualify = true + team qualifies + exact position → +1 bonus (exact_position_qualified_points)
 * 4. predicted_to_qualify = true + team doesn't qualify → 0 points
 * 5. Wrong position but qualified → 1 point only (qualified_team_points, no bonus)
 *
 * Maximum: 2 points per team (1 for qualification + 1 for exact position)
 * Minimum: 0 points (either no prediction made or prediction was wrong)
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

  // 3. Fetch qualified teams with their positions and group completion metadata
  // This returns progressive results: 1st/2nd from complete groups + 3rd place when playoff bracket exists
  const qualifiedTeamsResult = await findQualifiedTeams(tournamentId);
  const qualifiedTeams = qualifiedTeamsResult.teams;
  const completeGroupIds = qualifiedTeamsResult.completeGroupIds;

  // Build lookup maps for efficient querying
  const qualifiedTeamsMap = new Map(
    qualifiedTeams.map((t) => [
      t.id,
      {
        position: t.final_position,
        groupId: t.group_id,
        teamName: t.name,
      },
    ])
  );

  const qualifiedTeamIds = new Set(qualifiedTeams.map((t) => t.id));

  // 4. Fetch actual positions for ALL teams in complete groups (for pending 3rd place detection)
  // This is needed to show "pending" state for 3rd place teams that haven't been determined yet
  const allTeamPositions = new Map<string, { position: number; teamName: string }>();

  if (completeGroupIds.size > 0) {
    const completeGroupTeams = await db
      .selectFrom('tournament_group_teams')
      .innerJoin('teams', 'teams.id', 'tournament_group_teams.team_id')
      .where('tournament_group_teams.tournament_group_id', 'in', Array.from(completeGroupIds))
      .where('tournament_group_teams.is_complete', '=', true)
      .select([
        'tournament_group_teams.team_id',
        'tournament_group_teams.position',
        'teams.name as team_name',
      ])
      .execute();

    completeGroupTeams.forEach((team) => {
      if (team.position !== null) {
        allTeamPositions.set(team.team_id, {
          position: team.position + 1, // Convert 0-indexed to 1-indexed
          teamName: team.team_name,
        });
      }
    });
  }

  // Get group names for display
  const groupNames = await db
    .selectFrom('tournament_groups')
    .where('tournament_id', '=', tournamentId)
    .select(['id', 'group_letter'])
    .execute();

  const groupNamesMap = new Map(groupNames.map((g) => [g.id, g.group_letter]));

  // 5. Calculate scores for each group (progressive scoring)
  const breakdown: QualifiedTeamsScoringResult['breakdown'] = [];
  let totalScore = 0;

  for (const groupPrediction of userPredictions) {
    const groupId = groupPrediction.group_id;
    const groupName = groupNamesMap.get(groupId) || `Group ${groupId}`;
    const teamResults: TeamScoringResult[] = [];

    // Parse JSONB predictions array
    const predictions = groupPrediction.team_predicted_positions;

    for (const prediction of predictions) {
      const teamId = prediction.team_id;
      const predictedPosition = prediction.predicted_position;
      const predictedToQualify = prediction.predicted_to_qualify;

      // Check if team qualified and get their actual position
      const qualifiedTeamData = qualifiedTeamsMap.get(teamId);
      const actuallyQualified = qualifiedTeamIds.has(teamId);

      // Get actual position: prioritize qualified teams map, then all positions map (for complete groups)
      const teamPositionData = allTeamPositions.get(teamId);
      const actualPosition = qualifiedTeamData?.position ?? teamPositionData?.position ?? null;
      const teamName = qualifiedTeamData?.teamName ?? teamPositionData?.teamName ?? 'Unknown Team';

      // Calculate points and reason using helper function
      const { points: pointsAwarded, reason } = calculateTeamPoints(
        predictedPosition,
        predictedToQualify,
        actuallyQualified,
        actualPosition,
        scoringConfig
      );

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
