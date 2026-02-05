import { notFound, redirect } from 'next/navigation';
import { getLoggedInUser } from '../../../actions/user-actions';
import { getTournamentQualificationConfig } from '../../../actions/qualification-actions';
import { db } from '../../../db/database';
import { Team, TournamentGroup } from '../../../db/tables-definition';
import QualifiedTeamsClientPage from '../../../components/qualified-teams/qualified-teams-client-page';

interface PageProps {
  params: Promise<{
    id: string;
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

/** Initialize predictions for user if none exist */
async function initializePredictions(
  userId: string,
  tournamentId: string,
  groupsWithTeams: Array<{ group: TournamentGroup; teams: Team[] }>
) {
  const initialPredictions = groupsWithTeams.flatMap(({ group, teams }) =>
    teams.map((team, index) => ({
      user_id: userId,
      tournament_id: tournamentId,
      group_id: group.id,
      team_id: team.id,
      predicted_position: index + 1,
      predicted_to_qualify: index < 2, // Top 2 auto-qualify
    }))
  );

  if (initialPredictions.length > 0) {
    await db.insertInto('tournament_qualified_teams_predictions').values(initialPredictions).execute();

    return db
      .selectFrom('tournament_qualified_teams_predictions')
      .where('user_id', '=', userId)
      .where('tournament_id', '=', tournamentId)
      .select([
        'id',
        'user_id',
        'tournament_id',
        'group_id',
        'team_id',
        'predicted_position',
        'predicted_to_qualify',
        'created_at',
        'updated_at',
      ])
      .execute();
  }

  return [];
}

/**
 * Server Component: Qualified Teams Prediction Page
 * Fetches tournament data, groups, teams, and user predictions
 * Passes data to client component for drag-and-drop interaction
 */
export default async function QualifiedTeamsPage({ params }: PageProps) {
  const { id: tournamentId } = await params;

  // Check authentication
  const user = await getLoggedInUser();
  if (!user?.id) {
    redirect(`/auth/login?redirect=/tournaments/${tournamentId}/qualified-teams`);
  }

  // Fetch tournament
  const tournament = await db
    .selectFrom('tournaments')
    .where('id', '=', tournamentId)
    .select(['id', 'short_name', 'is_active'])
    .executeTakeFirst();

  if (!tournament) {
    notFound();
  }

  // Get tournament qualification configuration
  const config = await getTournamentQualificationConfig(tournamentId);

  // Fetch groups with their teams
  const groupsWithTeams = await fetchGroupsWithTeams(tournamentId);

  // Fetch user's predictions
  let predictions = await db
    .selectFrom('tournament_qualified_teams_predictions')
    .where('user_id', '=', user.id)
    .where('tournament_id', '=', tournamentId)
    .select([
      'id',
      'user_id',
      'tournament_id',
      'group_id',
      'team_id',
      'predicted_position',
      'predicted_to_qualify',
      'created_at',
      'updated_at',
    ])
    .execute();

  // Initialize predictions if none exist
  if (predictions.length === 0) {
    predictions = await initializePredictions(user.id, tournamentId, groupsWithTeams);
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
}
