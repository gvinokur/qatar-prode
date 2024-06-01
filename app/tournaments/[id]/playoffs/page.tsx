'use server'

import {DebugObject} from "../../../components/debug";
import {getLoggedInUser} from "../../../actions/user-actions";
import {redirect} from "next/navigation";
import {getCompletePlayoffData} from "../../../actions/tournament-actions";
import {findGameGuessesByUserId} from "../../../db/game-guess-repository";
import {GameGuess, TournamentGuessNew} from "../../../db/tables-definition";
import GroupSelector from "../../../components/groups-page/group-selector";
import {Box, Grid, Chip} from "../../../components/mui-wrappers";
import {GuessesContextProvider} from "../../../components/context-providers/guesses-context-provider";
import GameView from "../../../components/game-view";
import HonorRoll from "../../../components/playoffs-page/honor-roll-component";
import SavePlayoffsComponent from "../../../components/playoffs-page/save-playoffs-components";
import {calculatePlayoffTeams} from "../../../utils/playoff-teams-calculator";
import {findTournamentGuessByUserIdTournament} from "../../../db/tournament-guess-repository";
import {tree} from "next/dist/build/templates/app-page";

type Props = {
  params: {
    id: string
  }
  searchParams: {[k:string]:string}
}

const buildTournamentGuesses = (userId: string, tournamentId: string) => ({
  user_id: userId,
  tournament_id: tournamentId
} as TournamentGuessNew)

export default async function PlayoffPage({params, searchParams}: Props) {
  const user = await getLoggedInUser();
  const completePlayoffData = await getCompletePlayoffData(params.id)
  if(!user) {
    redirect('/')
  }
  const userGameGuesses = await findGameGuessesByUserId(user.id)
  const gameGuesses:{[k: string]: GameGuess} = Object.fromEntries(
    userGameGuesses.map(gameGuess => [gameGuess.game_id, gameGuess])
  )
  const tournamentGuesses =
    await findTournamentGuessByUserIdTournament(user.id, params.id) || buildTournamentGuesses(user.id, params.id)


  const playoffStagesPreFinal = completePlayoffData
    .playoffStages
    .filter(ps => (!ps.is_final && !ps.is_third_place))
    .sort((a,b) => a.round_order - b.round_order)

  const playoffTeams = calculatePlayoffTeams(
    completePlayoffData.playoffStages[0],
    completePlayoffData.allGroups,
    completePlayoffData.gamesMap,
    completePlayoffData.gameResultsMap,
    gameGuesses)

  const final = completePlayoffData.playoffStages.find(ps => ps.is_final)

  const thirdPlace = completePlayoffData.playoffStages.find(ps => ps.is_third_place)

  //TODO: Do some logic if there are more than 3 playoff rounds
  const totalColumns = playoffStagesPreFinal.length === 3 ? 8 : 6

  return (
    <>
      {searchParams.hasOwnProperty('debug') && (<DebugObject object={{
        playoffStagesPreFinal,
        final,
        thirdPlace,
        gameGuesses,
        playoffTeams,
        tournamentStartDate: completePlayoffData.tournamentStartDate
      }}/>)}

      <GuessesContextProvider
        gameGuesses={gameGuesses}
        tournamentGuesses={tournamentGuesses}
        tournamentStartDate={completePlayoffData.tournamentStartDate}
      >
        <Grid container spacing={2} mt={2} mb={6} columns={totalColumns}>
          {playoffStagesPreFinal.map(playoffStage => (
            <Grid item md={2} sm={12} key={playoffStage.id}>
              <Chip label={playoffStage.round_name}
                    sx={{
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      typography: 'h5',
                      width: '100%',
                      padding:'24px'
                    }}/>
              <Grid container spacing={2} pt={2} pl={1} pr={1}>
                {playoffStage.games
                  .map(({game_id}) => completePlayoffData.gamesMap[game_id])
                  .sort((a,b) => a.game_number - b.game_number)
                  .map(game => ({
                    ...game,
                    home_team: playoffTeams[game.id]?.homeTeam?.team,
                    away_team: playoffTeams[game.id]?.awayTeam?.team
                  }))
                  .map(game=> (
                    <Grid item key={game.id} md={12} sm={6} xs={12}>
                      <GameView game={game} teamsMap={completePlayoffData.teamsMap} />
                    </Grid>
                  ))}
              </Grid>
            </Grid>
          ))}
          <Grid item md={2} xs={12}>
            <Grid container spacing={1}>
              {final && (
                <>
                  <Grid item xs={12} sm={6} md={12}>
                    <Chip label={'Final'}
                      sx={{
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        typography: 'h5',
                        width: '100%',
                        padding:'24px'
                      }}/>
                    <Box pt={2} pl={1} pr={1} pb={1}>
                      <GameView
                        game={completePlayoffData.gamesMap[final.games[0].game_id]}
                        teamsMap={completePlayoffData.teamsMap}
                        isFinal={true}
                      />
                    </Box>
                  </Grid>
                </>
              )}
              {thirdPlace && (
                <>
                  <Grid item xs={12} sm={6} md={12}>
                    <Chip label={'Tercer Puesto'}
                          sx={{
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            typography: 'h5',
                            width: '100%',
                            padding:'24px'
                          }}/>
                    <Box pt={2} pl={1} pr={1} pb={1}>
                      <GameView
                        game={completePlayoffData.gamesMap[thirdPlace.games[0].game_id]}
                        teamsMap={completePlayoffData.teamsMap}
                        isThirdPlace={true}
                      />
                    </Box>
                  </Grid>
                </>
              )}
              <Grid item xs={12} md={12} mt={2}>
                <Chip label={'Pronosticos Finales'}
                      sx={{
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        typography: 'h5',
                        width: '100%',
                        padding:'24px'
                      }}/>
                <HonorRoll teamsMap={completePlayoffData.teamsMap}/>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <SavePlayoffsComponent tournamentStartDate={completePlayoffData.tournamentStartDate}/>
      </GuessesContextProvider>
    </>
  )
}
