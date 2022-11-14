import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Avatar, Checkbox
} from "@mui/material";
import {Game, GameGuess} from "../types/definitions";
import {final} from "../data/group-data";
import {ChangeEvent} from "react";
import {calculateScoreForGame} from "../utils/score-calculator";
import {Done as HitIcon, DoneAll as HitAllIcon, Close as MissIcon} from "@mui/icons-material";

type GameViewProps = {
  game: Game,
  gameGuess: GameGuess,
  onGameGuessChange: (gameGuess: GameGuess) => void,
  editDisabled: boolean
}

const GameView = ({game, gameGuess, onGameGuessChange, editDisabled}: GameViewProps) => {
  const theme = useTheme()
  const xsMatch = useMediaQuery('(min-width:900px)')
  const isPlayoffGame = (game.RoundNumber > 3);

  if (!gameGuess) {
    gameGuess = {
      gameId: game.MatchNumber,
      localScore: null,
      awayScore: null,
      localTeam: null,
      awayTeam: null,
      localPenaltyWinner: false,
      awayPenaltyWinner: false
    }
  }

  const handleScoreChange = (home: boolean) => (e: ChangeEvent<HTMLInputElement>) => {
    let value: number | null = Number.parseInt(e.target.value, 10);
    if(!Number.isInteger(value)) {
      value = null
    }

    const newGameGuess = {
      ...gameGuess,
      [home ? 'localScore': 'awayScore']: value,
    }

    if (newGameGuess.localScore !== newGameGuess.awayScore) {
      newGameGuess.localPenaltyWinner = newGameGuess.awayPenaltyWinner = false;
    }

    onGameGuessChange(newGameGuess)
  }

  const handlePenaltyWinnerChange = (home: boolean) => (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;

    onGameGuessChange({
      ...gameGuess,
      [home ? 'localPenaltyWinner': 'awayPenaltyWinner']: newValue,
      // Always set the other one to false
      [!home ? 'localPenaltyWinner': 'awayPenaltyWinner']: false,
    })
  }

  const scoreForGame = calculateScoreForGame(game, gameGuess)
  const teamNameCols = 8 - (isPlayoffGame? 1: 0);
  const scoreCols = 4;

  return (
    <Card>
      <CardHeader
        title={`Partido ${game.MatchNumber}`}
        subheaderTypographyProps={{
          noWrap: true,
        }}
        subheader={new Date(Date.parse(game.DateUtc)).toLocaleString(undefined, {
          weekday: xsMatch ? 'long' : 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
        sx={{
          color: theme.palette.primary.main,
          borderBottom: `${theme.palette.primary.light} 1px solid`
        }}
      />
      <CardContent>
        <form autoComplete='off'>
          <Grid container>
            <Grid item xs={teamNameCols} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
               <Typography
                  variant={"h6"}
                  sx={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}>
                  {game.HomeTeam}</Typography>
            </Grid>
            <Grid item xs={scoreCols}>
              <TextField
                margin="dense"
                id="name"
                type="number"
                fullWidth
                inputProps={{ min: 0}}
                value={gameGuess.localScore === null ? '' : gameGuess.localScore}
                disabled={editDisabled}
                onChange={handleScoreChange(true)}
              />
            </Grid>
            {isPlayoffGame && (
              <Grid item xs={1} alignSelf='center'>
                <Checkbox disabled={editDisabled || gameGuess.localScore !== gameGuess.awayScore}
                          checked={gameGuess.localPenaltyWinner || false}
                          onChange={handlePenaltyWinnerChange(true)}/>
              </Grid>
            )}
            <Grid item xs={4} alignSelf='center' alignItems='center'>
              {typeof game.HomeTeam === 'string' &&
                  <Avatar variant='rounded' title={game.HomeTeam} src={`/flags/${game.HomeTeam.substring(0,3)}.webp`} sx={{
                    width: '36px', height: '24px', float: 'right'
                  }}/>
              }
            </Grid>
            <Grid item xs={4} justifyContent={"center"} textAlign={'center'}><Typography variant={'h5'}>vs</Typography></Grid>
            <Grid item xs={4} alignSelf='center'>
              {typeof game.AwayTeam === 'string' &&
                  <Avatar variant='rounded' title={game.AwayTeam} src={`/flags/${game.AwayTeam.substring(0,3)}.webp`} sx={{
                    width: '36px', height: '24px', float: 'left'
                  }}/>
              }
            </Grid>
            <Grid item xs={teamNameCols} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
              <Typography variant={"h6"} sx={{
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              }}>{game.AwayTeam}</Typography>
            </Grid>
            <Grid item xs={scoreCols}>
              <TextField
                margin="dense"
                id="name"
                type="number"
                fullWidth
                inputProps={{ min: 0}}
                disabled={editDisabled}
                value={gameGuess.awayScore === null ? '' : gameGuess.awayScore}
                onChange={handleScoreChange(false)}
              />
            </Grid>
            {isPlayoffGame && (
              <Grid item xs={1} alignSelf='center'>
                <Checkbox disabled={editDisabled || gameGuess.localScore !== gameGuess.awayScore}
                          checked={gameGuess.awayPenaltyWinner || false}
                          onChange={handlePenaltyWinnerChange(false)}/>
              </Grid>
            )}
          </Grid>
        </form>
      </CardContent>
      {game.HomeTeamScore !== null && game.AwayTeamScore !== null && (
        <CardContent sx={{ borderTop: `${theme.palette.primary.contrastText} 1px solid`, backgroundColor: 'secondary.light'}}>
          <Box sx={{ float: 'right', position: 'absolute'}} alignSelf='center'>
              {scoreForGame === 0 && <MissIcon color='error'/>}
              {scoreForGame === 1 && <HitIcon color='success'/>}
              {scoreForGame === 2 && <HitAllIcon color='success'/>}
          </Box>
          <Typography variant='body1' component='div' textAlign='center' color='secondary.contrastText'>
            {game.HomeTeam} {game.HomeTeamScore} {Number.isInteger(game.HomeTeamPenaltyScore) && `(${game.HomeTeamPenaltyScore})`} -
            {Number.isInteger(game.AwayTeamPenaltyScore) && `(${game.AwayTeamPenaltyScore})`} {game.AwayTeamScore} {game.AwayTeam}
          </Typography>
        </CardContent>
      )}
    </Card>
  )
}

export default GameView;
