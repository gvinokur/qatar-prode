'use server'

import {getTeamsMap, getGroupStandingsForTournament} from "../../actions/tournament-actions";
import {DebugObject} from "../../components/debug";
import {Grid, Box} from "../../components/mui-wrappers/";
import Rules from "../../components/tournament-page/rules";
import FriendGroupsList from "../../components/tournament-page/friend-groups-list";
import GroupStandingsSidebar from "../../components/tournament-page/group-standings-sidebar";
import {getGroupsForUser} from "../../actions/prode-group-actions";
import {getLoggedInUser} from "../../actions/user-actions";
import {UserTournamentStatistics} from "../../components/tournament-page/user-tournament-statistics";
import {getGameGuessStatisticsForUsers} from "../../db/game-guess-repository";
import {findTournamentGuessByUserIdTournament} from "../../db/tournament-guess-repository";
import {unstable_ViewTransition as ViewTransition} from "react";
import {findTournamentById} from "../../db/tournament-repository";
import type {ScoringConfig} from "../../components/tournament-page/rules";
import {UnifiedGamesPage} from "../../components/unified-games-page";

type Props = {
  readonly params: Promise<{
    id: string
  }>
  readonly searchParams: Promise<{[k:string]:string}>
}

export default async function TournamentLandingPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams

  const tournamentId = params.id
  const user = await getLoggedInUser()
  const prodeGroups = await getGroupsForUser()

  const teamsMap = await getTeamsMap(tournamentId)

  const userGameStatisticList = user ?
    await getGameGuessStatisticsForUsers([user.id], tournamentId) :
    []
  const tournamentGuesses = user && (await findTournamentGuessByUserIdTournament(user.id, params.id))

  const userGameStatistics = userGameStatisticList.length > 0 ? userGameStatisticList[0] : undefined

  // Server Component pattern: import repository directly and extract scoring config
  const tournament = await findTournamentById(tournamentId);
  const scoringConfig: ScoringConfig | undefined = tournament ? {
    game_exact_score_points: tournament.game_exact_score_points ?? 2,
    game_correct_outcome_points: tournament.game_correct_outcome_points ?? 1,
    champion_points: tournament.champion_points ?? 5,
    runner_up_points: tournament.runner_up_points ?? 3,
    third_place_points: tournament.third_place_points ?? 1,
    individual_award_points: tournament.individual_award_points ?? 3,
    qualified_team_points: tournament.qualified_team_points ?? 1,
    exact_position_qualified_points: tournament.exact_position_qualified_points ?? 2,
    max_silver_games: tournament.max_silver_games ?? 0,
    max_golden_games: tournament.max_golden_games ?? 0,
  } : undefined;

  // Fetch group standings for sidebar
  const groupStandings = await getGroupStandingsForTournament(tournamentId);

  return (
    <>
      {searchParams.hasOwnProperty('debug') && (<DebugObject object={{
        teamsMap,
        prodeGroups
      }}/>)}
      <ViewTransition
        name={'group-page'}
        enter={'group-enter'}
        exit={'group-exit'}>
        <Grid container maxWidth={'868px'} mt={1} mx={{md: 'auto'}} spacing={2} sx={{ height: '100%' }}>
          <Grid size={{ xs:12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
            <UnifiedGamesPage tournamentId={tournamentId} />
          </Grid>
          <Grid size={{ xs:12, md: 4 }} sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', minHeight: 0, height: '100%', overflow: 'hidden' }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0 }}>
              <Grid container rowSpacing={2}>
                <Grid size={12}>
                  <Rules expanded={false} scoringConfig={scoringConfig} tournamentId={tournamentId}/>
                </Grid>
                {user && (
                    <Grid size={12}>
                      <UserTournamentStatistics userGameStatistics={userGameStatistics} tournamentGuess={tournamentGuesses} tournamentId={tournamentId} />
                    </Grid>
                )}
                {/* Group Standings Section - After UserTournamentStatistics */}
                {groupStandings.groups.length > 0 && (
                  <Grid size={12}>
                    <GroupStandingsSidebar
                      groups={groupStandings.groups}
                      defaultGroupId={groupStandings.defaultGroupId}
                      qualifiedTeams={groupStandings.qualifiedTeams}
                    />
                  </Grid>
                )}
                {prodeGroups && (
                  <Grid size={12}>
                    <FriendGroupsList
                      userGroups={prodeGroups.userGroups}
                      participantGroups={prodeGroups.participantGroups}
                      tournamentId={tournamentId}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </ViewTransition>
    </>
  )
}
