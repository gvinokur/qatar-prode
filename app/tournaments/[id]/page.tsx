'use server'

import {getGamesAroundMyTime, getTeamsMap} from "../../actions/tournament-actions";
import {DebugObject} from "../../components/debug";
import {Fixtures} from "../../components/tournament-page/fixtures";
import {Grid} from "../../components/mui-wrappers/";
import Rules from "../../components/tournament-page/rules";
import FriendGroupsList from "../../components/tournament-page/friend-groups-list";
import {getGroupsForUser} from "../../actions/prode-group-actions";
import {getLoggedInUser} from "../../actions/user-actions";
import {UserTournamentStatistics} from "../../components/tournament-page/user-tournament-statistics";
import {getPredictionDashboardStats, getGameGuessStatisticsForUsers} from "../../db/game-guess-repository";
import {findTournamentGuessByUserIdTournament} from "../../db/tournament-guess-repository";
import {unstable_ViewTransition as ViewTransition} from "react";
import {findTournamentById} from "../../db/tournament-repository";
import {PredictionStatusBar} from "../../components/prediction-status-bar";
import type {ScoringConfig} from "../../components/tournament-page/rules";

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

  const gamesAroundMyTime = await getGamesAroundMyTime(tournamentId);
  const teamsMap = await getTeamsMap(tournamentId)

  // Fetch dashboard stats for prediction tracking
  const dashboardStats = user ? await getPredictionDashboardStats(user.id, tournamentId) : null

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

  return (
    <>
      {searchParams.hasOwnProperty('debug') && (<DebugObject object={{
        gamesAroundMyTime,
        teamsMap,
        prodeGroups
      }}/>)}
      <ViewTransition
        name={'group-page'}
        enter={'group-enter'}
        exit={'group-exit'}>
        <Grid container maxWidth={'868px'} mt={1} mx={{md: 'auto'}} spacing={2}>
          <Grid size={{ xs:12, md: 8 }}>
            {user && dashboardStats && tournament && (
              <PredictionStatusBar
                totalGames={dashboardStats.totalGames}
                predictedGames={dashboardStats.predictedGames}
                silverUsed={dashboardStats.silverUsed}
                silverMax={tournament.max_silver_games ?? 0}
                goldenUsed={dashboardStats.goldenUsed}
                goldenMax={tournament.max_golden_games ?? 0}
                urgentGames={dashboardStats.urgentGames}
                warningGames={dashboardStats.warningGames}
                noticeGames={dashboardStats.noticeGames}
              />
            )}
            <Fixtures games={gamesAroundMyTime} teamsMap={teamsMap}/>
          </Grid>
          <Grid size={{ xs:12, md: 4 }}>
            <Grid container rowSpacing={2}>
              <Grid size={12}>
                <Rules expanded={false} scoringConfig={scoringConfig} tournamentId={tournamentId}/>
              </Grid>
              {user && (
                  <Grid size={12}>
                    <UserTournamentStatistics userGameStatistics={userGameStatistics} tournamentGuess={tournamentGuesses} />
                  </Grid>
              )}
              {prodeGroups && (
                <Grid size={12}>
                  <FriendGroupsList userGroups={prodeGroups.userGroups} participantGroups={prodeGroups.participantGroups}/>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </ViewTransition>
    </>
  )
}
