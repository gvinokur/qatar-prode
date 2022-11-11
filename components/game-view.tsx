import {Card, CardContent, CardHeader, Grid, TextField, Typography, Box, useMediaQuery, useTheme} from "@mui/material";
import {Game, GameGuess} from "../types/definitions";
import {final} from "../data/group-data";
import {ChangeEvent} from "react";
import {calculateScoreForGame} from "../utils/score-calculator";
import {Done as HitIcon, DoneAll as HitAllIcon, Close as MissIcon} from "@mui/icons-material";

type GameViewProps = {
  game: Game,
  gameGuess: GameGuess,
  onGameGuessChange: (gameGuess: GameGuess) => void,
}

const GameView = ({game, gameGuess, onGameGuessChange}: GameViewProps) => {
  const theme = useTheme()
  const xsMatch = useMediaQuery('(min-width:900px)')

  if (!gameGuess) {
    gameGuess = {
      gameId: game.MatchNumber,
      localScore: null,
      awayScore: null
    }
  }
  const handleScoreChange = (home: boolean) => (e: ChangeEvent<HTMLInputElement>) => {
    let value: number | null = Number.parseInt(e.target.value, 10);
    if(!Number.isInteger(value)) {
      value = null
    }

    onGameGuessChange({
      ...gameGuess,
      [home ? 'localScore': 'awayScore']: value
    })
  }

  const scoreForGame = calculateScoreForGame(game, gameGuess)

  return (
    <Card>
      <CardHeader
        title={`Partido ${game.MatchNumber}`}
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
            <Grid item xs={8} md={9} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
              <Typography variant={"h6"} sx={{
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              }}>{game.HomeTeam}</Typography>
            </Grid>
            <Grid item xs={4} md={3}>
              <TextField
                margin="dense"
                id="name"
                type="number"
                fullWidth
                inputProps={{ min: 0}}
                value={gameGuess.localScore === null ? '' : gameGuess.localScore}
                onChange={handleScoreChange(true)}
              />
            </Grid>
            <Grid item xs={12} justifyContent={"center"} textAlign={'center'}><Typography variant={'h5'}>vs</Typography></Grid>
            <Grid item xs={8} md={9} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
              <Typography variant={"h6"} sx={{
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              }}>{game.AwayTeam}</Typography>
            </Grid>
            <Grid item xs={4} md={3}>
              <TextField
                margin="dense"
                id="name"
                type="number"
                fullWidth
                inputProps={{ min: 0}}
                value={gameGuess.awayScore === null ? '' : gameGuess.awayScore}
                onChange={handleScoreChange(false)}
              />
            </Grid>
          </Grid>
        </form>
      </CardContent>
      {game.HomeTeamScore !== null && game.AwayTeamScore !== null && (
        <CardContent sx={{ borderTop: `${theme.palette.primary.contrastText} 1px solid`, backgroundColor: 'secondary.light'}}>
          <Grid container spacing={1} justifyContent='space-around'>
            <Grid item>
              {scoreForGame === 0 && <MissIcon color='error'/>}
              {scoreForGame === 1 && <HitIcon color='success'/>}
              {scoreForGame === 2 && <HitAllIcon color='success'/>}
            </Grid>
            <Grid item flexGrow={1}>
              <Typography variant='body1' component='div' color='secondary.contrastText' textAlign='lef'>
                Resulado: {game.HomeTeam} {game.HomeTeamScore} - {game.AwayTeamScore} {game.AwayTeam}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      )}
    </Card>
  )
}

export default GameView;
