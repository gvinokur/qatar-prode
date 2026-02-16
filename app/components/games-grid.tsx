'use client'

import { Grid} from "./mui-wrappers";
import GameView from "./game-view";
import FlippableGameCard from "./flippable-game-card";
import {ExtendedGameData} from "../definitions";
import {Game, GameGuessNew, Team, Tournament} from "../db/tables-definition";
import {useContext, useEffect, useState, useCallback} from "react";
import {GuessesContext} from "./context-providers/guesses-context-provider";
import {useEditMode} from "./context-providers/edit-mode-context-provider";
import GameResultEditDialog from "./game-result-edit-dialog";
import {getTeamDescription} from "../utils/playoffs-rule-helper";
import {useSession} from "next-auth/react";
import {calculateTeamNamesForPlayoffGame} from "../utils/playoff-utils";
import { getGuessLoser, getGuessWinner } from "../utils/score-utils";
import { updateOrCreateTournamentGuess } from "../actions/guesses-actions";

type GamesGridProps =  {
  readonly isPlayoffs: boolean
  readonly games: ExtendedGameData[]
  readonly teamsMap: {[k:string]: Team}
  readonly isLoggedIn?: boolean
  readonly isAwardsPredictionLocked?: boolean
  readonly tournamentId?: string
  readonly dashboardStats?: {
    silverUsed: number;
    goldenUsed: number;
  } | null
  readonly tournament?: Tournament
}

const buildGameGuess = (game: Game, userId: string): GameGuessNew => ({
  game_id: game.id,
  game_number: game.game_number,
  user_id: userId,
  home_score: undefined,
  away_score: undefined,
  home_penalty_winner: false,
  away_penalty_winner: false,
  home_team: undefined,
  away_team: undefined,
  score: undefined
})

export default function GamesGrid({
  teamsMap,
  games,
  isPlayoffs,
  isLoggedIn = true,
  isAwardsPredictionLocked = false,
  tournamentId,
  dashboardStats,
  tournament
}: GamesGridProps) {
  const groupContext = useContext(GuessesContext)
  const editMode = useEditMode()
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<ExtendedGameData | null>(null);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const gameGuesses = groupContext.gameGuesses
  const {data} = useSession()

  // Check if inline editing is enabled (has dashboardStats and tournament info)
  const inlineEditingEnabled = Boolean(dashboardStats && tournament)

  useEffect(() => {
    if(isPlayoffs && data?.user) {
      games.forEach(game => {
        const gameGuess = gameGuesses[game.id] || buildGameGuess(game, data.user.id)
        const result = calculateTeamNamesForPlayoffGame(
          true,
          game,
          gameGuesses,
          Object.fromEntries(games.map(game => [game.id, game]))
        )
        if(result) {
          const {homeTeam, awayTeam} = result
          if (homeTeam !== gameGuess.home_team || awayTeam !== gameGuess.away_team) {
            groupContext.updateGameGuess(gameGuess.game_id, {
              ...gameGuess,
              home_team: homeTeam,
              away_team: awayTeam
            })
          }
        }
      })
    }
    }, [gameGuesses, isPlayoffs, games, groupContext, data])

  const handleEditClick = (gameNumber: number) => {
    if (!isLoggedIn) return;
    const game = games.find(game => game.game_number === gameNumber);
    if(game) {
      if (inlineEditingEnabled) {
        // Use inline editing
        handleEditStart(game.id)
      } else {
        // Use dialog (fallback for urgency accordions or missing data)
        setSelectedGame(game);
        setEditDialogOpen(true);
      }
    }
  };

  const handleEditStart = useCallback(async (gameId: string) => {
    // No need to flush - saves happen immediately when card closes

    // Use EditModeContext if available, otherwise use local state
    if (editMode) {
      await editMode.startEdit(gameId, 'inline');
    }
    setEditingGameId(gameId);
  }, [editMode]);

  const handleEditEnd = useCallback(() => {
    if (editMode) {
      editMode.endEdit();
    }
    setEditingGameId(null);
  }, [editMode]);

  const handleGameResultSave = async (
    gameId: string,
    homeScore?: number,
    awayScore?: number,
    homePenaltyWinner?: boolean,
    awayPenaltyWinner?: boolean,
    boostType?: 'silver' | 'golden' | null
  ) => {
    // Update the game guess
    if (!selectedGame) return;
    const updatedGameGuess = {
      ...(gameGuesses[gameId] || buildGameGuess(selectedGame, data?.user?.id || '')),
      home_score: homeScore,
      away_score: awayScore,
      home_penalty_winner: homePenaltyWinner || false,
      away_penalty_winner: awayPenaltyWinner || false,
      boost_type: boostType
    };
    // Call the context update function
    await groupContext.updateGameGuess(
      gameId,
      updatedGameGuess);

    if(selectedGame.playoffStage?.is_final || selectedGame.playoffStage?.is_third_place) {
      if(!isAwardsPredictionLocked) {
        if(updatedGameGuess?.home_team && updatedGameGuess?.away_team) {
          const winner_team_id = getGuessWinner(updatedGameGuess, updatedGameGuess.home_team, updatedGameGuess.away_team)
          const loser_team_id = getGuessLoser(updatedGameGuess, updatedGameGuess.home_team, updatedGameGuess.away_team)
          if (selectedGame.playoffStage.is_final) {
            await updateOrCreateTournamentGuess({
              user_id: data?.user?.id || '',
              tournament_id: selectedGame.tournament_id,
              champion_team_id: winner_team_id,
              runner_up_team_id: loser_team_id,
            })
          } else if (selectedGame.playoffStage.is_third_place) {
            await updateOrCreateTournamentGuess({
              user_id: data?.user?.id || '',
              tournament_id: selectedGame.tournament_id,
              third_place_team_id: loser_team_id,
            })
          }
        }
      }
    }
  };

  const handleAutoAdvanceNext = useCallback((currentGameId: string) => {
    const idx = games.findIndex(g => g.id === currentGameId);

    // Find next enabled game (skip disabled games)
    for (let i = idx + 1; i < games.length; i++) {
      const nextGame = games[i];
      const ONE_HOUR = 60 * 60 * 1000;
      const isDisabled = Date.now() + ONE_HOUR > nextGame.game_date.getTime();

      if (!isDisabled) {
        handleEditStart(nextGame.id);

        // Scroll to next card
        setTimeout(() => {
          const cardElement = document.querySelector(`[data-game-id="${nextGame.id}"]`);
          cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100); // Delay for flip animation to start

        return;
      }
    }

    // No next enabled game - stay in current card (user can manually close)
  }, [games, handleEditStart]);

  const handleAutoGoPrevious = useCallback((currentGameId: string) => {
    const idx = games.findIndex(g => g.id === currentGameId);

    // Find previous enabled game (skip disabled games)
    for (let i = idx - 1; i >= 0; i--) {
      const prevGame = games[i];
      const ONE_HOUR = 60 * 60 * 1000;
      const isDisabled = Date.now() + ONE_HOUR > prevGame.game_date.getTime();

      if (!isDisabled) {
        handleEditStart(prevGame.id);

        // Scroll to previous card
        setTimeout(() => {
          const cardElement = document.querySelector(`[data-game-id="${prevGame.id}"]`);
          cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100); // Delay for flip animation to start

        return;
      }
    }

    // No previous enabled game - stay in current card (user can manually close)
  }, [games, handleEditStart]);

  const getTeamNames = () => {
    if (!selectedGame) return ({
      homeTeamName: 'Unknown',
      awayTeamName: 'Unknwon'
    })
    const gameGuess = gameGuesses[selectedGame.id]
    const homeTeam = selectedGame.home_team || gameGuess?.home_team
    const awayTeam = selectedGame.away_team || gameGuess?.away_team
    return {
      homeTeamName: homeTeam ? teamsMap[homeTeam].name : getTeamDescription(selectedGame.home_team_rule),
      awayTeamName: awayTeam ? teamsMap[awayTeam].name : getTeamDescription(selectedGame.away_team_rule)
    }
  }

  const {homeTeamName, awayTeamName} = getTeamNames()
  const gameGuess = selectedGame && data?.user && (gameGuesses[selectedGame.id] || buildGameGuess(selectedGame, data?.user?.id))

  return (
    <>
      <Grid container spacing={2}>
        {games
          .map(game => {
            const gameGuess = gameGuesses[game.id]

            return (
              <Grid key={game.game_number} size={{xs:12, sm:6 }}>
                {inlineEditingEnabled ? (
                  <FlippableGameCard
                    game={game}
                    teamsMap={teamsMap}
                    isPlayoffs={isPlayoffs}
                    tournamentId={tournamentId}
                    homeScore={gameGuess?.home_score}
                    awayScore={gameGuess?.away_score}
                    homePenaltyWinner={gameGuess?.home_penalty_winner}
                    awayPenaltyWinner={gameGuess?.away_penalty_winner}
                    boostType={gameGuess?.boost_type}
                    initialBoostType={gameGuess?.boost_type}
                    isEditing={editingGameId === game.id}
                    onEditStart={() => handleEditStart(game.id)}
                    onEditEnd={handleEditEnd}
                    disabled={!isLoggedIn}
                    onAutoAdvanceNext={() => handleAutoAdvanceNext(game.id)}
                    onAutoGoPrevious={() => handleAutoGoPrevious(game.id)}
                  />
                ) : (
                  <GameView
                    game={game}
                    teamsMap={teamsMap}
                    handleEditClick={handleEditClick}
                    disabled={!isLoggedIn}
                  />
                )}
              </Grid>
            )
          })
        }
      </Grid>
      {isLoggedIn && (
        <GameResultEditDialog
          isGameGuess={true}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onGameGuessSave={handleGameResultSave}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          gameId={selectedGame?.id || ''}
          gameNumber={selectedGame?.game_number || 0}
          initialHomeScore={gameGuess?.home_score}
          initialAwayScore={gameGuess?.away_score}
          initialHomePenaltyWinner={gameGuess?.home_penalty_winner}
          initialAwayPenaltyWinner={gameGuess?.away_penalty_winner}
          initialBoostType={gameGuess?.boost_type}
          tournamentId={tournamentId}
          isPlayoffGame={isPlayoffs}
        />
      )}
    </>
  )
}
