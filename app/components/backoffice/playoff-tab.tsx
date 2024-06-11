'use client'

import {Backdrop, Box, CircularProgress, Divider, Grid, Typography} from "@mui/material";
import {ChangeEvent, useEffect, useState} from "react";
import {ExtendedGameData, ExtendedPlayoffRoundData} from "../../definitions";
import {GameResultNew, Team} from "../../db/tables-definition";
import {getCompleteGroupData, getCompletePlayoffData} from "../../actions/tournament-actions";
import {spacing} from "@mui/system";
import BackofficeGameView from "./backoffice-game-view";
import {isTeamWinnerRule} from "../../utils/playoffs-rule-helper";
import {getGameWinner, getGameLoser} from "../../utils/score-utils";

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
  if (newGame.home_team && newGame.away_team) {
    const affectedGames = Object.values(gamesMap).filter(g => (
      (g.home_team_rule && isTeamWinnerRule(g.home_team_rule) && g.home_team_rule.game === newGame.game_number) ||
      (g.away_team_rule && isTeamWinnerRule(g.away_team_rule) && g.away_team_rule.game === newGame.game_number)
    ))
    if (affectedGames.length > 0) {
      affectedGames.forEach(g => {
        const gameWithTeam = {...g}
        if (isTeamWinnerRule(g.home_team_rule) && g.home_team_rule.game === newGame.game_number) {
          if (g.home_team_rule.winner) {
            gameWithTeam.home_team = getGameWinner(newGame)
          } else {
            gameWithTeam.home_team = getGameLoser(newGame)
          }
        }
        if (isTeamWinnerRule(g.away_team_rule) && g.away_team_rule.game === newGame.game_number) {
          if (g.away_team_rule.winner) {
            gameWithTeam.away_team = getGameWinner(newGame)
          } else {
            gameWithTeam.away_team = getGameLoser(newGame)
          }
        }
        newGamesMap[gameWithTeam.id] = gameWithTeam
      })
    }
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
          console.log('setting penalty score for game', gameId, 'on the', (isHomeTeam ? 'home' : 'away'), 'team, to value', e.target.value)
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
          setGamesMap({
            ...gamesMap,
            [gameId]: {
              ...game,
              gameResult: {
                ...gameResult,
                is_draft: !gameResult.is_draft
              }
            }
          })
        }
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
            <Grid item xs={6} key={game_id}>
              <BackofficeGameView
                game={gamesMap[game_id]}
                teamsMap={teamsMap}
                handleScoreChange={handleScoreChange(game_id)}
                handlePenaltyScoreChange={handlePenaltyScoreChange(game_id)}
                handleDraftStatusChanged={handleDraftStatusChanged(game_id)}
              />
            </Grid>
          ))}
        </Grid>
      ))}
    </Box>
  )
}
