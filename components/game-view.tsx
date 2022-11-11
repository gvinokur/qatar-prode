import {Card, CardContent, CardHeader, Grid, TextField, Typography, useTheme} from "@mui/material";
import {Game, GameGuess} from "../types/definitions";
import {final} from "../data/group-data";
import {ChangeEvent} from "react";

type GameViewProps = {
  game: Game,
  gameGuess: GameGuess,
  onGameGuessChange: (gameGuess: GameGuess) => void,
}

const GameView = ({game, gameGuess, onGameGuessChange}: GameViewProps) => {
  const theme = useTheme()
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
  return (
    <Card>
      <CardHeader
        title={`Partido ${game.MatchNumber}`}
        subheader={new Date(Date.parse(game.DateUtc)).toLocaleString(undefined, {
          weekday: 'long',
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
        <Grid container>
          <Grid item xs={9} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
            <Typography variant={"h6"}>{game.HomeTeam}</Typography>
          </Grid>
          <Grid item xs={3}>
            <TextField
              margin="dense"
              id="name"
              type="number"
              fullWidth
              variant="standard"
              inputProps={{ min: 0}}
              value={gameGuess.localScore === null ? '' : gameGuess.localScore}
              onChange={handleScoreChange(true)}
            />
          </Grid>
          <Grid item xs={12} justifyContent={"center"} textAlign={'center'}><Typography variant={'h5'}>vs</Typography></Grid>
          <Grid item xs={9} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
            <Typography variant={"h6"}>{game.AwayTeam}</Typography>
          </Grid>
          <Grid item xs={3}>
            <TextField
              margin="dense"
              id="name"
              type="number"
              fullWidth
              variant="standard"
              inputProps={{ min: 0}}
              value={gameGuess.awayScore === null ? '' : gameGuess.awayScore}
              onChange={handleScoreChange(false)}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default GameView;
