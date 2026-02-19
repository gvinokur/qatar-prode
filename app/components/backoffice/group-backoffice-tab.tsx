'use client'

import {Alert, Box, Button, Grid, Paper, Snackbar, Typography} from "@mui/material";
import { useEffect, useState} from "react";
import { useLocale } from 'next-intl';
import { toLocale } from '../../utils/locale-utils';
import {ExtendedGameData, ExtendedGroupData} from "../../definitions";
import {getCompleteGroupData} from "../../actions/tournament-actions";
import { BackofficeTabsSkeleton } from "../skeletons";
import {
  Team,
  TeamStats
} from "../../db/tables-definition";
import BackofficeFlippableGameCard from "./backoffice-flippable-game-card";
import BulkActionsMenu from "./bulk-actions-menu";
import {
  calculateAndSavePlayoffGamesForTournament,
  calculateAndStoreGroupPosition,
  calculateGameScores,
  saveGameResults,
  saveGamesData,
  updateGroupTeamConductScores,
} from "../../actions/backoffice-actions";
import { calculateAndStoreQualifiedTeamsScores } from "../../actions/qualified-teams-scoring-actions";
import TeamStandingsCards from "../groups-page/team-standings-cards";
import {calculateGroupPosition} from "../../utils/group-position-calculator";
import TeamStatsEditDialog from "./internal/team-stats-edit-dialog";
import EditIcon from "@mui/icons-material/Edit";

type Props = {
  group: ExtendedGroupData
  tournamentId: string
}

export default function GroupBackoffice({group, tournamentId} :Props) {
  const locale = toLocale(useLocale());
  const [gamesMap, setGamesMap] = useState<{[k: string]: ExtendedGameData}>({})
  const [sortedGameIds, setSortedGameIds] = useState<string[]>([])
  const [teamsMap, setTeamsMap] = useState<{[k:string]:Team}>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [saved, setSaved] = useState<boolean>(false)
  const [positions, setPositions] = useState<TeamStats[]>([])
  const [editStatsDialogOpened, setEditStatsDialogOpened] = useState(false)
  const [conductScores, setConductScores] = useState<{ [teamId: string]: number }>({})

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

      // Load conduct scores from team positions
      const scores: { [teamId: string]: number } = {};
      completeGroupData.teamPositions.forEach(teamStats => {
        scores[teamStats.team_id] = teamStats.conduct_score || 0;
      });
      setConductScores(scores);

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
    await calculateGameScores(false, false, locale)
    await calculateAndStoreQualifiedTeamsScores(tournamentId)
    setSaved(false)
  }

  const handleSave = async (updatedGame: ExtendedGameData) => {
    const newGamesMap = {
      ...gamesMap,
      [updatedGame.id]: updatedGame
    };
    await saveGamesAndRecalculate(newGamesMap);
    setGamesMap(newGamesMap);
  };

  const handlePublishToggle = async (gameId: string, isPublished: boolean) => {
    const game = gamesMap[gameId];
    if (game && game.gameResult) {
      const newGamesMap = {
        ...gamesMap,
        [gameId]: {
          ...game,
          gameResult: {
            ...game.gameResult,
            is_draft: !isPublished
          }
        }
      };
      await saveGamesAndRecalculate(newGamesMap);
      setGamesMap(newGamesMap);
    }
  };

  const handleBulkActionsComplete = async () => {
    // Refresh group data after bulk operations
    setLoading(true);
    const completeGroupData = await getCompleteGroupData(group.id, true);
    setGamesMap(completeGroupData.gamesMap);
    setSortedGameIds(
      Object.values(completeGroupData.gamesMap)
        .sort((a, b) => a.game_number - b.game_number)
        .map(game => game.id)
    );
    setLoading(false);
  };

  const handleOpenStatsDialog = () => {
    setEditStatsDialogOpened(true);
  };

  const handleSaveConductScores = async (newConductScores: { [teamId: string]: number }) => {
    await updateGroupTeamConductScores(group.id, newConductScores);
    setConductScores(newConductScores);

    // Recalculate group positions with new conduct scores
    await calculateAndStoreGroupPosition(
      group.id,
      Object.keys(teamsMap),
      Object.values(gamesMap),
      group.sort_by_games_between_teams
    );
    await calculateGameScores(false, false, locale);
    await calculateAndStoreQualifiedTeamsScores(tournamentId);
    setSaved(true);
  };

  return (
    <Box>
      {loading ? (
        <BackofficeTabsSkeleton />
      ) : (
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
                      <BackofficeFlippableGameCard
                        game={gamesMap[gameId]}
                        teamsMap={teamsMap}
                        isPlayoffs={false}
                        onSave={handleSave}
                        onPublishToggle={handlePublishToggle}
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
              <Box mb={2} sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleOpenStatsDialog}
                  size="small"
                >
                  Edit Conduct Scores
                </Button>
                <BulkActionsMenu
                  groupId={group.id}
                  sectionName={`Group ${group.group_letter}`}
                  onComplete={handleBulkActionsComplete}
                />
              </Box>
              <Paper elevation={2} sx={{ p: 2 }} data-testid="group-table">
                <Typography variant="h6" gutterBottom>
                  Tabla de Posiciones
                </Typography>
                <TeamStandingsCards
                  teamStats={positions}
                  teamsMap={teamsMap}
                  qualifiedTeams={[]}
                />
              </Paper>
            </Grid>
          </Grid>
          <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
            <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
              Los Partidos se guardaron correctamente!
            </Alert>
          </Snackbar>
        </>
      )}
      <TeamStatsEditDialog
        open={editStatsDialogOpened}
        onClose={() => setEditStatsDialogOpened(false)}
        teams={teamsMap}
        teamIds={Object.keys(teamsMap)}
        conductScores={conductScores}
        onSave={handleSaveConductScores}
      />
    </Box>
  );
}
