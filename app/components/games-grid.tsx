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

type GameSections = {
  section: string
  games: ExtendedGameData[]
}

type GamesGridProps = {
  isPlayoffs: false
  games: ExtendedGameData[]
  teamsMap: {[k:string]: Team}
} | {
  isPlayoffs: true
  gameSections: GameSections[]
  teamsMap: {[k:string]: Team}
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

export default function GamesGrid({ teamsMap, ...gamesOrSections }: GamesGridProps) {
  const groupContext = useContext(GuessesContext)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<ExtendedGameData | null>(null);
  const gameGuesses = groupContext.gameGuesses
  const {data} = useSession()
  const games = gamesOrSections.isPlayoffs ? gamesOrSections.gameSections.flatMap(section => section.games) : gamesOrSections.games

  useEffect(() => {
    if(gamesOrSections.isPlayoffs && data?.user) {
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
    }, [gameGuesses, gamesOrSections.isPlayoffs, games, groupContext, data])

  const handleEditClick = (gameNumber: number) => {
    console.log('Edit clicked for game number:', gameNumber);
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
        {!gamesOrSections.isPlayoffs && games
          .map(game => (
            <Grid key={game.game_number} item xs={12} sm={6}>
              <GameView game={game} teamsMap={teamsMap} handleEditClick={handleEditClick}/>
            </Grid>
          ))
        }
        {gamesOrSections.isPlayoffs && gamesOrSections.gameSections.map(section => (
          <Grid item xs={12} key={section.section}>
            <Chip label={section.section}
                  sx={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    typography: 'h5',
                    width: '100%',
                    padding:'24px'
                  }}/>
            <Grid container spacing={2} pt={2} pl={1} pr={1} justifyContent={'space-evenly'}>
              {section.games.map(game => (
                <Grid key={game.game_number} item xs={12} sm={6}>
                  <GameView game={game} teamsMap={teamsMap} handleEditClick={handleEditClick}/>
                </Grid>
              ))}
            </Grid>
          </Grid>
        ))}
      </Grid>
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
        isPlayoffGame={gamesOrSections.isPlayoffs}
      />
  </>
  )
}
