'use client'

import {Alert, Backdrop, Box, CircularProgress, Grid, Snackbar, Typography} from "@mui/material";
import { useEffect, useState} from "react";
import {ExtendedGameData, ExtendedPlayoffRoundData} from "../../definitions";
import {Team} from "../../db/tables-definition";
import {getCompletePlayoffData} from "../../actions/tournament-actions";
import BackofficeFlippableGameCard from "./backoffice-flippable-game-card";
import BulkActionsMenu from "./bulk-actions-menu";
import {isTeamWinnerRule} from "../../utils/playoffs-rule-helper";
import {getGameWinner, getGameLoser} from "../../utils/score-utils";
import {
  calculateGameScores,
  saveGameResults,
  saveGamesData, updateTournamentHonorRoll
} from "../../actions/backoffice-actions";

type Props = {
  tournamentId: string
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
  const [saved, setSaved] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

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

  const commitGameResults = async (newGame: ExtendedGameData, newGamesMap: {[k: string]: ExtendedGameData}) => {
    await saveGameResults(Object.values(newGamesMap))
    modifyAffectedTeams(newGame, newGamesMap, gamesMap)
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
    // Only update honor roll if at least one value is a non-empty team ID
    if (champion_team_id || runner_up_team_id || third_place_team_id) {
      await updateTournamentHonorRoll(tournamentId, { champion_team_id, runner_up_team_id, third_place_team_id })
    }
    setGamesMap(newGamesMap)
    setSaved(true)
  }

  const handleSave = async (updatedGame: ExtendedGameData) => {
    try {
      const newGamesMap = {
        ...gamesMap,
        [updatedGame.id]: updatedGame
      };
      await commitGameResults(updatedGame, newGamesMap);
    } catch (error) {
      console.error('Error saving game result:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar el partido');
      throw error;
    }
  };

  const handlePublishToggle = async (gameId: string, isPublished: boolean) => {
    const game = gamesMap[gameId];
    if (game?.gameResult) {
      try {
        const newGame = {
          ...game,
          gameResult: {
            ...game.gameResult,
            is_draft: !isPublished
          }
        };
        const newGamesMap = {
          ...gamesMap,
          [gameId]: newGame
        };
        await commitGameResults(newGame, newGamesMap);
      } catch (err) {
        console.error(`Error changing draft status for game ${gameId}:`, err);
        setError(err instanceof Error ? err.message : 'Error al cambiar el estado de publicación');
        throw err;
      }
    }
  };

  const handleBulkActionsComplete = async () => {
    // Refresh playoff data after bulk operations
    setLoading(true);
    const completePlayoffData = await getCompletePlayoffData(tournamentId);
    setGamesMap(completePlayoffData.gamesMap);
    setTeamsMap(completePlayoffData.teamsMap);
    setPlayoffStages(completePlayoffData.playoffStages);
    setLoading(false);
  };

  return (
    <Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {!loading && playoffStages?.map(playoffStage => (
        <Grid container spacing={1} key={playoffStage.id} size={12}>
          <Grid textAlign={'center'} m={3} size={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Typography variant={'h5'}>{playoffStage.round_name}</Typography>
              <BulkActionsMenu
                playoffRoundId={playoffStage.id}
                sectionName={playoffStage.round_name}
                onComplete={handleBulkActionsComplete}
              />
            </Box>
          </Grid>
          {playoffStage.games.map(({game_id}) => (
            <Grid
              key={game_id}
              size={{
                xs: 12,
                md: 6,
                lg: 4
              }}>
              <BackofficeFlippableGameCard
                game={gamesMap[game_id]}
                teamsMap={teamsMap}
                isPlayoffs={true}
                onSave={handleSave}
                onPublishToggle={handlePublishToggle}
              />
            </Grid>
          ))}
        </Grid>
      ))}
      {!loading && (
        <>
          <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
            <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
              Los Partidos se guardaron correctamente!
            </Alert>
          </Snackbar>
          <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
            <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
              {error || 'Error al guardar los partidos'}
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
}
