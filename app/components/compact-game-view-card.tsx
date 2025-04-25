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
  Tooltip, Switch, Divider, Grid
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import {Close as MissIcon, Done as HitIcon, DoneAll as HitAllIcon} from "@mui/icons-material";
import { getDateString } from "../../utils/date-utils";
import { ExtendedGameData } from "../definitions";
import {GameResult, GameResultNew, Theme} from "../db/tables-definition";

type SharedProps = {
  gameNumber: number;
  gameDate: Date;
  location: string;
  homeTeamNameOrDescription: string;
  homeTeamTheme?: Theme | null;
  awayTeamNameOrDescription: string;
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
  onPublishClick?: (game_number: number) => void
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
  homeTeamTheme,
  homeScore,
  awayTeamNameOrDescription,
  awayTeamTheme,
  awayScore,
  isPlayoffGame,
  onEditClick,
  disabled,
  ...specificProps
}: CompactGameViewCardProps) {
  const theme = useTheme();
  const hasResult = Number.isInteger(homeScore) && Number.isInteger(awayScore);

  const handleEditClick = () => {
    if (!disabled) {
      onEditClick(gameNumber);
    }
  };

  const handleDraftChange = () => {
    if (!specificProps.isGameGuess && specificProps.onPublishClick) {
      specificProps.onPublishClick(gameNumber);
    }
  };

  const cardExtraStyles = !disabled ? {cursor: 'pointer'} : {}
  const isDraft = (!specificProps.isGameGuess && specificProps.isDraft)

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        borderColor: isDraft ? theme.palette.warning.light : 'divider',
        backgroundColor: isDraft ? 'rgba(255, 244, 229, 0.1)' : 'background.paper'
      }}
    >

      <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 3 }, ...cardExtraStyles }} onClick={handleEditClick}>
        <Box display="flex" flexDirection={'column'} alignItems="center" justifyContent="space-between" gap={1}>
          {/* Game number and date */}
          <Box display="flex" width='100%'>
            <Box display='flex' flexGrow={1} justifyContent="center" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                Partido #{gameNumber}
                &nbsp;-&nbsp;
                {getDateString(gameDate.toUTCString(), false)}
              </Typography>
            </Box>
            {/* Edit button or status */}
            <Box minWidth="40px" textAlign="right" flexDirection={'row'}>
              {(!disabled) && (
                <Tooltip title="Edit result">
                  <IconButton
                    size="small"
                    onClick={handleEditClick}
                    sx={{ p: 0.5 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {!specificProps.isGameGuess && !disabled && (
                <Tooltip title="Is Published?">
                  <Switch
                    size="small"
                    color="warning"
                    value={!isDraft}
                    sx={{ height: 20, fontSize: '0.6rem' }}
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
          <Grid container spacing={1}>
            {/* Home team */}
            <Grid item xs={5} display="flex" justifyContent="flex-end">
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
            <Grid item xs={2} textAlign={'center'}>
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
            <Grid item xs={5} display="flex">
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
              {homeTeamNameOrDescription?.substring(0, 3)}&nbsp;
              {specificProps.gameResult.home_score}&nbsp;
              {Number.isInteger(specificProps.gameResult.home_penalty_score) && `(${specificProps.gameResult.home_penalty_score})`} - &nbsp;
              {Number.isInteger(specificProps.gameResult.away_penalty_score) && `(${specificProps.gameResult.away_penalty_score})`}&nbsp;
              {specificProps.gameResult.away_score}&nbsp;
              {awayTeamNameOrDescription?.substring(0, 3)}
            </Typography>
          </Box>
        )}
    </Card>
  );
}
