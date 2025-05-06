'use client'

import {Alert, Backdrop, Box, CircularProgress, Grid, Snackbar, useTheme} from "@mui/material";
import {ChangeEvent, useEffect, useState} from "react";
import {ExtendedGameData, ExtendedGroupData} from "../../definitions";
import {getCompleteGroupData} from "../../actions/tournament-actions";
import {
  Game,
  GameResultNew,
  Team,
  TeamStats,
  TournamentGroupTeam,
  TournamentGroupTeamNew
} from "../../db/tables-definition";
import BackofficeGameView from "./internal/backoffice-game-view";
import {
  calculateAndSavePlayoffGamesForTournament,
  calculateAndStoreGroupPosition,
  calculateAndStoreQualifiedTeamsPoints,
  calculateGameScores,
  saveGameResults,
  saveGamesData,
} from "../../actions/backoffice-actions";
import GroupTable from "../groups-page/group-table";
import {DebugObject} from "../debug";
import {calculateGroupPosition} from "../../utils/group-position-calculator";
import {updateTournamentGroupTeams} from "../../db/tournament-group-repository";
import GameResultEditDialog from "../game-result-edit-dialog";
import {getTeamDescription} from "../../utils/playoffs-rule-helper";
import {getTeamByName} from "../../db/team-repository";

type Props = {
  group: ExtendedGroupData
  tournamentId: string
}

const buildGameResult = (game: ExtendedGameData):GameResultNew => {
  return {
    game_id: game.id,
    is_draft: true,
  }
}

export default function GroupBackoffice({group, tournamentId} :Props) {
  const [gamesMap, setGamesMap] = useState<{[k: string]: ExtendedGameData}>({})
  const [sortedGameIds, setSortedGameIds] = useState<string[]>([])
  const [teamsMap, setTeamsMap] = useState<{[k:string]:Team}>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [saved, setSaved] = useState<boolean>(false)
  const [positions, setPositions] = useState<TeamStats[]>([])
  const [editResultDialogOpened, setEditResultDialogOpened] = useState(false)
  const [selectedGame, setSelectedGame] = useState<ExtendedGameData>()


  useEffect(() => {
    const fetchTournamentData = async () => {
      setLoading(true)
      const completeGroupData = await getCompleteGroupData(group.id, true)
      setGamesMap(
        completeGroupData.gamesMap)
      setSortedGameIds(
        Object.values(completeGroupData.gamesMap)
          .sort((a,b) => a.game_number - b.game_number)
          .map(game => game.id))
      setTeamsMap(completeGroupData.teamsMap)
      setLoading(false)
    }
    fetchTournamentData()
  }, [group, setGamesMap, setSortedGameIds, setTeamsMap, setLoading]);

  useEffect(() => {
    const groupPositions = calculateGroupPosition(
      Object.keys(teamsMap),
      Object.values(gamesMap).map(game => ({
        ...game,
        resultOrGuess: game.gameResult
      })),
      group.sort_by_games_between_teams)
    setPositions(groupPositions)

  }, [teamsMap, gamesMap, setPositions, group.sort_by_games_between_teams]);

  const saveGamesAndRecalculate = async (newGamesMap: {[k: string]: ExtendedGameData}) => {
    await saveGameResults(Object.values(newGamesMap))
    await calculateAndSavePlayoffGamesForTournament(tournamentId)
    await saveGamesData(Object.values(newGamesMap))
    await calculateAndStoreGroupPosition(group.id, Object.keys(teamsMap), Object.values(newGamesMap), group.sort_by_games_between_teams)
    await calculateGameScores(false, false)
    await calculateAndStoreQualifiedTeamsPoints(tournamentId)
    setSaved(false)
  }

  const handleGameEditStarted = (gameNumber: number) => {
    setSelectedGame(Object.values(gamesMap).find(game => game.game_number === gameNumber))
    setEditResultDialogOpened(true)
  }

  const handleGamePublishedStatusChanged = async (gameNumber: number) => {
    const game = Object.values(gamesMap).find(game => game.game_number === gameNumber)
    if(game && game.gameResult) {
      const is_draft = !game.gameResult.is_draft
      const newGamesMap = {
        ...gamesMap,
        [game.id]: {
          ...game,
          gameResult: {
            ...game.gameResult,
            is_draft
          }
        }
      }
      await saveGamesAndRecalculate(newGamesMap)
      setGamesMap(newGamesMap)
    }
  }

  const handleSaveGameResult = async (gameId: string, homeScore?: number | null, awayScore?: number | null, homePenaltyScore?: number, awayPenaltyScore?: number, gameDate?: Date) => {
    const game = gamesMap[gameId]
    if (game) {
      const gameResult: GameResultNew = game.gameResult || buildGameResult(game)
      const newGamesMap = {
        ...gamesMap,
        [gameId]: {
          ...game,
          game_date: gameDate || game.game_date,
          gameResult: {
            ...gameResult,
            home_score: homeScore !== null ? homeScore : undefined,
            away_score: awayScore !== null ? awayScore : undefined,
          }
        }
      }
      await saveGamesAndRecalculate(newGamesMap)
      setGamesMap(newGamesMap)
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
      {!loading && (
        <>
          <Grid container spacing={2} size={12}>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <Grid container spacing={1} size={12}>
                {sortedGameIds
                  .map(gameId => (
                    <Grid
                      key={gameId}
                      size={{
                        xs: 12,
                        md: 6
                      }}>
                      <BackofficeGameView
                        game={gamesMap[gameId]}
                        teamsMap={teamsMap}
                        onEditClick={handleGameEditStarted}
                        onPublishClick={handleGamePublishedStatusChanged}
                      />
                    </Grid>
                  ))}
              </Grid>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <GroupTable games={Object.values(gamesMap)} teamsMap={teamsMap} isPredictions={false} realPositions={positions}/>
            </Grid>
          </Grid>
          <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
            <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
              Los Partidos se guardaron correctamente!
            </Alert>
          </Snackbar>
        </>
      )}
      <GameResultEditDialog
        isGameGuess={false}
        onGameResultSave={handleSaveGameResult}
        open={editResultDialogOpened}
        onClose={() => setEditResultDialogOpened(false)}
        gameId={selectedGame?.id || ''}
        gameNumber={selectedGame?.game_number || 0}
        isPlayoffGame={false}
        homeTeamName={selectedGame?.home_team && teamsMap[selectedGame.home_team].name || 'Unknown team'}
        awayTeamName={selectedGame?.away_team && teamsMap[selectedGame.away_team].name || 'Unknown team'}
        initialHomeScore={selectedGame?.gameResult?.home_score}
        initialAwayScore={selectedGame?.gameResult?.away_score}
        initialGameDate={selectedGame?.game_date || new Date()}
      />
    </Box>
  );
}
