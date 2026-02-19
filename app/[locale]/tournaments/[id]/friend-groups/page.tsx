'use server'

import { getGroupsForUser, calculateTournamentGroupStats } from "../../../../actions/prode-group-actions";
import { getLoggedInUser } from "../../../../actions/user-actions";
import { redirect } from "next/navigation";
import TournamentGroupsList from "../../../../components/tournament-page/tournament-groups-list";
import type { TournamentGroupStats } from "../../../../definitions";

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

export default async function TournamentGroupsPage(props: Props) {
  const params = await props.params;
  const tournamentId = params.id;

  // Check authentication
  const user = await getLoggedInUser();
  if (!user) {
    return redirect(`/es/login?redirect=/es/tournaments/${tournamentId}/friend-groups`);
  }

  // Fetch user's groups
  const prodeGroups = await getGroupsForUser();
  if (!prodeGroups) {
    return redirect(`/es/tournaments/${tournamentId}`);
  }

  // Combine user groups and participant groups
  const allGroups = [...prodeGroups.userGroups, ...prodeGroups.participantGroups];

  // Calculate tournament stats for each group
  const groupStatsPromises = allGroups.map(group =>
    calculateTournamentGroupStats(group.id, tournamentId, user.id)
  );
  const groupStats: TournamentGroupStats[] = await Promise.all(groupStatsPromises);

  return (
    <TournamentGroupsList
      groups={groupStats}
      tournamentId={tournamentId}
    />
  );
}
