'use client'

import React, { useRef, useEffect, useState, useContext } from 'react';
import { Box, Card, CardContent, useTheme, useMediaQuery } from '@mui/material';
import { useReducedMotion } from 'framer-motion';
import GamePredictionEditControls from './game-prediction-edit-controls';
import GameView from './game-view';
import { ExtendedGameData } from '../definitions';
import { Team } from '../db/tables-definition';
import { GuessesContext } from './context-providers/guesses-context-provider';

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

  // Boost counts for edit controls
  silverUsed: number;
  silverMax: number;
  goldenUsed: number;
  goldenMax: number;

  // Disabled state
  disabled?: boolean;

  // Auto-advance
  onAutoAdvanceNext?: () => void;
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
  silverUsed,
  silverMax,
  goldenUsed,
  goldenMax,
  disabled = false,
  onAutoAdvanceNext
}: FlippableGameCardProps) {
  const theme = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const groupContext = useContext(GuessesContext);

  // Local edit state (only used during editing)
  const [editHomeScore, setEditHomeScore] = useState<number | undefined>(homeScore);
  const [editAwayScore, setEditAwayScore] = useState<number | undefined>(awayScore);
  const [editHomePenaltyWinner, setEditHomePenaltyWinner] = useState<boolean>(homePenaltyWinner || false);
  const [editAwayPenaltyWinner, setEditAwayPenaltyWinner] = useState<boolean>(awayPenaltyWinner || false);
  const [editBoostType, setEditBoostType] = useState<'silver' | 'golden' | null>(boostType || null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  // Initialize local state when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditHomeScore(homeScore);
      setEditAwayScore(awayScore);
      setEditHomePenaltyWinner(homePenaltyWinner || false);
      setEditAwayPenaltyWinner(awayPenaltyWinner || false);
      setEditBoostType(boostType || null);
      setSaveError(null);
    }
  }, [isEditing, homeScore, awayScore, homePenaltyWinner, awayPenaltyWinner, boostType]);

  // Save changes and close edit mode
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      // Get current guess from context
      const currentGuess = groupContext.gameGuesses[game.id];

      // Update context with new values (triggers save)
      await groupContext.updateGameGuess(game.id, {
        ...currentGuess,
        game_id: game.id,
        game_number: game.game_number,
        user_id: currentGuess?.user_id || '',
        home_score: editHomeScore,
        away_score: editAwayScore,
        home_penalty_winner: editHomePenaltyWinner,
        away_penalty_winner: editAwayPenaltyWinner,
        boost_type: editBoostType
      }, { immediate: true });

      // Success - close edit mode
      onEditEnd();
    } catch (error: any) {
      // Show error, stay in edit mode
      setSaveError(error.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel changes and close edit mode
  const handleCancel = () => {
    // Discard local changes
    setEditHomeScore(homeScore);
    setEditAwayScore(awayScore);
    setEditHomePenaltyWinner(homePenaltyWinner || false);
    setEditAwayPenaltyWinner(awayPenaltyWinner || false);
    setEditBoostType(boostType || null);
    setSaveError(null);

    // Close edit mode
    onEditEnd();
  };

  // Handle Escape key to cancel
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

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
                  homeScore={editHomeScore}
                  awayScore={editAwayScore}
                  homePenaltyWinner={editHomePenaltyWinner}
                  awayPenaltyWinner={editAwayPenaltyWinner}
                  boostType={editBoostType}
                  initialBoostType={initialBoostType}
                  silverUsed={silverUsed}
                  silverMax={silverMax}
                  goldenUsed={goldenUsed}
                  goldenMax={goldenMax}
                  onHomeScoreChange={setEditHomeScore}
                  onAwayScoreChange={setEditAwayScore}
                  onHomePenaltyWinnerChange={setEditHomePenaltyWinner}
                  onAwayPenaltyWinnerChange={setEditAwayPenaltyWinner}
                  onBoostTypeChange={setEditBoostType}
                  loading={saving}
                  error={saveError}
                  layout="vertical"
                  compact={false}
                  homeScoreInputRef={homeScoreInputRef}
                  awayScoreInputRef={awayScoreInputRef}
                  boostButtonGroupRef={boostButtonGroupRef}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onTabFromLastField={onAutoAdvanceNext}
                  onEscapePressed={handleCancel}
                  retryCallback={handleSave}
                />
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}
