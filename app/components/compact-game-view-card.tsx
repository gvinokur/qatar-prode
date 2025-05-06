'use client'

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
  useTheme,
  IconButton,
  Tooltip, Switch, Divider, Grid,
  Checkbox,
  Badge, CircularProgress
} from "@mui/material";
import {Edit as EditIcon} from "@mui/icons-material";
import {Close as MissIcon, Done as HitIcon, DoneAll as HitAllIcon, Save as SaveIcon, SaveOutlined as SaveOutlinedIcon, Scoreboard as ScoreboardIcon} from "@mui/icons-material";
import { getDateString } from "../utils/date-utils";
import { GameResultNew, Theme} from "../db/tables-definition";
import {useState} from "react";

type SharedProps = {
  gameNumber: number;
  gameDate: Date;
  location: string;
  homeTeamNameOrDescription: string;
  homeTeamShortNameOrDescription?: string;
  homeTeamTheme?: Theme | null;
  awayTeamNameOrDescription: string;
  awayTeamShortNameOrDescription?: string;
  awayTeamTheme?: Theme | null;
  homeScore?: number
  awayScore?: number
  isPlayoffGame: boolean;
  onEditClick: (gameNumber: number) => void;
  disabled?: boolean;
};

type GameGuessProps =  {
  isGameGuess: true
  scoreForGame?: number
  homePenaltyWinner?: boolean
  awayPenaltyWinner?: boolean
  gameResult?: GameResultNew | null
} & SharedProps

type GameResultProps = {
  isGameGuess: false
  onPublishClick?: (gameNumber: number) => Promise<void>
  isDraft?: boolean
  homePenaltyScore?: number
  awayPenaltyScore?: number
} & SharedProps

type CompactGameViewCardProps = GameGuessProps | GameResultProps;

export default function CompactGameViewCard({
  gameNumber,
  gameDate,
  location,
  homeTeamNameOrDescription,
  homeTeamShortNameOrDescription,
  homeTeamTheme,
  homeScore,
  awayTeamNameOrDescription,
  awayTeamShortNameOrDescription,
  awayTeamTheme,
  awayScore,
  isPlayoffGame,
  onEditClick,
  disabled,
  ...specificProps
}: CompactGameViewCardProps) {
  const theme = useTheme();
  const hasResult = Number.isInteger(homeScore) && Number.isInteger(awayScore);
  const [publishing, setPublishing] = useState(false)

  const handleEditClick = () => {
    if (!disabled) {
      onEditClick(gameNumber);
    }
  };

  const handleDraftChange = async () => {
    if (!specificProps.isGameGuess && specificProps.onPublishClick) {
      setPublishing(true)
      await specificProps.onPublishClick(gameNumber);
      setPublishing(false)
    }
  };

  const isClickableStyles = !disabled ? {cursor: 'pointer'} : {}
  const isDraft = (!specificProps.isGameGuess && specificProps.isDraft)

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        borderColor: isDraft ? theme.palette.warning.light : 'divider',
      }}
    >
      <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 3 } }}>
        <Box display="flex" flexDirection={'column'} alignItems="center" justifyContent="space-between" gap={1}>
          {/* Game number and date */}
          <Box width='100%' sx={{ position: 'relative' }}>
            <Box display='flex' flexGrow={1} justifyContent="center" alignItems="center" gap={1} py={1.5}>
              <Typography variant="body2" color="text.secondary">
                Partido #{gameNumber}
                &nbsp;-&nbsp;
                {getDateString(gameDate.toUTCString(), false)}
              </Typography>
            </Box>
            {/* Edit button or status */}
            {(!disabled || (specificProps.isGameGuess &&
              Number.isInteger(specificProps.gameResult?.home_score) &&
              Number.isInteger(specificProps.gameResult?.away_score) &&
              Number.isInteger(specificProps.scoreForGame))) && (
              <Box minWidth="40px" textAlign="right" flexDirection={'row'} alignContent={'center'} height={'100%'} sx={{ position: 'absolute', top: 0, right: 0 }}>
                {(!disabled) && (
                  <Tooltip title="Edit result">
                    <IconButton
                      size={'large'}
                      onClick={handleEditClick}
                    >
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <EditIcon sx={{ width: '16px', height: '16px' }}/>
                        }
                      >
                        <ScoreboardIcon sx={{ width: '20px', height: '20px' }}/>
                      </Badge>
                    </IconButton>
                  </Tooltip>
                )}
                {!specificProps.isGameGuess && !disabled && (
                  <Tooltip title="Is Published?">
                    <Checkbox
                      size="medium"
                      color={isDraft ? 'warning' : 'success'}
                      checked={!isDraft}
                      icon={publishing? <CircularProgress size={24} color={'secondary'}/> : <SaveOutlinedIcon color="error" />}
                      checkedIcon={publishing? <CircularProgress size={24} color={'secondary'}/> :<SaveIcon />}
                      disabled={publishing}
                      onChange={handleDraftChange}
                    />
                  </Tooltip>
                )}
                {specificProps.isGameGuess &&
                  Number.isInteger(specificProps.gameResult?.home_score) &&
                  Number.isInteger(specificProps.gameResult?.away_score) &&
                  Number.isInteger(specificProps.scoreForGame) && (
                    <>
                      {specificProps.scoreForGame === 0 && <Avatar title='Pronostico Errado' sx={{ width: '20px', height: '20px', bgcolor: theme.palette.error.main }}><MissIcon sx={{ fontSize: 14 }} /></Avatar>}
                      {specificProps.scoreForGame === 1 && <Avatar title='Pronostico Correcto (1 punto)' sx={{ width: '20px', height: '20px', bgcolor: theme.palette.success.light }}><HitIcon sx={{ fontSize: 14 }} /></Avatar>}
                      {specificProps.scoreForGame === 2 && <Avatar title='Resultado Exacto (2 puntos)' sx={{ width: '20px', height: '20px', bgcolor: theme.palette.success.main }}><HitAllIcon sx={{ fontSize: 14 }} /></Avatar>}
                    </>
                  )}
              </Box>
            )}
          </Box>

          <Divider
            variant={'fullWidth'}
            color={theme.palette.primary.main}
            sx={{
              width: '100%',
              mb: 2,
            }}
          />

          {/* Teams and score */}
          <Grid container spacing={1} sx={isClickableStyles} onClick={handleEditClick}>
            {/* Home team */}
            <Grid display="flex" justifyContent="flex-end" alignItems={'center'} size={5}>
              <Typography
                variant="body2"
                fontWeight="medium"
                textAlign="left"
                sx={{
                  ml: 1,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {homeTeamNameOrDescription}
              </Typography>
              {homeTeamTheme?.logo && (
                <img
                  src={homeTeamTheme.logo}
                  alt={homeTeamNameOrDescription}
                  height={'24px'}
                  style={{ marginLeft: '4px' }}
                />
              )}
              {isPlayoffGame &&
                specificProps.isGameGuess &&
                specificProps.homePenaltyWinner &&
                '(x)'}
            </Grid>

            {/* Score */}
            <Grid
              display={'flex'}
              justifyContent={'space-around'}
              alignItems={'center'}
              size={2}>
              {hasResult ? (
                <Typography variant="body2" fontWeight="bold">
                  {homeScore}
                  {isPlayoffGame &&
                    !specificProps.isGameGuess &&
                    Number.isInteger(specificProps.homePenaltyScore) &&
                    ` (${specificProps.homePenaltyScore})`}
                  &nbsp;-&nbsp;
                  {awayScore}
                  {isPlayoffGame &&
                    !specificProps.isGameGuess &&
                    Number.isInteger(specificProps.awayPenaltyScore) &&
                    ` (${specificProps.awayPenaltyScore})`}
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  vs
                </Typography>
              )}
            </Grid>

            {/* Away team */}
            <Grid display="flex" alignItems={'center'} size={5}>
              {isPlayoffGame &&
                specificProps.isGameGuess &&
                specificProps.awayPenaltyWinner &&
                '(x)'}
              {awayTeamTheme?.logo && (
                <img
                  src={awayTeamTheme.logo}
                  alt={awayTeamNameOrDescription}
                  height={'24px'}
                  style={{ marginRight: '4px' }}
                />
              )}
              <Typography
                variant="body2"
                fontWeight="medium"
                textAlign="left"
                sx={{
                  ml: 1,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {awayTeamNameOrDescription}
              </Typography>
            </Grid>
          </Grid>

          <Divider
            variant={'fullWidth'}
            color={theme.palette.primary.main}
            sx={{
              width: '100%',
              mt: 2,
              mb: 1
            }}
          />

          <Box display='flex' justifyContent="center" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              {location}
            </Typography>
          </Box>

        </Box>
      </CardContent>
      {specificProps.isGameGuess &&
        specificProps.gameResult &&
        Number.isInteger(specificProps.gameResult.home_score) &&
        Number.isInteger(specificProps.gameResult.away_score) && (
          <Box
            sx={{
              borderTop: `${theme.palette.divider} 1px solid`,
              backgroundColor: 'secondary.light',
              py: 0.5,
              px: 1,
              textAlign: 'center'
            }}
          >
            <Typography variant='caption' component='div' color='secondary.contrastText'>
              {homeTeamShortNameOrDescription}&nbsp;
              {specificProps.gameResult.home_score}&nbsp;
              {Number.isInteger(specificProps.gameResult.home_penalty_score) && `(${specificProps.gameResult.home_penalty_score})`} - &nbsp;
              {Number.isInteger(specificProps.gameResult.away_penalty_score) && `(${specificProps.gameResult.away_penalty_score})`}&nbsp;
              {specificProps.gameResult.away_score}&nbsp;
              {awayTeamShortNameOrDescription?.substring(0, 3)}
            </Typography>
          </Box>
        )}
      {specificProps.isGameGuess &&
        gameDate < new Date() &&
        !(specificProps.gameResult &&
          Number.isInteger(specificProps.gameResult.home_score) &&
          Number.isInteger(specificProps.gameResult.away_score)) && (
          <Box
            sx={{
              borderTop: `${theme.palette.divider} 1px solid`,
              backgroundColor: 'secondary.light',
              py: 0.5,
              px: 1,
              textAlign: 'center'
            }}
          >
            <Typography variant='caption' component='div' color='secondary.contrastText'>
              IN PLAY OR RECENTLY FINISHED
            </Typography>
          </Box>
        )}
    </Card>
  );
}
