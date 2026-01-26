'use client'

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  IconButton,
  Tooltip, Divider, Grid,
  Checkbox,
  Badge, CircularProgress,
  Chip
} from "@mui/material";
import { Edit as EditIcon, Close as MissIcon, Done as HitIcon, DoneAll as HitAllIcon, Save as SaveIcon, SaveOutlined as SaveOutlinedIcon, Scoreboard as ScoreboardIcon, EmojiEvents as TrophyIcon, Star as StarIcon } from "@mui/icons-material";
import { getUserLocalTime, getLocalGameTime } from "../utils/date-utils";
import { GameResultNew, Theme} from "../db/tables-definition";
import {useState} from "react";
import {getThemeLogoUrl} from "../utils/theme-utils";
import { useTimezone } from './context-providers/timezone-context-provider';

type SharedProps = {
  gameNumber: number;
  gameDate: Date;
  location: string;
  gameTimezone?: string;
  homeTeamNameOrDescription: string;
  homeTeamShortNameOrDescription?: string;
  homeTeamTheme?: Theme | null;
  awayTeamNameOrDescription: string;
  awayTeamShortNameOrDescription?: string;
  awayTeamTheme?: Theme | null;
  homeScore?: number
  awayScore?: number
  isPlayoffGame: boolean;
  onEditClick: (_gameNumber: number) => void;
  disabled?: boolean;
};

type GameGuessProps =  {
  isGameGuess: true
  isGameFixture: false
  scoreForGame?: number
  homePenaltyWinner?: boolean
  awayPenaltyWinner?: boolean
  gameResult?: GameResultNew | null
  boostType?: 'silver' | 'golden' | null
} & SharedProps

type GameResultProps = {
  isGameGuess: false
  isGameFixture: false
  onPublishClick?: (_gameNumber: number) => Promise<void>
  isDraft?: boolean
  homePenaltyScore?: number
  awayPenaltyScore?: number
} & SharedProps

type GameFixtureProps = {
  isGameFixture: true
  isGameGuess: false
  homePenaltyScore?: number
  awayPenaltyScore?: number
  groupOrPlayoffText: string
  isDraft?: boolean
} & SharedProps

type CompactGameViewCardProps = GameGuessProps | GameResultProps | GameFixtureProps;

export default function CompactGameViewCard({
  gameNumber,
  gameDate,
  location,
  gameTimezone,
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
  const { showLocalTime, toggleTimezone } = useTimezone();
  const hasResult = Number.isInteger(homeScore) && Number.isInteger(awayScore);
  const [publishing, setPublishing] = useState(false)

  const handleEditClick = () => {
    if (!disabled || specificProps.isGameFixture) {
      onEditClick(gameNumber);
    }
  };

  const handleDraftChange = async () => {
    if (!specificProps.isGameGuess && !specificProps.isGameFixture && specificProps.onPublishClick) {
      setPublishing(true)
      await specificProps.onPublishClick(gameNumber);
      setPublishing(false)
    }
  };

  const isClickableStyles = (!disabled || specificProps.isGameFixture) ? {cursor: 'pointer'} : {}
  const isDraft = (!specificProps.isGameGuess && specificProps.isDraft)
  const boostType = specificProps.isGameGuess ? specificProps.boostType : null

  // Boost styling
  const getBoostBorderColor = () => {
    if (boostType === 'golden') return '#FFD700'; // Gold
    if (boostType === 'silver') return '#C0C0C0'; // Silver
    if (isDraft) return theme.palette.warning.light;
    return 'divider';
  };

  const getBoostShadow = () => {
    if (boostType === 'golden') return '0 0 8px rgba(255, 215, 0, 0.5)';
    if (boostType === 'silver') return '0 0 8px rgba(192, 192, 192, 0.5)';
    return 'none';
  };

  let logoUrl = null

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        borderColor: getBoostBorderColor(),
        borderWidth: boostType ? 2 : 1,
        boxShadow: getBoostShadow(),
      }}
    >
      <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 3 } }}>
        <Box display="flex" flexDirection={'column'} alignItems="center" justifyContent="space-between" gap={1}>
          {/* Game number and date */}
          <Box width='100%' sx={{ position: 'relative' }}>
            <Box display='flex' flexGrow={1} justifyContent="space-between" alignItems="center" gap={1} py={1.5}>
              <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  #{gameNumber} - {showLocalTime ? getUserLocalTime(gameDate) : getLocalGameTime(gameDate, gameTimezone)}
                </Typography>
                <Tooltip title={`Mostrar en ${showLocalTime ? 'horario local' : 'tu horario'}`}>
                  <Typography
                    variant="body2"
                    color='text.secondary'
                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={toggleTimezone}
                  >
                    {showLocalTime ? 'Tu Horario' : 'Horario Local'}
                  </Typography>
                </Tooltip>
              </Box>
              {/* Edit button or status */}
              {(!disabled || 
                specificProps.isGameFixture ||
                (specificProps.isGameGuess &&
                Number.isInteger(specificProps.gameResult?.home_score) &&
                Number.isInteger(specificProps.gameResult?.away_score) &&
                Number.isInteger(specificProps.scoreForGame))) && (
                <Box minWidth="86px" textAlign="right" flexDirection={'row'} alignContent={'center'} height={'100%'} display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                  {boostType && (
                    <Tooltip title={`${boostType === 'golden' ? '3x' : '2x'} Boost aplicado`}>
                      <Chip
                        icon={boostType === 'golden' ? <TrophyIcon sx={{ fontSize: 14 }} /> : <StarIcon sx={{ fontSize: 14 }} />}
                        label={boostType === 'golden' ? '3x' : '2x'}
                        size="small"
                        sx={{
                          height: '20px',
                          backgroundColor: boostType === 'golden' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(192, 192, 192, 0.2)',
                          color: boostType === 'golden' ? '#FFD700' : '#C0C0C0',
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                          '& .MuiChip-icon': {
                            color: boostType === 'golden' ? '#FFD700' : '#C0C0C0'
                          }
                        }}
                      />
                    </Tooltip>
                  )}
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
                      <Box display="flex" justifyContent="flex-end">
                        {specificProps.scoreForGame === 0 && <Avatar title='Pronostico Errado' sx={{ width: '20px', height: '20px', bgcolor: theme.palette.error.light }}><MissIcon sx={{ fontSize: 14 }} /></Avatar>}
                        {specificProps.scoreForGame === 1 && <Avatar title='Pronostico Correcto (1 punto)' sx={{ width: '20px', height: '20px', bgcolor: theme.palette.success.light }}><HitIcon sx={{ fontSize: 14 }} /></Avatar>}
                        {specificProps.scoreForGame === 2 && <Avatar title='Resultado Exacto (2 puntos)' sx={{ width: '20px', height: '20px', bgcolor: theme.palette.success.main }}><HitAllIcon sx={{ fontSize: 14 }} /></Avatar>}
                      </Box>
                    )}
                  {specificProps.isGameFixture && (
                      <Box display="flex" justifyContent="flex-end">
                        <Typography variant="body2" color="text.primary" fontWeight="bold">
                          {specificProps.groupOrPlayoffText}
                        </Typography>
                      </Box>
                    )}
                </Box>
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
          <Grid
            container
            spacing={1}
            sx={isClickableStyles}
            onClick={handleEditClick}
            width='100%'
          >
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
              {(() => {
                logoUrl = getThemeLogoUrl(homeTeamTheme);
                return logoUrl && (
                  <img
                    src={logoUrl}
                    alt={homeTeamNameOrDescription}
                    height={'24px'}
                    style={{ marginLeft: '6px' }}
                  />
                );
              })()}
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
              {(() => {
                logoUrl = getThemeLogoUrl(awayTeamTheme);
                return logoUrl && (
                  <img
                    src={logoUrl}
                    alt={awayTeamNameOrDescription}
                    height={'24px'}
                    style={{ marginRight: '6px' }}
                  />
                );
              })()}
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
        gameDate.getTime() < Date.now() &&
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
