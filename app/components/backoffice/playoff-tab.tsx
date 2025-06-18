'use client'

import {Alert, Backdrop, Box, CircularProgress, Grid, Snackbar, Typography} from "@mui/material";
import { useEffect, useState} from "react";
import {ExtendedGameData, ExtendedPlayoffRoundData} from "../../definitions";
import {GameResultNew, Team} from "../../db/tables-definition";
import {getCompletePlayoffData} from "../../actions/tournament-actions";
import BackofficeGameView from "./internal/backoffice-game-view";
import {isTeamWinnerRule} from "../../utils/playoffs-rule-helper";
import {getGameWinner, getGameLoser} from "../../utils/score-utils";
import GameResultEditDialog from '../game-result-edit-dialog';
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
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<ExtendedGameData | null>(null);
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

  const handleEditGame = (gameNumber: number) => {
    const gameToEdit = Object.values(gamesMap).find(game => game.game_number === gameNumber);
    if (gameToEdit) {
      setSelectedGame(gameToEdit);
      setEditDialogOpen(true);
    }
  };

  const commitGameResults = async (newGame: ExtendedGameData, newGamesMap: {[k: string]: ExtendedGameData}) => {
    await saveGameResults(Object.values(newGamesMap))
    await saveGamesData(Object.values(newGamesMap))
    await calculateGameScores(false, false)
    const finalStage = playoffStages?.find(stage => stage.is_final)
    const thirdPlaceStage = playoffStages?.find(stage => stage.is_third_place)
    let champion_team_id: string | null | undefined= null
    let runner_up_team_id: string | null | undefined= null
    let third_place_team_id: string | null | undefined = null
    if (finalStage?.games && !newGamesMap[finalStage.games[0].game_id]?.gameResult?.is_draft) {
      //Calculate champion and runner up teams, store them and updated scores
      const finalGame = newGamesMap[finalStage.games[0].game_id];
      champion_team_id = getGameWinner(finalGame)
      runner_up_team_id = getGameLoser(finalGame)
    }
    if( thirdPlaceStage?.games && !newGamesMap[thirdPlaceStage.games[0].game_id]?.gameResult?.is_draft) {
      //Calculate third place team, store it and updated scores
      const thirdPlaceGame = newGamesMap[thirdPlaceStage.games[0].game_id];
      third_place_team_id = getGameWinner(thirdPlaceGame)
    }
    await updateTournamentHonorRoll(tournamentId, { champion_team_id, runner_up_team_id, third_place_team_id })
    modifyAffectedTeams(newGame, newGamesMap, gamesMap)
    setGamesMap(newGamesMap)
    setSaved(true)
  }

  const handleDraftStatusChanged = async (gameNumber: number) => {
    const game = Object.values(gamesMap).find(game => game.game_number === gameNumber);
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
        [game.id]: newGame
      }

      await commitGameResults(newGame, newGamesMap)
    }
  }

  const handleGameResultSave = async (
    gameId: string,
    homeScore?: number | null,
    awayScore?: number | null,
    homePenaltyScore?: number,
    awayPenaltyScore?: number,
    gameDate?: Date
  ) => {

    try {
      const game = gamesMap[gameId];
      if (!game) return;

      const gameResult = game.gameResult || buildGameResult(game);
      const newGame: ExtendedGameData = {
        ...game,
        gameResult: {
          ...gameResult,
          home_score: homeScore !== null ? homeScore : undefined,
          away_score: awayScore !== null ? awayScore : undefined,
          home_penalty_score: homePenaltyScore,
          away_penalty_score: awayPenaltyScore
        }
      };

      // Update game date if provided
      if (gameDate) {
        newGame.game_date = gameDate;
      }

      const newGamesMap = {
        ...gamesMap,
        [gameId]: newGame
      };

      // Save changes immediately
      await commitGameResults(newGame, newGamesMap)
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };


  return (
    <Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {!loading && playoffStages && playoffStages.map(playoffStage => (
        <Grid container spacing={1} key={playoffStage.id} size={12}>
          <Grid textAlign={'center'} m={3} size={12}>
            <Typography variant={'h5'}>{playoffStage.round_name}</Typography>
          </Grid>
          {playoffStage.games.map(({game_id}) => (
            <Grid
              key={game_id}
              size={{
                xs: 12,
                md: 6,
                lg: 4
              }}>
              <BackofficeGameView
                game={gamesMap[game_id]}
                teamsMap={teamsMap}
                onEditClick={handleEditGame}
                onPublishClick={handleDraftStatusChanged}
              />
            </Grid>
          ))}
        </Grid>
      ))}
      {!loading && (
        <>
          <GameResultEditDialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            isGameGuess={false}
            gameId={selectedGame?.id || ''}
            gameNumber={selectedGame?.game_number || 0}
            isPlayoffGame={!!selectedGame?.playoffStage}
            homeTeamName={selectedGame?.home_team ? teamsMap[selectedGame.home_team]?.name || 'Home Team' : 'Home Team'}
            awayTeamName={selectedGame?.away_team ? teamsMap[selectedGame.away_team]?.name || 'Away Team' : 'Away Team'}
            initialHomeScore={selectedGame?.gameResult?.home_score}
            initialAwayScore={selectedGame?.gameResult?.away_score}
            initialHomePenaltyScore={selectedGame?.gameResult?.home_penalty_score}
            initialAwayPenaltyScore={selectedGame?.gameResult?.away_penalty_score}
            initialGameDate={selectedGame?.game_date || new Date()}
            onGameResultSave={handleGameResultSave}
          />
          <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
            <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
              Los Partidos se guardaron correctamente!
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
}
