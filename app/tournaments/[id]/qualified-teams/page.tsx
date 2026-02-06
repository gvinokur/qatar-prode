import { notFound, redirect } from 'next/navigation';
import { getLoggedInUser } from '../../../actions/user-actions';
import { getTournamentQualificationConfig } from '../../../actions/qualification-actions';
import { db } from '../../../db/database';
import {
  Team,
  TournamentGroup,
  QualifiedTeamPrediction,
  TeamPositionPrediction,
} from '../../../db/tables-definition';
import QualifiedTeamsClientPage from '../../../components/qualified-teams/qualified-teams-client-page';

interface PageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

/** Fetch groups with their teams */
async function fetchGroupsWithTeams(tournamentId: string) {
  const groups = await db
    .selectFrom('tournament_groups')
    .where('tournament_id', '=', tournamentId)
    .select(['id', 'group_letter', 'tournament_id', 'sort_by_games_between_teams'])
    .orderBy('group_letter', 'asc')
    .execute();

  return Promise.all(
    groups.map(async (group) => {
      const teamAssignments = await db
        .selectFrom('tournament_group_teams')
        .innerJoin('teams', 'teams.id', 'tournament_group_teams.team_id')
        .where('tournament_group_teams.tournament_group_id', '=', group.id)
        .select(['teams.id', 'teams.name', 'teams.short_name', 'teams.theme'])
        .execute();

      return {
        group,
        teams: teamAssignments,
      };
    })
  );
}

/** Initialize predictions for user if none exist - using JSONB format */
async function initializePredictions(
  userId: string,
  tournamentId: string,
  groupsWithTeams: Array<{ group: TournamentGroup; teams: Team[] }>
): Promise<QualifiedTeamPrediction[]> {
  // Create JSONB row for each group
  const jsonbRows = groupsWithTeams.map(({ group, teams }) => {
    const teamPositions: TeamPositionPrediction[] = teams.map((team, index) => ({
      team_id: team.id,
      predicted_position: index + 1,
      predicted_to_qualify: false, // User must explicitly select qualified teams
    }));

    return {
      user_id: userId,
      tournament_id: tournamentId,
      group_id: group.id,
      team_predicted_positions: JSON.stringify(teamPositions),
    };
  });

  if (jsonbRows.length > 0) {
    await db
      .insertInto('tournament_user_group_positions_predictions')
      .values(jsonbRows as any)
      .execute();
  }

  // Fetch and flatten for client
  return fetchAndFlattenPredictions(userId, tournamentId);
}

/**
 * Fetch JSONB predictions and flatten them into array format for client
 */
async function fetchAndFlattenPredictions(
  userId: string,
  tournamentId: string
): Promise<QualifiedTeamPrediction[]> {
  const jsonbRows = await db
    .selectFrom('tournament_user_group_positions_predictions')
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .select(['id', 'user_id', 'tournament_id', 'group_id', 'team_predicted_positions', 'created_at', 'updated_at'])
    .execute();

  // Flatten JSONB arrays into individual prediction objects
  const predictions: QualifiedTeamPrediction[] = [];

  for (const row of jsonbRows) {
    const positions = row.team_predicted_positions as unknown as TeamPositionPrediction[];

    for (const pos of positions) {
      predictions.push({
        id: `${row.id}-${pos.team_id}`, // Synthetic ID for client
        user_id: row.user_id,
        tournament_id: row.tournament_id,
        group_id: row.group_id,
        team_id: pos.team_id,
        predicted_position: pos.predicted_position,
        predicted_to_qualify: pos.predicted_to_qualify,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }
  }

  return predictions;
}

/**
 * Server Component: Qualified Teams Prediction Page
 * Fetches tournament data, groups, teams, and user predictions
 * Passes data to client component for drag-and-drop interaction
 */
export default async function QualifiedTeamsPage({ params }: PageProps) {
  const { id: tournamentId } = await params;

  try {
    // Check authentication
    const user = await getLoggedInUser();
    if (!user?.id) {
      redirect(`/auth/login?redirect=/tournaments/${tournamentId}/qualified-teams`);
    }

    console.error('[QualifiedTeams] User authenticated:', user.id);

    // Fetch tournament
    const tournament = await db
      .selectFrom('tournaments')
      .where('id', '=', tournamentId)
      .select(['id', 'short_name', 'is_active'])
      .executeTakeFirst();

    if (!tournament) {
      console.error('[QualifiedTeams] Tournament not found:', tournamentId);
      notFound();
    }

    console.error('[QualifiedTeams] Tournament found:', tournament.id);

    // Get tournament qualification configuration
    const config = await getTournamentQualificationConfig(tournamentId);
    console.error('[QualifiedTeams] Config loaded:', config);

    // Fetch groups with their teams
    const groupsWithTeams = await fetchGroupsWithTeams(tournamentId);
    console.error('[QualifiedTeams] Groups loaded:', groupsWithTeams.length);

    // Fetch user's predictions from JSONB table and flatten
    let predictions = await fetchAndFlattenPredictions(user.id, tournamentId);
    console.error('[QualifiedTeams] Predictions loaded:', predictions.length);

    // Initialize predictions if none exist
    if (predictions.length === 0) {
      console.error('[QualifiedTeams] Initializing predictions...');
      predictions = await initializePredictions(user.id, tournamentId, groupsWithTeams);
      console.error('[QualifiedTeams] Predictions initialized:', predictions.length);
    }

    return (
      <QualifiedTeamsClientPage
        tournament={tournament}
        groups={groupsWithTeams}
        initialPredictions={predictions}
        userId={user.id}
        isLocked={config.isLocked}
        allowsThirdPlace={config.allowsThirdPlace}
        maxThirdPlace={config.maxThirdPlace}
      />
    );
  } catch (error) {
    console.error('[QualifiedTeams] Error loading page:', error);
    throw error;
  }
}
