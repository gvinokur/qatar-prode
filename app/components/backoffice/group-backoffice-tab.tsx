'use client'

import {Alert, Backdrop, Box, CircularProgress, Grid, Snackbar, useTheme} from "@mui/material";
import {ChangeEvent, useEffect, useState} from "react";
import {ExtendedGameData, ExtendedGroupData} from "../../definitions";
import {getCompleteGroupData, getCompleteTournament} from "../../actions/tournament-actions";
import {GameResultNew, Team} from "../../db/tables-definition";
import BackofficeGameView from "./backoffice-game-view";
import {LoadingButton} from "@mui/lab";
import {
  calculateAndSavePlayoffGamesForTournament,
  saveGameResults,
  saveGamesData
} from "../../actions/backoffice-actions";
import GroupTable from "../groups-page/group-table";
import {DebugObject} from "../debug";

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
  const [saving, setSaving] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)


  useEffect(() => {
    const fetchTournamentData = async () => {
      setLoading(true)
      const completeGroupData = await getCompleteGroupData(group.id, true)
      setGamesMap(
        Object.fromEntries(
          completeGroupData.games.map(game => [game.id, game])
        ))
      setSortedGameIds(
        completeGroupData.games
          .sort((a,b) => a.game_number - b.game_number)
          .map(game => game.id))
      setTeamsMap(completeGroupData.teamsMap)
      setLoading(false)
    }
    fetchTournamentData()
  }, [group, setGamesMap, setSortedGameIds, setTeamsMap, setLoading]);

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
            setGamesMap({
              ...gamesMap,
              [gameId]: {
                ...game,
                gameResult: {
                  ...gameResult,
                  [isHomeTeam ? 'home_score' : 'away_score']: value
                }
              }
            })
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
            setGamesMap({
              ...gamesMap,
              [gameId]: {
                ...game,
                gameResult: {
                  ...gameResult,
                  [isHomeTeam ? 'home_penalty_score' : 'away_penalty_score']: value
                }
              }
            })
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

  const handleSaveGameResult = async () => {
    setSaving(true)
    await saveGameResults(Object.values(gamesMap))
    await calculateAndSavePlayoffGamesForTournament(tournamentId)
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
      {!loading && (
        <>
          <Grid container xs={12} spacing={2}>
            <Grid item xs={12} md={6}>
              <Grid container xs={12} spacing={1}>
                {sortedGameIds
                  .map(gameId => (
                    <Grid item xs={6} key={gameId}>
                      <BackofficeGameView
                        game={gamesMap[gameId]}
                        teamsMap={teamsMap}
                        handleScoreChange={handleScoreChange(gameId)}
                        handlePenaltyScoreChange={handlePenaltyScoreChange(gameId)}
                        handleDraftStatusChanged={handleDraftStatusChanged(gameId)}
                      />
                    </Grid>
                  ))}
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <GroupTable games={Object.values(gamesMap)} teamsMap={teamsMap} isPredictions={false}/>
            </Grid>
          </Grid>
          <LoadingButton loading={saving} variant='contained' size='large' onClick={handleSaveGameResult}
              sx={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translate(-50%, 0)',
                display: 'block' }}>Guardar Resultados</LoadingButton>
          <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
            <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
              Los resultados se guardaron correctamente!
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  )
}
