'use client'


import {Chip, Grid} from "./mui-wrappers";
import GameView from "./game-view";
import {ExtendedGameData} from "../definitions";
import {Game, GameGuess, GameGuessNew, Team} from "../db/tables-definition";
import {useContext, useEffect, useState} from "react";
import {GuessesContext} from "./context-providers/guesses-context-provider";
import GameResultEditDialog from "./game-result-edit-dialog";
import {getTeamDescription} from "../utils/playoffs-rule-helper";
import {useSession} from "next-auth/react";
import {calculateTeamNamesForPlayoffGame} from "../utils/playoff-teams-calculator";

type GamesGridProps =  {
  isPlayoffs: boolean
  games: ExtendedGameData[]
  teamsMap: {[k:string]: Team}
  isLoggedIn?: boolean
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

export default function GamesGrid({ teamsMap, games, isPlayoffs, isLoggedIn = true }: GamesGridProps) {
  const groupContext = useContext(GuessesContext)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<ExtendedGameData | null>(null);
  const gameGuesses = groupContext.gameGuesses
  const {data} = useSession()


  useEffect(() => {
    if(isPlayoffs && data?.user) {
      games.forEach(game => {
        const gameGuess = gameGuesses[game.id] || buildGameGuess(game, data.user.id)
        const result = calculateTeamNamesForPlayoffGame(
          true,
          game,
          gameGuesses,
          Object.fromEntries(games.map(game => [game.id, game])),
          gameGuess
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
      setSelectedGame(game);
      setEditDialogOpen(true);
    }
  };

  const handleGameResultSave = async (
    gameId: string,
    homeScore?: number,
    awayScore?: number,
    homePenaltyWinner?: boolean,
    awayPenaltyWinner?: boolean
  ) => {
    // Update the game guess
    if (!selectedGame) return;
    const updatedGameGuess = {
      ...(gameGuesses[gameId] || buildGameGuess(selectedGame, data?.user?.id || '')),
      home_score: homeScore,
      away_score: awayScore,
      home_penalty_winner: homePenaltyWinner || false,
      away_penalty_winner: awayPenaltyWinner || false
    };
    // Call the context update function
    await groupContext.updateGameGuess(
      gameId,
      updatedGameGuess);
  };

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
          .map(game => (
            <Grid key={game.game_number} size={{xs:12, sm:6 }}>
              <GameView game={game} teamsMap={teamsMap} handleEditClick={handleEditClick} disabled={!isLoggedIn}/>
            </Grid>
          ))
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
          isPlayoffGame={isPlayoffs}
        />
      )}
    </>
  )
}
