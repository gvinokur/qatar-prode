'use client'

import {Alert, Backdrop, Box, CircularProgress, Divider, Grid, Snackbar, Typography} from "@mui/material";
import {ChangeEvent, useEffect, useState} from "react";
import {ExtendedGameData, ExtendedPlayoffRoundData} from "../../definitions";
import {GameResultNew, Team} from "../../db/tables-definition";
import {getCompletePlayoffData} from "../../actions/tournament-actions";
import BackofficeGameView from "./backoffice-game-view";
import {isTeamWinnerRule} from "../../utils/playoffs-rule-helper";
import {getGameWinner, getGameLoser} from "../../utils/score-utils";
import {LoadingButton} from "@mui/lab";
import {
  calculateGameScores,
  saveGameResults,
  saveGamesData, updateTournamentHonorRoll
} from "../../actions/backoffice-actions";

type Props = {
  tournamentId: string
}

const buildGameResult = (game: ExtendedGameData):GameResultNew => {
  return {
    game_id: game.id,
    is_draft: true,
  }
}

const modifyAffectedTeams = (newGame:ExtendedGameData, newGamesMap: {[k: string]: ExtendedGameData}, gamesMap: {[k: string]: ExtendedGameData}) => {
  const affectedGames = Object.values(gamesMap).filter(g => (
    (g.home_team_rule && isTeamWinnerRule(g.home_team_rule) && g.home_team_rule.game === newGame.game_number) ||
    (g.away_team_rule && isTeamWinnerRule(g.away_team_rule) && g.away_team_rule.game === newGame.game_number)
  ))
  if (affectedGames.length > 0) {
    affectedGames.forEach(g => {
      const gameWithTeam = {...g}
      if (isTeamWinnerRule(g.home_team_rule) && g.home_team_rule.game === newGame.game_number) {
        if (newGame.gameResult && newGame.gameResult.is_draft) {
          gameWithTeam.home_team = null
        } else if (g.home_team_rule.winner) {
          gameWithTeam.home_team = getGameWinner(newGame)
        } else {
          gameWithTeam.home_team = getGameLoser(newGame)
        }
      }
      if (isTeamWinnerRule(g.away_team_rule) && g.away_team_rule.game === newGame.game_number) {
        if (newGame.gameResult && newGame.gameResult.is_draft) {
          gameWithTeam.away_team = null
        } else if (g.away_team_rule.winner) {
          gameWithTeam.away_team = getGameWinner(newGame)
        } else {
          gameWithTeam.away_team = getGameLoser(newGame)
        }
      }
      newGamesMap[gameWithTeam.id] = gameWithTeam
    })
  }
}

export default function PlayoffTab({ tournamentId } :Props) {
  const [playoffStages, setPlayoffStages] = useState<ExtendedPlayoffRoundData[]>()
  const [gamesMap, setGamesMap] = useState<{[k: string]: ExtendedGameData}>({})
  const [teamsMap, setTeamsMap] = useState<{[k:string]:Team}>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)

  useEffect(() => {
    const fetchTournamentData = async () => {
      setLoading(true)
      const completePlayoffData = await getCompletePlayoffData(tournamentId)
      setGamesMap(completePlayoffData.gamesMap)
      setTeamsMap(completePlayoffData.teamsMap)
      setPlayoffStages(completePlayoffData.playoffStages)
      setLoading(false)
    }
    fetchTournamentData()
  }, [tournamentId, setGamesMap, setTeamsMap, setLoading, setPlayoffStages]);

  const handleScoreChange =
    (gameId: string) =>
      (isHomeTeam: boolean) =>
        (e: ChangeEvent<HTMLInputElement>) => {
          const game = gamesMap[gameId]
          let value: number | null = Number.parseInt(e.target.value, 10);
          if(!Number.isInteger(value)) {
            value = null
          }
          if (game) {
            const gameResult: GameResultNew = game.gameResult || buildGameResult(game)
            const newGame: ExtendedGameData = {
              ...game,
              gameResult: {
                ...gameResult,
                [isHomeTeam ? 'home_score' : 'away_score']: value
              }
            }
            const newGamesMap = {
              ...gamesMap,
              [gameId]: newGame
            }
            modifyAffectedTeams(newGame, newGamesMap, gamesMap)
            setGamesMap(newGamesMap)
          }
        }


  const handlePenaltyScoreChange =
    (gameId: string) =>
      (isHomeTeam: boolean) =>
        (e: ChangeEvent<HTMLInputElement>) => {
          const game = gamesMap[gameId]
          let value: number | null = Number.parseInt(e.target.value, 10);
          if(!Number.isInteger(value)) {
            value = null
          }
          if (game) {
            const gameResult: GameResultNew = game.gameResult || buildGameResult(game)
            const newGame = {
              ...game,
              gameResult: {
                ...gameResult,
                [isHomeTeam ? 'home_penalty_score' : 'away_penalty_score']: value
              }
            }
            const newGamesMap = {
              ...gamesMap,
              [gameId]: newGame
            }
            modifyAffectedTeams(newGame, newGamesMap, gamesMap)
            setGamesMap(newGamesMap)
          }
        }

  const handleDraftStatusChanged =
    (gameId: string) =>
      () => {
        const game = gamesMap[gameId]
        if(game) {
          const gameResult: GameResultNew = game.gameResult || buildGameResult(game)
          const newGame = {
            ...game,
            gameResult: {
              ...gameResult,
              is_draft: !gameResult.is_draft
            }
          }
          const newGamesMap = {
            ...gamesMap,
            [gameId]: newGame
          }
          modifyAffectedTeams(newGame, newGamesMap, gamesMap)
          setGamesMap(newGamesMap)
        }
      }

  const handleGameDateChange =  (gameId:string) =>
    (updatedDate: Date) => {
      const game = gamesMap[gameId]
      setGamesMap({
        ...gamesMap,
        [gameId]: {
          ...game,
          game_date: updatedDate
        }
      })
    }

  const handleSaveGameResult = async () => {
    setSaving(true)
    await saveGameResults(Object.values(gamesMap))
    await saveGamesData(Object.values(gamesMap))
    await calculateGameScores(false, false)
    const finalStage = playoffStages?.find(stage => stage.is_final)
    const thirdPlaceStage = playoffStages?.find(stage => stage.is_third_place)
    let champion_team_id: string | null | undefined= null
    let runner_up_team_id: string | null | undefined= null
    let third_place_team_id: string | null | undefined = null
    if (finalStage?.games && !gamesMap[finalStage.games[0].game_id]?.gameResult?.is_draft) {
      //Calculate champion and runner up teams, store them and updated scores
      const finalGame = gamesMap[finalStage.games[0].game_id];
      champion_team_id = getGameWinner(finalGame)
      runner_up_team_id = getGameLoser(finalGame)
    }
    if( thirdPlaceStage?.games && !gamesMap[thirdPlaceStage.games[0].game_id]?.gameResult?.is_draft) {
      //Calculate third place team, store it and updated scores
      const thirdPlaceGame = gamesMap[thirdPlaceStage.games[0].game_id];
      third_place_team_id = getGameWinner(thirdPlaceGame)
    }
    await updateTournamentHonorRoll(tournamentId, { champion_team_id, runner_up_team_id, third_place_team_id })
    setSaving(false)
    setSaved(false)
  }

  return (
    <Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {!loading && playoffStages && playoffStages.map(playoffStage => (
        <Grid container xs={12} spacing={1} key={playoffStage.id}>
          <Grid item xs={12} textAlign={'center'} m={3}>
            <Typography variant={'h5'}>{playoffStage.round_name}</Typography>
          </Grid>
          {playoffStage.games.map(({game_id}) => (
            <Grid item xs={12} md={6} lg={4} key={game_id}>
              <BackofficeGameView
                game={gamesMap[game_id]}
                teamsMap={teamsMap}
                handleScoreChange={handleScoreChange(game_id)}
                handlePenaltyScoreChange={handlePenaltyScoreChange(game_id)}
                handleDraftStatusChanged={handleDraftStatusChanged(game_id)}
                handleGameDateChange={handleGameDateChange(game_id)}
              />
            </Grid>
          ))}
        </Grid>
      ))}
      {!loading && (
        <>
          <LoadingButton loading={saving} variant='contained' size='large' onClick={handleSaveGameResult}
                       sx={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translate(-50%, 0)',
                         display: 'block' }}>Guardar Partidos</LoadingButton>
          <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
            <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
              Los Partidos se guardaron correctamente!
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  )
}
