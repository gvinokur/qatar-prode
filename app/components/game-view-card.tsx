'use client'


import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip, FormControlLabel,
  Grid, Switch,
  TextField, Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {Close as MissIcon, Done as HitIcon, DoneAll as HitAllIcon} from "@mui/icons-material";
import {getDateString} from "../../utils/date-utils";
import {ExtendedGameData} from "../definitions";
import {Theme} from "../db/tables-definition";
import {ChangeEvent} from "react";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {LocalizationProvider} from "@mui/x-date-pickers";
import dayjs from "dayjs";

type SharedProps = {
  game: ExtendedGameData
  isPlayoffGame: boolean
  homeTeamNameOrDescription: string
  homeTeamAvatarInfo?: {
    alt: string
    src: string
  }
  homeTeamTheme?: Theme | null
  awayTeamNameOrDescription: string,
  awayTeamAvatarInfo?: {
    alt: string
    src: string
  },
  awayTeamTheme?: Theme | null
  handleScoreChange: (isHomeTeam: boolean) => (e: ChangeEvent<HTMLInputElement>) => void,
}

type GameGuessProps =  {
  isGameGuess: true
  scoreForGame?: number
  homeScore?: number
  awayScore?: number
  editDisabled: boolean
  homePenaltyWinner?: boolean
  awayPenaltyWinner?: boolean
  handlePenaltyWinnerChange: (isHomeTeam: boolean) => (e: ChangeEvent<HTMLInputElement>) => void,
} & SharedProps

type GameResultProps = {
  isGameGuess: false
  handlePenaltyScoreChange: (isHomeTeam: boolean) => (e: ChangeEvent<HTMLInputElement>) => void,
  handleDraftStatusChanged: (e: ChangeEvent<HTMLInputElement>) => void,
  handleGameDateChange: (updatedDate: Date) => void
} & SharedProps

type Props = GameGuessProps | GameResultProps

export default function GameViewCard(
  {
    game,
    homeTeamNameOrDescription,
    homeTeamAvatarInfo,
    homeTeamTheme,
    awayTeamNameOrDescription,
    awayTeamAvatarInfo,
    awayTeamTheme,
    isPlayoffGame,
    handleScoreChange,
    ...specificProps
 } : Props) {
  const theme = useTheme()
  const xsMatch = useMediaQuery('(min-width:900px)')
  const homeScore = specificProps.isGameGuess ? specificProps.homeScore : game.gameResult?.home_score
  const awayScore = specificProps.isGameGuess ? specificProps.awayScore : game.gameResult?.away_score
  const editDisabled = specificProps.isGameGuess ? specificProps.editDisabled : false

  const teamNameCols = 8 - (isPlayoffGame ? 1: 0)
  const teamScoreCols = 4 - (isPlayoffGame && !specificProps.isGameGuess ? 1 : 0)

  return (
    <Card>
      <CardHeader
        title={<Box>
          Partido {game.game_number}
          {specificProps.isGameGuess &&
            Number.isInteger(game.gameResult?.home_score) &&
            Number.isInteger(game.gameResult?.away_score) &&
            Number.isInteger(specificProps.scoreForGame) && (
              <Box sx={{ float: 'right'}} alignSelf='center'>
                {specificProps.scoreForGame === 0 && <Avatar title='Pronostico Errado' sx={{ width: '30px', height: '30px', bgcolor: theme.palette.error.main }}><MissIcon /></Avatar>}
                {specificProps.scoreForGame === 1 && <Avatar title='Pronostico Correcto (1 punto)' sx={{ width: '30px', height: '30px', bgcolor: theme.palette.success.light }}><HitIcon /></Avatar>}
                {specificProps.scoreForGame === 2 && <Avatar title='Resultado Exacto (2 puntos)' sx={{ width: '30px', height: '30px', bgcolor: theme.palette.success.main }}><HitAllIcon /></Avatar>}
              </Box>
            )}
        </Box>}
        subheaderTypographyProps={{
          noWrap: true,
        }}
        subheader={specificProps.isGameGuess && getDateString(game.game_date.toUTCString(), xsMatch)}
        sx={{
          color: theme.palette.primary.main,
          borderBottom: `${theme.palette.primary.light} 1px solid`
        }}
      />
      <CardContent>
        <form autoComplete='off'>
          <Grid container columns={12}>
            {!specificProps.isGameGuess && (
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker value={dayjs(game.game_date)} label={'Game Date'} onChange={(newValue) => {
                    if (newValue) {
                      specificProps.handleGameDateChange(newValue.toDate())
                    }
                  }}/>
                </LocalizationProvider>
              </Grid>
            )}
            <Grid item xs={teamNameCols} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
              <Chip label={homeTeamNameOrDescription}
                    avatar={homeTeamAvatarInfo && (
                      <Avatar alt={homeTeamAvatarInfo.alt}
                              src={homeTeamAvatarInfo.src}
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
                      backgroundColor: homeTeamTheme?.primary_color,
                      color: homeTeamTheme?.secondary_color
                    }}
              />
            </Grid>
            <Grid item xs={teamScoreCols}>
              <TextField
                margin="dense"
                id={`home_score_"${game.id}`}
                type="number"
                fullWidth
                inputProps={{ min: 0}}
                value={!Number.isInteger(homeScore) ? '' : homeScore}
                disabled={editDisabled}
                onChange={handleScoreChange(true)}
              />
            </Grid>
            {isPlayoffGame && specificProps.isGameGuess && (
              <Grid item xs={1} alignSelf='center'>
                <Checkbox disabled={editDisabled ||
                  !Number.isInteger(homeScore) ||
                  !Number.isInteger(awayScore) ||
                  homeScore !== awayScore}
                          id={`home_penalty_score_${game.id}`}
                          checked={specificProps.homePenaltyWinner || false}
                          onChange={specificProps.handlePenaltyWinnerChange(true)}/>
              </Grid>
            )}
            {isPlayoffGame && !specificProps.isGameGuess && (
              <Grid item xs={2} pl={1}>
                <TextField disabled={editDisabled ||
                  !Number.isInteger(homeScore) ||
                  !Number.isInteger(awayScore) ||
                  homeScore !== awayScore}
                           margin="dense"
                           id={`home_penalty_score_${game.id}`}
                           type="number"
                           fullWidth
                           inputProps={{ min: 0}}
                          value={!Number.isInteger(game.gameResult?.home_penalty_score) ? '' : game.gameResult?.home_penalty_score}
                          onChange={specificProps.handlePenaltyScoreChange(true)}/>
              </Grid>
            )}
            <Grid item xs={teamNameCols} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
              <Chip label={awayTeamNameOrDescription}
                    avatar={awayTeamAvatarInfo && (
                      <Avatar alt={awayTeamAvatarInfo.alt}
                              src={awayTeamAvatarInfo.src}
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
                      backgroundColor: awayTeamTheme?.primary_color,
                      color: awayTeamTheme?.secondary_color
                    }}/>
            </Grid>
            <Grid item xs={teamScoreCols}>
              <TextField
                margin="dense"
                id={`away_score_${game.id}`}
                type="number"
                fullWidth
                inputProps={{ min: 0}}
                disabled={editDisabled}
                value={!Number.isInteger(awayScore) ? '' : awayScore}
                onChange={handleScoreChange(false)}
              />
            </Grid>
            {isPlayoffGame && specificProps.isGameGuess && (
              <Grid item xs={1} alignSelf='center'>
                <Checkbox disabled={editDisabled ||
                  !Number.isInteger(homeScore) ||
                  !Number.isInteger(awayScore) ||
                  homeScore !== awayScore}
                          id={`away_penalty_score_${game.id}`}
                          checked={specificProps.awayPenaltyWinner || false}
                          onChange={specificProps.handlePenaltyWinnerChange(false)}/>
              </Grid>
            )}
            {isPlayoffGame && !specificProps.isGameGuess && (
              <Grid item xs={2} pl={1}>
                <TextField disabled={editDisabled ||
                  !Number.isInteger(homeScore) ||
                  !Number.isInteger(awayScore) ||
                  homeScore !== awayScore}
                           margin="dense"
                           id={`away_penalty_score_${game.id}`}
                           type="number"
                           fullWidth
                           inputProps={{ min: 0}}
                           value={!Number.isInteger(game.gameResult?.away_penalty_score) ? '' : game.gameResult?.away_penalty_score}
                           onChange={specificProps.handlePenaltyScoreChange(false)}/>
              </Grid>
            )}
            {!specificProps.isGameGuess && (
              <Grid item xs={12} textAlign={'center'}>
                <FormControlLabel
                  label="Resultado Publicado"
                  control={
                    <Switch
                      checked={game.gameResult ? !game.gameResult.is_draft : false }
                      onChange={specificProps.handleDraftStatusChanged}
                    />
                  }
                />
              </Grid>
              )}
          </Grid>
        </form>
      </CardContent>
      {specificProps.isGameGuess &&
        game.gameResult &&
        Number.isInteger(game.gameResult.home_score) &&
        Number.isInteger(game.gameResult.away_score) && (
          <CardContent sx={{ borderTop: `${theme.palette.primary.contrastText} 1px solid`, backgroundColor: 'secondary.light'}}>
            <Typography variant='body1' component='div' textAlign='center' color='secondary.contrastText'>
              {homeTeamNameOrDescription?.substring(0, 3)}&nbsp;
              {game.gameResult.home_score}&nbsp;
              {Number.isInteger(game.gameResult.home_penalty_score) && `(${game.gameResult.home_penalty_score})`} - &nbsp;
              {Number.isInteger(game.gameResult.away_penalty_score) && `(${game.gameResult.away_penalty_score})`}&nbsp;
              {game.gameResult.away_score}&nbsp;
              {awayTeamNameOrDescription?.substring(0, 3)}
            </Typography>
          </CardContent>
      )}
    </Card>
  )
}
