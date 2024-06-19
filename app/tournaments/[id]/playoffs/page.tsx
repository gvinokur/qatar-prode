'use server'

import {DebugObject} from "../../../components/debug";
import {getLoggedInUser} from "../../../actions/user-actions";
import {redirect} from "next/navigation";
import {getCompletePlayoffData} from "../../../actions/tournament-actions";
import {findGameGuessesByUserId} from "../../../db/game-guess-repository";
import {GameGuess, TournamentGuessNew} from "../../../db/tables-definition";
import {Box, Grid, Chip} from "../../../components/mui-wrappers";
import {GuessesContextProvider} from "../../../components/context-providers/guesses-context-provider";
import GameView from "../../../components/game-view";
import HonorRoll from "../../../components/playoffs-page/honor-roll-component";
import SavePlayoffsComponent from "../../../components/playoffs-page/save-playoffs-components";
import {calculatePlayoffTeams, calculatePlayoffTeamsFromPositions} from "../../../utils/playoff-teams-calculator";
import {findTournamentGuessByUserIdTournament} from "../../../db/tournament-guess-repository";
import {findGroupsInTournament} from "../../../db/tournament-group-repository";
import {findAllTournamentGroupTeamGuessInGroup} from "../../../db/tournament-group-team-guess-repository";
import {customToMap, toMap} from "../../../utils/ObjectUtils";

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
  const userGameGuesses = await findGameGuessesByUserId(user.id, params.id)
  const gameGuessesMap = customToMap(userGameGuesses, (gameGuess) => gameGuess.game_id)

  const tournamentGuesses =
    await findTournamentGuessByUserIdTournament(user.id, params.id) || buildTournamentGuesses(user.id, params.id)

  const groups = await findGroupsInTournament(params.id)

  const guessedPositionsByGroup = Object.fromEntries(
    await Promise.all(
      groups.map(async (group) => [
        group.group_letter,
        await findAllTournamentGroupTeamGuessInGroup(user.id, group.id)
      ])
    ))

  const playoffTeamsByGuess = calculatePlayoffTeamsFromPositions(
    completePlayoffData.playoffStages[0],
    completePlayoffData.gamesMap,
    guessedPositionsByGroup)

  Object.keys(playoffTeamsByGuess).forEach(game_id => {
    gameGuessesMap[game_id] = {
      ...gameGuessesMap[game_id],
      home_team: playoffTeamsByGuess[game_id].homeTeam?.team_id || null,
      away_team: playoffTeamsByGuess[game_id].awayTeam?.team_id || null
    }
  })

  const playoffStagesPreFinal = completePlayoffData
    .playoffStages
    .filter(ps => (!ps.is_final && !ps.is_third_place))
    .sort((a,b) => a.round_order - b.round_order)

  const final = completePlayoffData.playoffStages.find(ps => ps.is_final)

  const thirdPlace = completePlayoffData.playoffStages.find(ps => ps.is_third_place)

  return (
    <>
      {searchParams.hasOwnProperty('debug') && (<DebugObject object={{
        playoffStagesPreFinal,
        final,
        thirdPlace,
        gameGuesses: gameGuessesMap,
        playoffTeamsByGuess,
        tournamentStartDate: completePlayoffData.tournamentStartDate,
        guessedPositionsByGroup
      }}/>)}

      <GuessesContextProvider
        gameGuesses={gameGuessesMap}
        tournamentGuesses={tournamentGuesses}
        tournamentStartDate={completePlayoffData.tournamentStartDate}
      >
        <Grid container spacing={2} mt={2} mb={6} columns={12}>
          {playoffStagesPreFinal.map(playoffStage => (
            <Grid item md={true} sm={12} key={playoffStage.id}>
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
                  .map(game=> (
                    <Grid item key={game.id} md={12} sm={6} xs={12}>
                      <GameView game={game} teamsMap={completePlayoffData.teamsMap} />
                    </Grid>
                  ))}
              </Grid>
            </Grid>
          ))}
          <Grid item md={true} xs={12}>
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
