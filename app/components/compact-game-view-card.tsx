'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  IconButton,
  Tooltip, Divider, Grid,
  Checkbox,
  Badge, CircularProgress,
  Chip,
  alpha
} from "@mui/material";
import { Edit as EditIcon, Save as SaveIcon, SaveOutlined as SaveOutlinedIcon, Scoreboard as ScoreboardIcon, EmojiEvents as TrophyIcon } from "@mui/icons-material";
import { GameResultNew, Theme} from "../db/tables-definition";
import {useState} from "react";
import {getThemeLogoUrl} from "../utils/theme-utils";
import { calculateFinalPoints } from "../utils/point-calculator";
import GameCardPointOverlay from "./game-card-point-overlay";
import GameCountdownDisplay from "./game-countdown-display";

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
  const hasResult = Number.isInteger(homeScore) && Number.isInteger(awayScore);
  const [publishing, setPublishing] = useState(false);

  // Calculate points for game guess if applicable
  const pointCalc = specificProps.isGameGuess && specificProps.scoreForGame !== undefined
    ? calculateFinalPoints(specificProps.scoreForGame, specificProps.boostType)
    : null;

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
    if (boostType === 'golden') return theme.palette.accent.gold.main;
    if (boostType === 'silver') return theme.palette.accent.silver.main;
    if (isDraft) return theme.palette.warning.light;
    return 'divider';
  };

  const getBoostShadow = () => {
    if (boostType === 'golden') return `0 0 8px ${alpha(theme.palette.accent.gold.main, 0.5)}`;
    if (boostType === 'silver') return `0 0 8px ${alpha(theme.palette.accent.silver.main, 0.5)}`;
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
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:focus-within': {
          borderColor: 'primary.main',
          boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}33`,
        }
      }}
    >
      <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 3 } }}>
        <Box display="flex" flexDirection={'column'} alignItems="center" justifyContent="space-between" gap={1}>
          {/* Game number and date */}
          <Box width='100%' sx={{ position: 'relative' }}>
            <Box display='flex' flexDirection="column" gap={0.5} py={1.5}>
              <GameCountdownDisplay
                gameDate={gameDate}
                gameTimezone={gameTimezone}
                compact={true}
                actions={
                  (!disabled ||
                    specificProps.isGameFixture ||
                    (specificProps.isGameGuess &&
                    Number.isInteger(specificProps.gameResult?.home_score) &&
                    Number.isInteger(specificProps.gameResult?.away_score) &&
                    Number.isInteger(specificProps.scoreForGame))) && (
                    <>
                  {boostType && !(
                    specificProps.isGameGuess &&
                    Number.isInteger(specificProps.gameResult?.home_score) &&
                    Number.isInteger(specificProps.gameResult?.away_score) &&
                    Number.isInteger(specificProps.scoreForGame)
                  ) && (
                    <Tooltip title={`Multiplicador ${boostType === 'golden' ? '3x' : '2x'} aplicado`}>
                      <Chip
                        icon={<TrophyIcon sx={{ fontSize: 14 }} />}
                        label={boostType === 'golden' ? '3x' : '2x'}
                        size="small"
                        sx={{
                          height: '20px',
                          backgroundColor: boostType === 'golden' ? alpha(theme.palette.accent.gold.main, 0.2) : alpha(theme.palette.accent.silver.main, 0.2),
                          color: boostType === 'golden' ? theme.palette.accent.gold.main : theme.palette.accent.silver.main,
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                          '& .MuiChip-icon': {
                            color: boostType === 'golden' ? theme.palette.accent.gold.main : theme.palette.accent.silver.main
                          }
                        }}
                      />
                    </Tooltip>
                  )}
                  {(!disabled) && (
                    <Tooltip title="Editar resultado">
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
                    <Tooltip title="¿Está publicado?">
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
                    Number.isInteger(specificProps.scoreForGame) &&
                    pointCalc && (
                      <Box display="flex" justifyContent="flex-end">
                        <GameCardPointOverlay
                          gameId={gameNumber.toString()}
                          points={pointCalc.finalScore}
                          baseScore={pointCalc.baseScore}
                          multiplier={pointCalc.multiplier}
                          boostType={specificProps.boostType || null}
                          scoreDescription={pointCalc.description}
                        />
                      </Box>
                    )}
                  {specificProps.isGameFixture && (
                      <Box display="flex" justifyContent="flex-end">
                        <Typography variant="body2" color="text.primary" fontWeight="bold">
                          {specificProps.groupOrPlayoffText}
                        </Typography>
                      </Box>
                    )}
                    </>
                  )
                }
              />
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
