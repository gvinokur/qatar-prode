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
import { Theme } from "../db/tables-definition";

type SharedProps = {
  game: ExtendedGameData;
  homeTeamNameOrDescription: string;
  homeTeamTheme?: Theme | null;
  awayTeamNameOrDescription: string;
  awayTeamTheme?: Theme | null;
  isPlayoffGame: boolean;
  onEditClick: (gameNumber: number) => void;
};

type GameGuessProps =  {
  isGameGuess: true
  scoreForGame?: number
  homeScore?: number
  awayScore?: number
  homePenaltyWinner?: boolean
  awayPenaltyWinner?: boolean
  editDisabled?: boolean;
} & SharedProps

type GameResultProps = {
  isGameGuess: false
  onPublishClick?: (game_number: number) => void
} & SharedProps

type CompactGameViewCardProps = GameGuessProps | GameResultProps;

export default function CompactGameViewCard({
  game,
  homeTeamNameOrDescription,
  homeTeamTheme,
  awayTeamNameOrDescription,
  awayTeamTheme,
  isPlayoffGame,
  onEditClick,
  ...specificProps
}: CompactGameViewCardProps) {
  const theme = useTheme();
  const homeScore = specificProps.isGameGuess? specificProps.homeScore : game.gameResult?.home_score;
  const awayScore =  specificProps.isGameGuess? specificProps.awayScore: game.gameResult?.away_score;
  const hasResult = Number.isInteger(homeScore) && Number.isInteger(awayScore);
  const isDraft = game.gameResult?.is_draft;

  const isDisabled = specificProps.isGameGuess  && specificProps.editDisabled;

  const handleEditClick = () => {

    if (game.game_number && !isDisabled) {
      onEditClick(game.game_number);
    }
  };

  const handleDraftChange = () => {
    if (!specificProps.isGameGuess && specificProps.onPublishClick && game.game_number) {
      specificProps.onPublishClick(game.game_number);
    }
  };

  const cardExtraStyles = !isDisabled ? {cursor: 'pointer'} : {}

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
                Game #{game.game_number}
                &nbsp;-&nbsp;
                {getDateString(game.game_date.toUTCString(), false)}
              </Typography>
            </Box>
            {/* Edit button or status */}
            <Box minWidth="40px" textAlign="right">
              {(!specificProps.isGameGuess || !specificProps.editDisabled) && (
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
              {!specificProps.isGameGuess && (
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
                Number.isInteger(game.gameResult?.home_score) &&
                Number.isInteger(game.gameResult?.away_score) &&
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
                    Number.isInteger(game.gameResult?.home_penalty_score) &&
                    ` (${game.gameResult?.home_penalty_score})`}
                  &nbsp;-&nbsp;
                  {awayScore}
                  {isPlayoffGame &&
                    !specificProps.isGameGuess &&
                    Number.isInteger(game.gameResult?.home_penalty_score) &&
                    ` (${game.gameResult?.home_penalty_score})`}
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
              {game.location}
            </Typography>
          </Box>

        </Box>
      </CardContent>
      {specificProps.isGameGuess &&
        game.gameResult &&
        Number.isInteger(game.gameResult.home_score) &&
        Number.isInteger(game.gameResult.away_score) && (
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
              {game.gameResult.home_score}&nbsp;
              {Number.isInteger(game.gameResult.home_penalty_score) && `(${game.gameResult.home_penalty_score})`} - &nbsp;
              {Number.isInteger(game.gameResult.away_penalty_score) && `(${game.gameResult.away_penalty_score})`}&nbsp;
              {game.gameResult.away_score}&nbsp;
              {awayTeamNameOrDescription?.substring(0, 3)}
            </Typography>
          </Box>
        )}
    </Card>
  );
}
