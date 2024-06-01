'use client'

import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Box,
  useMediaQuery,
  useTheme,
  Avatar, Checkbox, Chip
} from "@mui/material";

import {Done as HitIcon, DoneAll as HitAllIcon, Close as MissIcon} from "@mui/icons-material";
import {ChangeEvent, useContext, useEffect, useState} from "react";
import {calculateScoreForGame} from "../utils/game-score-calculator";
import {getDateString} from "../../utils/date-utils";
import {ExtendedGameData} from "../definitions";
import {Game, GroupFinishRule, PlayoffRound, Team, TeamWinnerRule} from "../db/tables-definition";
import {GuessesContext} from "./context-providers/guesses-context-provider";
import {getLoser, getWinner} from "../utils/score-utils";

type GameViewProps = {
  game: ExtendedGameData,
  teamsMap: {[k:string]: Team}
  isFinal?: boolean
  isThirdPlace?: boolean
}

const isGroupFinishRule = (object: any): object is GroupFinishRule => {
  return ('position' in object && 'group' in object);
}

const isTeamWinnerRule = (object: any): object is TeamWinnerRule => {
  return ('winner' in object && 'game' in object);
}

const buildGameGuess = (game: Game) => ({
  game_id: game.id,
  game_number: game.game_number,
  user_id: '',//TODO: Fix this!!!
  home_score: undefined,
  away_score: undefined,
  home_team: game.home_team,
  away_team: game.away_team,
  home_penalty_winner: false,
  away_penalty_winner: false
})

const GameView = ({game, teamsMap, isFinal, isThirdPlace}: GameViewProps) => {
  const theme = useTheme()
  const xsMatch = useMediaQuery('(min-width:900px)')
  const isPlayoffGame = (!!game.playoffStage);
  const groupContext = useContext(GuessesContext)
  const gameGuesses = groupContext.gameGuesses
  const [calculatedHomeTeam, setCalculatedHomeTeam] = useState<string | undefined>()
  const [calculatedAwayTeam, setCalculatedAwayTeam] = useState<string | undefined>()
  const gameGuess = gameGuesses[game.id] || buildGameGuess(game)

  useEffect(()=> {
    /**
     * Recalculate the home and away teams for playoffs of rounds below the first playoff round every time
     * a guess in the playoffs change.
     * Only do this before the games have been played and an actual team exists.
      */

    if (isPlayoffGame && !game.home_team && !game.away_team) {
      let homeTeam
      let awayTeam
      const homeTeamRule = game.home_team_rule
      if(isTeamWinnerRule(homeTeamRule)) {
        const gameGuess = Object.values(gameGuesses)
          .find(guess => guess.game_number === homeTeamRule.game)


        if(gameGuess) {
          homeTeam = homeTeamRule.winner ?
            getWinner(gameGuess, gameGuess?.home_team, gameGuess?.away_team) :
            getLoser(gameGuess, gameGuess?.home_team, gameGuess?.away_team)
        }
      }
      const awayTeamRule = game.away_team_rule
      if(isTeamWinnerRule(awayTeamRule)) {
        const gameGuess = Object.values(gameGuesses)
          .find(guess => guess.game_number === awayTeamRule.game)

        if(gameGuess) {
          awayTeam = awayTeamRule.winner ?
            getWinner(gameGuess, gameGuess?.home_team, gameGuess?.away_team) :
            getLoser(gameGuess, gameGuess?.home_team, gameGuess?.away_team)
        }
      }
      if(homeTeam !== gameGuess.home_team || awayTeam !== gameGuess.away_team) {
        groupContext.updateGameGuess(gameGuess.game_id, {
          ...gameGuess,
          home_team: homeTeam,
          away_team: awayTeam
        }, isFinal, isThirdPlace)
      }
    }
  }, [isPlayoffGame, gameGuesses, gameGuess, game, setCalculatedHomeTeam, setCalculatedAwayTeam, groupContext, isFinal, isThirdPlace])


  const handleScoreChange = (home: boolean) => (e: ChangeEvent<HTMLInputElement>) => {
    let value: number | null = Number.parseInt(e.target.value, 10);
    if(!Number.isInteger(value)) {
      value = null
    }

    const newGameGuess = {
      ...gameGuess,
      [home ? 'home_score': 'away_score']: value,
    }

    if (newGameGuess.home_score !== newGameGuess.away_score) {
      newGameGuess.home_penalty_winner = newGameGuess.away_penalty_winner = false;
    }

    groupContext.updateGameGuess(game.id, newGameGuess, isFinal, isThirdPlace)
  }

  const handlePenaltyWinnerChange = (home: boolean) => (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;

    groupContext.updateGameGuess(game.id, {
      ...gameGuess,
      [home ? 'home_penalty_winner': 'away_penalty_winner']: newValue,
      // Always set the other one to false
      [!home ? 'home_penalty_winner': 'away_penalty_winner']: false,
    }, isFinal, isThirdPlace)
  }

  const getTeamDescription = (rule?: GroupFinishRule | TeamWinnerRule) => {
    if(isGroupFinishRule(rule)) {
      if (rule.position === 1) {
        return `Primero Grupo ${rule.group}`
      } else if (rule.position === 2) {
        return `Segundo Grupo ${rule.group}`
      } else if (rule.position === 3) {
        return `Tercero Grupo(s) ${rule.group}`
      }
    } else if (isTeamWinnerRule(rule)){
      if (rule.winner) {
        return `Ganador del Partido ${rule.game}`
      } else {
        return `Perdedor del Partido ${rule.game}`
      }
    }
    return ''
  }

  const editDisabled = (Date.now() > game.game_date.getTime())
  const scoreForGame = calculateScoreForGame(game, gameGuess)
  const teamNameCols = 8 - (isPlayoffGame? 1: 0)
  const scoreCols = 4;
  const homeTeam = game.home_team || gameGuess.home_team
  const awayTeam = game.away_team || gameGuess.away_team
  // TODO: Calculate actual winner from result!!
  const winnerTeam = getWinner(gameGuess, homeTeam, awayTeam)
  const isHomeWinner = homeTeam === winnerTeam
  const isAwayWinner = awayTeam === winnerTeam

  const homeAvatarInfo =
    isFinal ?
      ( isHomeWinner ? {alt:'Campeon', src:'/gold-medal.png'} :
        (isAwayWinner ? {alt:'Subampeon', src:'/silver-medal.png'} : undefined) ) :
      ( isThirdPlace ? (isHomeWinner ? {alt:'Tercero', src:'/bronze-medal.png'} : undefined) : undefined)


  const awayAvatarInfo =
    isFinal ?
      ( isAwayWinner ? {alt:'Campeon', src:'/gold-medal.png'} :
        (isHomeWinner ? {alt:'Subampeon', src:'/silver-medal.png'} : undefined) ) :
      ( isThirdPlace ? (isAwayWinner ? {alt:'Tercero', src:'/bronze-medal.png'} : undefined) : undefined)

  return (
    <Card>
      <CardHeader
        title={<Box>
          Partido {game.game_number}
          {Number.isInteger(game.gameResult?.home_score) &&
            Number.isInteger(game.gameResult?.away_score) && (
            <Box sx={{ float: 'right'}} alignSelf='center'>
              {scoreForGame === 0 && <Avatar title='Pronostico Errado' sx={{ width: '30px', height: '30px', bgcolor: theme.palette.error.main }}><MissIcon /></Avatar>}
              {scoreForGame === 1 && <Avatar title='Pronostico Correcto (1 punto)' sx={{ width: '30px', height: '30px', bgcolor: theme.palette.success.light }}><HitIcon /></Avatar>}
              {scoreForGame === 2 && <Avatar title='Resultado Exacto (2 puntos)' sx={{ width: '30px', height: '30px', bgcolor: theme.palette.success.main }}><HitAllIcon /></Avatar>}
            </Box>
          )}
        </Box>}
        subheaderTypographyProps={{
          noWrap: true,
        }}
        subheader={getDateString(game.game_date.toUTCString(), xsMatch)}
        sx={{
          color: theme.palette.primary.main,
          borderBottom: `${theme.palette.primary.light} 1px solid`
        }}
      />
      <CardContent>
        <form autoComplete='off'>
          <Grid container columns={12}>
            <Grid item xs={teamNameCols} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
              <Chip label={homeTeam ? teamsMap[homeTeam].name : getTeamDescription(game.home_team_rule)}
                    avatar={homeAvatarInfo && (
                      <Avatar alt={homeAvatarInfo.alt}
                              src={homeAvatarInfo.src}
                              variant={'rounded'}
                      />
                    )}
                    sx={{
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      typography:'h6',
                      height: '80%',
                      width: '90%',
                      backgroundColor: homeTeam && teamsMap[homeTeam]?.theme?.primary_color,
                      color: homeTeam && teamsMap[homeTeam]?.theme?.secondary_color
                    }}
              />
            </Grid>
            <Grid item xs={scoreCols}>
              <TextField
                margin="dense"
                id="name"
                type="number"
                fullWidth
                inputProps={{ min: 0}}
                value={gameGuess.home_score === null ? '' : gameGuess.home_score}
                disabled={editDisabled}
                onChange={handleScoreChange(true)}
              />
            </Grid>
            {isPlayoffGame && (
              <Grid item xs={1} alignSelf='center'>
                <Checkbox disabled={editDisabled ||
                  !Number.isInteger(gameGuess.home_score) ||
                  !Number.isInteger(gameGuess.away_score) ||
                  gameGuess.home_score !== gameGuess.away_score}
                          checked={gameGuess.home_penalty_winner || false}
                          onChange={handlePenaltyWinnerChange(true)}/>
              </Grid>
            )}
            <Grid item xs={teamNameCols} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
              <Chip label={awayTeam ? teamsMap[awayTeam].name : getTeamDescription(game.away_team_rule)}
                    avatar={awayAvatarInfo && (
                      <Avatar alt={awayAvatarInfo.alt}
                              src={awayAvatarInfo.src}
                              variant={'rounded'}
                      />
                    )}
                    sx={{
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      typography:'h6',
                      height: '80%',
                      width: '90%',
                      backgroundColor: awayTeam && teamsMap[awayTeam]?.theme?.primary_color,
                      color: awayTeam && teamsMap[awayTeam]?.theme?.secondary_color
                    }}/>
            </Grid>
            <Grid item xs={scoreCols}>
              <TextField
                margin="dense"
                id="name"
                type="number"
                fullWidth
                inputProps={{ min: 0}}
                disabled={editDisabled}
                value={gameGuess.away_score === null ? '' : gameGuess.away_score}
                onChange={handleScoreChange(false)}
              />
            </Grid>
            {isPlayoffGame && (
              <Grid item xs={1} alignSelf='center'>
                <Checkbox disabled={editDisabled ||
                  !Number.isInteger(gameGuess.home_score) ||
                  !Number.isInteger(gameGuess.away_score) ||
                  gameGuess.home_score !== gameGuess.away_score}
                          checked={gameGuess.away_penalty_winner || false}
                          onChange={handlePenaltyWinnerChange(false)}/>
              </Grid>
            )}
          </Grid>
        </form>
      </CardContent>
      {/*{game.localScore !== null && game.awayScore !== null && (*/}
      {/*  <CardContent sx={{ borderTop: `${theme.palette.primary.contrastText} 1px solid`, backgroundColor: 'secondary.light'}}>*/}
      {/*    <Typography variant='body1' component='div' textAlign='center' color='secondary.contrastText'>*/}
      {/*      {(game.CalculatedHomeTeam || (typeof game.HomeTeam === "string" && game.HomeTeam) || '')?.substring(0, 3)}&nbsp;*/}
      {/*      {game.localScore}&nbsp;*/}
      {/*      {Number.isInteger(game.localPenaltyScore) && `(${game.localPenaltyScore})`} - &nbsp;*/}
      {/*      {Number.isInteger(game.awayPenaltyScore) && `(${game.awayPenaltyScore})`}&nbsp;*/}
      {/*      {game.awayScore}&nbsp;*/}
      {/*      {(game.CalculatedAwayTeam || (typeof game.AwayTeam === "string" && game.AwayTeam) || '')?.substring(0, 3)}*/}
      {/*    </Typography>*/}
      {/*  </CardContent>*/}
      {/*)}*/}
    </Card>
  )
}

export default GameView;
