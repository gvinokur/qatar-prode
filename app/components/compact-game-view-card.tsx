'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  IconButton,
  Tooltip, Divider,
  Checkbox,
  Badge, CircularProgress,
  Chip,
  alpha
} from "@mui/material";
import { Edit as EditIcon, Save as SaveIcon, SaveOutlined as SaveOutlinedIcon, Scoreboard as ScoreboardIcon, EmojiEvents as TrophyIcon, Lock as LockIcon } from "@mui/icons-material";
import { GameResultNew, Theme} from "../db/tables-definition";
import {useState} from "react";
import { useTranslations } from 'next-intl';
import { calculateFinalPoints } from "../utils/point-calculator";
import GameCardPointOverlay from "./game-card-point-overlay";
import GameCountdownDisplay from "./game-countdown-display";
import { ActualResultDisplay } from "./actual-result-display";
import { TeamScoreRow } from "./team-score-row";

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
  const t = useTranslations('predictions');
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
      try {
        await specificProps.onPublishClick(gameNumber);
      } finally {
        setPublishing(false)
      }
    }
  };

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

  // Separate game result from user prediction
  const gameHasResult = 'gameResult' in specificProps && specificProps.gameResult &&
    Number.isInteger(specificProps.gameResult.home_score) &&
    Number.isInteger(specificProps.gameResult.away_score);

  const userHasPrediction = hasResult; // homeScore and awayScore are defined

  // Compute winner for prediction row (C2 styling)
  let predictionHomeIsWinner = false
  let predictionAwayIsWinner = false

  if (specificProps.isGameGuess && hasResult) {
    const h = homeScore!
    const a = awayScore!
    if (h > a) {
      predictionHomeIsWinner = true
    } else if (a > h) {
      predictionAwayIsWinner = true
    } else if (specificProps.homePenaltyWinner) {
      predictionHomeIsWinner = true
    } else if (specificProps.awayPenaltyWinner) {
      predictionAwayIsWinner = true
    }
  }

  // Penalty options for playoff games — computed once, reused for border color and ActualResultDisplay
  const penaltyOpts = isPlayoffGame && specificProps.isGameGuess ? {
    predictedHomePenaltyWinner: specificProps.homePenaltyWinner,
    predictedAwayPenaltyWinner: specificProps.awayPenaltyWinner,
    actualHomePenaltyScore: specificProps.gameResult?.home_penalty_score,
    actualAwayPenaltyScore: specificProps.gameResult?.away_penalty_score,
  } : undefined;

  // Result border styling (only when no boost present and user predicted)
  let resultBorderColor: string | undefined = undefined;
  if (gameHasResult && userHasPrediction && !boostType) {
    const result = calculatePredictionResult(
      homeScore!,
      awayScore!,
      specificProps.gameResult!.home_score!,
      specificProps.gameResult!.away_score!,
      penaltyOpts
    );
    resultBorderColor = result === 'incorrect' ? 'error.main' : 'success.main';
  }

  // Calculate border styling based on priority: Boost > Result > Default
  const cardBorderColor = boostType ? getBoostBorderColor() : (resultBorderColor || 'divider');
  let cardBorderWidth: number;
  if (boostType) {
    cardBorderWidth = 2;
  } else if (resultBorderColor) {
    cardBorderWidth = 2;
  } else {
    cardBorderWidth = 1;
  }

  return (
    <Card
      variant="outlined"
      onClick={!disabled || specificProps.isGameFixture ? handleEditClick : undefined}
      sx={{
        mb: 1,
        borderColor: cardBorderColor,
        borderWidth: cardBorderWidth,
        boxShadow: getBoostShadow(),
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:focus-within': {
          borderColor: 'primary.main',
          boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}33`,
        },
        // Add cursor pointer to entire card when clickable (visual feedback)
        ...(!disabled || specificProps.isGameFixture ? { cursor: 'pointer' } : {})
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
                    <Tooltip title={t(`boost.${boostType}.applied`)}>
                      <Chip
                        icon={<TrophyIcon sx={{ fontSize: 14 }} />}
                        label={boostType === 'golden' ? '3x' : '2x'}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
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
                    <Tooltip title={t('game.editResult')}>
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
                  {disabled && specificProps.isGameGuess && (
                    <Tooltip title={t('game.locked')}>
                      <LockIcon sx={{ color: 'info.main', width: '20px', height: '20px' }}/>
                    </Tooltip>
                  )}
                  {!specificProps.isGameGuess && !disabled && (
                    <Tooltip title={t('game.isPublished')}>
                      <Checkbox
                        size="medium"
                        color={isDraft ? 'warning' : 'success'}
                        checked={!isDraft}
                        icon={publishing? <CircularProgress size={24} color={'secondary'}/> : <SaveOutlinedIcon color="error" />}
                        checkedIcon={publishing? <CircularProgress size={24} color={'secondary'}/> :<SaveIcon />}
                        disabled={publishing}
                        onChange={handleDraftChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Tooltip>
                  )}
                  {/* Hide point overlay when result is shown in ActualResultDisplay badge to avoid duplication */}
                  {specificProps.isGameGuess &&
                    Number.isInteger(specificProps.gameResult?.home_score) &&
                    Number.isInteger(specificProps.gameResult?.away_score) &&
                    Number.isInteger(specificProps.scoreForGame) &&
                    pointCalc &&
                    !gameHasResult && (
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

          {/* "Your Prediction" or "No Prediction" label when game has result */}
          {gameHasResult && (
            <Typography
              variant="body2"
              align="center"
              sx={{ mb: 1, fontWeight: 'medium' }}
              color={userHasPrediction ? 'text.primary' : 'error.main'}
            >
              {userHasPrediction ? t('game.yourPrediction') : t('game.noPrediction')}
            </Typography>
          )}

          {/* Teams and score */}
          <TeamScoreRow
            homeTeamName={homeTeamNameOrDescription}
            awayTeamName={awayTeamNameOrDescription}
            homeScore={hasResult ? homeScore : undefined}
            awayScore={hasResult ? awayScore : undefined}
            homeTeamTheme={homeTeamTheme}
            awayTeamTheme={awayTeamTheme}
            homePenaltyWinner={isPlayoffGame && specificProps.isGameGuess && specificProps.homePenaltyWinner}
            awayPenaltyWinner={isPlayoffGame && specificProps.isGameGuess && specificProps.awayPenaltyWinner}
            homeIsWinner={predictionHomeIsWinner}
            awayIsWinner={predictionAwayIsWinner}
            onClick={handleEditClick}
            clickable={!disabled || specificProps.isGameFixture}
          />

          {/* Penalty scores - shown separately for tournament predictions (fixtures) */}
          {isPlayoffGame && !specificProps.isGameGuess && hasResult &&
            (Number.isInteger(specificProps.homePenaltyScore) || Number.isInteger(specificProps.awayPenaltyScore)) && (
            <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 0.5 }}>
              ({specificProps.homePenaltyScore ?? 0} - {specificProps.awayPenaltyScore ?? 0} pen)
            </Typography>
          )}

          {/* Actual Result Display - shown when game has result (even if user didn't predict) */}
          {gameHasResult && (
            <ActualResultDisplay
              homeTeamName={homeTeamNameOrDescription}
              awayTeamName={awayTeamNameOrDescription}
              homeScore={specificProps.gameResult!.home_score!}
              awayScore={specificProps.gameResult!.away_score!}
              predictionResult={
                homeScore !== undefined && awayScore !== undefined
                  ? calculatePredictionResult(
                      homeScore,
                      awayScore,
                      specificProps.gameResult!.home_score!,
                      specificProps.gameResult!.away_score!,
                      penaltyOpts
                    )
                  : undefined
              }
              homeTeamTheme={homeTeamTheme}
              awayTeamTheme={awayTeamTheme}
              homePenaltyScore={specificProps.gameResult?.home_penalty_score}
              awayPenaltyScore={specificProps.gameResult?.away_penalty_score}
              points={specificProps.isGameGuess && homeScore !== undefined && awayScore !== undefined ? pointCalc?.finalScore : undefined}
              boostType={specificProps.isGameGuess && homeScore !== undefined && awayScore !== undefined ? specificProps.boostType : undefined}
            />
          )}

          {/* In Play message (when past deadline but no result yet) */}
          {specificProps.isGameGuess &&
            gameDate.getTime() < Date.now() &&
            !gameHasResult && (
              <Box sx={{ mt: 1, textAlign: 'center', borderTop: (theme) => `1px solid ${theme.palette.divider}`, pt: 1 }}>
                <Typography variant="body2" color="warning.main">
                  ⚽ {t('game.inPlayOrRecentlyFinished')}
                </Typography>
              </Box>
            )}

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
    </Card>
  );
}

/**
 * Determines prediction accuracy based on predicted vs actual scores.
 *
 * Returns:
 * - 'exact': Predicted scores match actual scores exactly (10 points)
 * - 'correct': Predicted winner matches actual winner, but not exact score (3 points)
 * - 'incorrect': Predicted winner does not match actual winner (0 points)
 *
 * Winner determination:
 * - home > away = home wins
 * - away > home = away wins
 * - home === away = draw
 *
 * Edge cases:
 * - User predicted draw (1-1), actual was draw (0-0) → 'correct' (same winner: draw)
 * - User predicted home win (2-0), actual was draw (1-1) → 'incorrect' (different winner)
 * - User predicted draw (0-0), actual was home win (1-0) → 'incorrect' (different winner)
 * - Playoff game that went to penalties: scores match but wrong penalty winner → 'incorrect'
 * - Playoff game that went to penalties: scores match but no penalty winner predicted → 'incorrect'
 *
 * @param predictedHome - Predicted home team score
 * @param predictedAway - Predicted away team score
 * @param actualHome - Actual home team score
 * @param actualAway - Actual away team score
 * @param penaltyOptions - Optional penalty data for playoff games
 * @returns 'exact' | 'correct' | 'incorrect'
 */
export function calculatePredictionResult(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  penaltyOptions?: {
    predictedHomePenaltyWinner?: boolean;
    predictedAwayPenaltyWinner?: boolean;
    actualHomePenaltyScore?: number | null;
    actualAwayPenaltyScore?: number | null;
  }
): 'exact' | 'correct' | 'incorrect' {
  const {
    predictedHomePenaltyWinner,
    predictedAwayPenaltyWinner,
    actualHomePenaltyScore,
    actualAwayPenaltyScore,
  } = penaltyOptions ?? {};

  // Helper: check penalty winner when game went to penalties (both scores are draws).
  // Returns 'incorrect' if user got the penalty winner wrong or didn't predict one.
  // Returns null if penalty check doesn't apply.
  const penaltyWinnerResult = (): 'incorrect' | null => {
    const gameWentToPenalties =
      actualHomePenaltyScore != null && actualAwayPenaltyScore != null;
    if (!gameWentToPenalties) return null;

    const actualHomePenaltyWins = actualHomePenaltyScore > actualAwayPenaltyScore;
    const userPredictedHomePenaltyWins = predictedHomePenaltyWinner === true;
    const userPredictedAwayPenaltyWins = predictedAwayPenaltyWinner === true;

    if (!userPredictedHomePenaltyWins && !userPredictedAwayPenaltyWins) return 'incorrect';
    if (actualHomePenaltyWins !== userPredictedHomePenaltyWins) return 'incorrect';
    return null;
  };

  // EXACT: Predicted scores match actual scores exactly
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return penaltyWinnerResult() ?? 'exact';
  }

  // Determine winners using explicit conditions
  // Predicted winner
  let predictedWinner: 'home' | 'away' | 'draw';
  if (predictedHome > predictedAway) {
    predictedWinner = 'home';
  } else if (predictedHome < predictedAway) {
    predictedWinner = 'away';
  } else {
    predictedWinner = 'draw';
  }

  // Actual winner
  let actualWinner: 'home' | 'away' | 'draw';
  if (actualHome > actualAway) {
    actualWinner = 'home';
  } else if (actualHome < actualAway) {
    actualWinner = 'away';
  } else {
    actualWinner = 'draw';
  }

  // CORRECT: Predicted winner matches actual winner (not exact score)
  // For draws that went to penalties, also check the penalty winner prediction.
  if (predictedWinner === actualWinner) {
    if (predictedWinner === 'draw') {
      return penaltyWinnerResult() ?? 'correct';
    }
    return 'correct';
  }

  // INCORRECT: Predicted winner does not match actual winner
  return 'incorrect';
}
