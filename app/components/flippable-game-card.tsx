'use client'

import React, { useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  useTheme,
  IconButton,
  Tooltip,
  CircularProgress,
  alpha,
  useMediaQuery
} from '@mui/material';
import { Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import GamePredictionEditControls from './game-prediction-edit-controls';
import GameCountdownDisplay from './game-countdown-display';
import { Game } from '../db/tables-definition';
import { getThemeLogoUrl } from '../utils/theme-utils';

interface Team {
  name: string;
  theme?: any;
}

interface FlippableGameCardProps {
  // Game data
  game: Game;
  teamsMap: Record<string, Team>;
  isPlayoffs: boolean;
  tournamentId?: string;

  // Current guess values (from parent's context)
  homeScore?: number;
  awayScore?: number;
  homePenaltyWinner?: boolean;
  awayPenaltyWinner?: boolean;
  boostType?: 'silver' | 'golden' | null;
  initialBoostType?: 'silver' | 'golden' | null;

  // Edit state
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;

  // Edit callbacks (parent handles context updates)
  onHomeScoreChange: (value?: number) => void;
  onAwayScoreChange: (value?: number) => void;
  onHomePenaltyWinnerChange: (checked: boolean) => void;
  onAwayPenaltyWinnerChange: (checked: boolean) => void;
  onBoostTypeChange: (type: 'silver' | 'golden' | null) => void;

  // Boost counts for edit controls
  silverUsed: number;
  silverMax: number;
  goldenUsed: number;
  goldenMax: number;

  // State indicators (from parent's context)
  isPending: boolean; // pendingSaves.has(game.id)
  error?: string | null; // saveErrors[game.id]

  // Disabled state
  disabled?: boolean;

  // Auto-advance
  onAutoAdvanceNext?: () => void;

  // Retry callback
  retryCallback?: () => void;
}

export default function FlippableGameCard({
  game,
  teamsMap,
  isPlayoffs,
  tournamentId,
  homeScore,
  awayScore,
  homePenaltyWinner,
  awayPenaltyWinner,
  boostType,
  initialBoostType,
  isEditing,
  onEditStart,
  onEditEnd,
  onHomeScoreChange,
  onAwayScoreChange,
  onHomePenaltyWinnerChange,
  onAwayPenaltyWinnerChange,
  onBoostTypeChange,
  silverUsed,
  silverMax,
  goldenUsed,
  goldenMax,
  isPending,
  error,
  disabled = false,
  onAutoAdvanceNext,
  retryCallback
}: FlippableGameCardProps) {
  const theme = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Refs for keyboard navigation
  const homeScoreInputRef = useRef<HTMLInputElement>(null);
  const awayScoreInputRef = useRef<HTMLInputElement>(null);
  const boostButtonGroupRef = useRef<HTMLDivElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  // Get team info
  const homeTeam = game.home_team ? teamsMap[game.home_team] : null;
  const awayTeam = game.away_team ? teamsMap[game.away_team] : null;
  const homeTeamName = homeTeam?.name || game.home_team || 'TBD';
  const awayTeamName = awayTeam?.name || game.away_team || 'TBD';

  const hasResult = Number.isInteger(homeScore) && Number.isInteger(awayScore);

  // Flip animation duration (slightly slower on mobile)
  const flipDuration = isMobile ? 0.5 : 0.4;

  const flipVariants = {
    front: {
      rotateY: 0,
      transition: { duration: flipDuration, ease: 'easeInOut' },
      backfaceVisibility: 'hidden' as const
    },
    back: {
      rotateY: 180,
      transition: { duration: flipDuration, ease: 'easeInOut' },
      backfaceVisibility: 'hidden' as const
    }
  };

  // Handle Escape key to exit edit mode
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEditEnd();
        setTimeout(() => editButtonRef.current?.focus(), 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, onEditEnd]);

  // Focus home input when entering edit mode
  useEffect(() => {
    if (isEditing && homeScoreInputRef.current) {
      setTimeout(() => homeScoreInputRef.current?.focus(), flipDuration * 1000);
    }
  }, [isEditing, flipDuration]);

  return (
    <Card
      variant="outlined"
      sx={{ position: 'relative' }}
      data-game-id={game.id}
      data-editing={isEditing}
    >
      <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 3 } }}>
        {/* Header: ALWAYS VISIBLE (no flip) */}
        <GameCountdownDisplay
          gameDate={game.game_date}
          gameNumber={game.game_number}
          gameTimezone={game.game_local_timezone}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mb: 1 }}>
          {/* Edit button */}
          <Tooltip title={isEditing ? 'Close' : 'Edit prediction'}>
            <IconButton
              ref={editButtonRef}
              size="small"
              onClick={isEditing ? onEditEnd : onEditStart}
              disabled={disabled}
              aria-label={isEditing ? 'Close edit' : `Edit prediction for ${homeTeamName} vs ${awayTeamName}`}
              aria-expanded={isEditing}
            >
              {isEditing ? <CloseIcon /> : <EditIcon />}
            </IconButton>
          </Tooltip>

          {/* Save indicator */}
          {isPending && (
            <CircularProgress size={16} />
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Flippable Content Area */}
        <Box sx={{ perspective: '1000px', position: 'relative', minHeight: '120px' }}>
          <AnimatePresence mode="sync" initial={false}>
            {!isEditing ? (
              // Front side: Teams and scores display
              <motion.div
                key="front"
                layoutId={`game-${game.id}-content`}
                initial={prefersReducedMotion ? false : "back"}
                animate="front"
                exit="back"
                variants={prefersReducedMotion ? {} : flipVariants}
                style={{
                  position: 'absolute',
                  width: '100%',
                  transformStyle: 'preserve-3d'
                }}
              >
                <Grid container spacing={1}>
                  {/* Home team */}
                  <Grid size={5} display="flex" justifyContent="flex-end" alignItems="center">
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{
                        ml: 1,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {homeTeamName}
                    </Typography>
                    {(() => {
                      const logoUrl = getThemeLogoUrl(homeTeam?.theme);
                      return logoUrl && (
                        <img
                          src={logoUrl}
                          alt={homeTeamName}
                          height="24px"
                          style={{ marginLeft: '6px' }}
                        />
                      );
                    })()}
                    {isPlayoffs && homePenaltyWinner && '(x)'}
                  </Grid>

                  {/* Score */}
                  <Grid size={2} display="flex" justifyContent="space-around" alignItems="center">
                    {hasResult ? (
                      <Typography variant="body2" fontWeight="bold">
                        {homeScore}&nbsp;-&nbsp;{awayScore}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        vs
                      </Typography>
                    )}
                  </Grid>

                  {/* Away team */}
                  <Grid size={5} display="flex" alignItems="center">
                    {isPlayoffs && awayPenaltyWinner && '(x)'}
                    {(() => {
                      const logoUrl = getThemeLogoUrl(awayTeam?.theme);
                      return logoUrl && (
                        <img
                          src={logoUrl}
                          alt={awayTeamName}
                          height="24px"
                          style={{ marginRight: '6px' }}
                        />
                      );
                    })()}
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{
                        ml: 1,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {awayTeamName}
                    </Typography>
                  </Grid>
                </Grid>
              </motion.div>
            ) : (
              // Back side: Edit controls
              <motion.div
                key="back"
                layoutId={`game-${game.id}-content`}
                initial={prefersReducedMotion ? false : "front"}
                animate="back"
                exit="front"
                variants={prefersReducedMotion ? {} : flipVariants}
                style={{
                  position: 'absolute',
                  width: '100%',
                  transform: 'rotateY(180deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Un-flip content so text is readable */}
                <Box sx={{ transform: 'scaleX(-1)' }}>
                  <GamePredictionEditControls
                    gameId={game.id}
                    homeTeamName={homeTeamName}
                    awayTeamName={awayTeamName}
                    isPlayoffGame={isPlayoffs}
                    tournamentId={tournamentId}
                    homeScore={homeScore}
                    awayScore={awayScore}
                    homePenaltyWinner={homePenaltyWinner}
                    awayPenaltyWinner={awayPenaltyWinner}
                    boostType={boostType}
                    initialBoostType={initialBoostType}
                    silverUsed={silverUsed}
                    silverMax={silverMax}
                    goldenUsed={goldenUsed}
                    goldenMax={goldenMax}
                    onHomeScoreChange={onHomeScoreChange}
                    onAwayScoreChange={onAwayScoreChange}
                    onHomePenaltyWinnerChange={onHomePenaltyWinnerChange}
                    onAwayPenaltyWinnerChange={onAwayPenaltyWinnerChange}
                    onBoostTypeChange={onBoostTypeChange}
                    loading={isPending}
                    error={error}
                    layout="horizontal"
                    compact
                    homeScoreInputRef={homeScoreInputRef}
                    awayScoreInputRef={awayScoreInputRef}
                    boostButtonGroupRef={boostButtonGroupRef}
                    onTabFromLastField={onAutoAdvanceNext}
                    onEscapePressed={onEditEnd}
                    retryCallback={retryCallback}
                  />
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        <Divider sx={{ mt: 2 }} />

        {/* Footer: Location */}
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {game.location}
          </Typography>
        </Box>

        {/* Overlay during save */}
        {isPending && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              pointerEvents: 'none',
              borderRadius: 1
            }}
          />
        )}

        {/* Accessibility: Screen reader announcement */}
        {isEditing && (
          <Box
            component="div"
            sx={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
            role="status"
            aria-live="polite"
          >
            Editing prediction. Press Escape to cancel.
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
