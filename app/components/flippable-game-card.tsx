'use client'

import React, { useRef, useEffect } from 'react';
import { Box, Card, CardContent, useTheme, useMediaQuery } from '@mui/material';
import { useReducedMotion } from 'framer-motion';
import GamePredictionEditControls from './game-prediction-edit-controls';
import GameView from './game-view';
import { ExtendedGameData } from '../definitions';
import { Team } from '../db/tables-definition';

interface FlippableGameCardProps {
  // Game data
  game: ExtendedGameData;
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
  const homeScoreInputRef = useRef<HTMLInputElement | null>(null);
  const awayScoreInputRef = useRef<HTMLInputElement | null>(null);
  const boostButtonGroupRef = useRef<HTMLDivElement | null>(null);

  // Get team info
  const homeTeam = game.home_team ? teamsMap[game.home_team] : null;
  const awayTeam = game.away_team ? teamsMap[game.away_team] : null;
  const homeTeamName = homeTeam?.name || game.home_team || 'TBD';
  const awayTeamName = awayTeam?.name || game.away_team || 'TBD';

  // Flip animation duration (slightly slower on mobile)
  const flipDuration = isMobile ? 0.5 : 0.4;

  const flipVariants = {
    front: {
      rotateY: 0,
      transition: { duration: flipDuration, ease: 'easeInOut' }
    },
    back: {
      rotateY: 180,
      transition: { duration: flipDuration, ease: 'easeInOut' }
    }
  };

  // Handle Escape key to exit edit mode
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEditEnd();
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

  const handleEditClick = (gameNumber: number) => {
    if (!isEditing) {
      onEditStart();
    }
  };

  return (
    <Box
      sx={{
        perspective: '2000px',
        position: 'relative',
        width: '100%'
      }}
      data-game-id={game.id}
      data-editing={isEditing}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          transformStyle: 'preserve-3d',
          transition: prefersReducedMotion ? 'none' : `transform ${flipDuration}s ease-in-out`,
          transform: isEditing ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front: Original card (visible when not editing) */}
        <Box
          sx={{
            backfaceVisibility: 'hidden',
            position: isEditing ? 'absolute' : 'relative',
            width: '100%',
            top: 0,
            left: 0
          }}
        >
          <GameView
            game={game}
            teamsMap={teamsMap}
            handleEditClick={handleEditClick}
            disabled={disabled}
          />
        </Box>

        {/* Back: Edit controls only (visible when editing) */}
        <Box
          sx={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: isEditing ? 'relative' : 'absolute',
            width: '100%',
            top: 0,
            left: 0
          }}
        >
          {isEditing && (
            <Card variant="outlined">
              <CardContent>
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
                  layout="vertical"
                  compact={false}
                  homeScoreInputRef={homeScoreInputRef}
                  awayScoreInputRef={awayScoreInputRef}
                  boostButtonGroupRef={boostButtonGroupRef}
                  onTabFromLastField={onAutoAdvanceNext}
                  onEscapePressed={onEditEnd}
                  retryCallback={retryCallback}
                />
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}
