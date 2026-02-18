'use client'

import React, { useRef, useEffect, useState } from 'react';
import { Box, Card, CardContent, useTheme, useMediaQuery } from '@mui/material';
import { useReducedMotion } from 'framer-motion';
import BackofficeGameResultEditControls from './backoffice-game-result-edit-controls';
import CompactGameViewCard from '../compact-game-view-card';
import { ExtendedGameData } from '../../definitions';
import { Team } from '../../db/tables-definition';

interface BackofficeFlippableGameCardProps {
  // Game data
  readonly game: ExtendedGameData;
  readonly teamsMap: Record<string, Team>;
  readonly isPlayoffs: boolean;

  // Callbacks
  readonly onSave: (_game: ExtendedGameData) => Promise<void>;
  readonly onPublishToggle: (_gameId: string, _isPublished: boolean) => Promise<void>;
}

export default function BackofficeFlippableGameCard({
  game,
  teamsMap,
  isPlayoffs,
  onSave,
  onPublishToggle
}: BackofficeFlippableGameCardProps) {
  const theme = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editHomeScore, setEditHomeScore] = useState<number | undefined>(game.gameResult?.home_score);
  const [editAwayScore, setEditAwayScore] = useState<number | undefined>(game.gameResult?.away_score);
  const [editHomePenaltyScore, setEditHomePenaltyScore] = useState<number | undefined>(game.gameResult?.home_penalty_score ?? undefined);
  const [editAwayPenaltyScore, setEditAwayPenaltyScore] = useState<number | undefined>(game.gameResult?.away_penalty_score ?? undefined);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Refs for focus management
  const homeScoreInputRef = useRef<HTMLInputElement | null>(null);
  const awayScoreInputRef = useRef<HTMLInputElement | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Flip animation duration (slightly slower on mobile)
  const flipDuration = isMobile ? 0.5 : 0.4;

  // Initialize edit state when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditHomeScore(game.gameResult?.home_score);
      setEditAwayScore(game.gameResult?.away_score);
      setEditHomePenaltyScore(game.gameResult?.home_penalty_score ?? undefined);
      setEditAwayPenaltyScore(game.gameResult?.away_penalty_score ?? undefined);
      setSaveError(null);
    }
  }, [isEditing, game.gameResult]);

  // Focus home input when entering edit mode
  useEffect(() => {
    if (isEditing && homeScoreInputRef.current) {
      setTimeout(() => homeScoreInputRef.current?.focus(), flipDuration * 1000);
    }
  }, [isEditing, flipDuration]);

  // Cleanup focus timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      // Create updated game object with new scores
      const updatedGame = {
        ...game,
        gameResult: {
          game_id: game.id,
          home_score: editHomeScore,
          away_score: editAwayScore,
          home_penalty_score: editHomePenaltyScore ?? undefined,
          away_penalty_score: editAwayPenaltyScore ?? undefined,
          is_draft: game.gameResult?.is_draft ?? true
        }
      };

      await onSave(updatedGame);

      // Close edit mode after successful save
      setIsEditing(false);

      // Focus edit button after flip animation completes
      focusTimeoutRef.current = setTimeout(() => {
        const cardElement = document.querySelector(`[data-game-id="${game.id}"]`);
        const editButton = cardElement?.querySelector<HTMLButtonElement>('button[aria-label*="Edit"]');
        editButton?.focus();
      }, flipDuration * 1000 + 50);

    } catch (error: any) {
      // Show error, stay in edit mode
      setSaveError(error.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setEditHomeScore(game.gameResult?.home_score);
    setEditAwayScore(game.gameResult?.away_score);
    setEditHomePenaltyScore(game.gameResult?.home_penalty_score ?? undefined);
    setEditAwayPenaltyScore(game.gameResult?.away_penalty_score ?? undefined);
    setSaveError(null);

    // Close edit mode
    setIsEditing(false);

    // Focus edit button after flip animation completes
    setTimeout(() => {
      const cardElement = document.querySelector(`[data-game-id="${game.id}"]`);
      const editButton = cardElement?.querySelector<HTMLButtonElement>('button[aria-label*="Edit"]');
      editButton?.focus();
    }, flipDuration * 1000 + 50);
  };

  const handlePublishToggle = async () => {
    const isCurrentlyPublished = !game.gameResult?.is_draft;
    await onPublishToggle(game.id, !isCurrentlyPublished);
  };

  // Get team names
  const homeTeam = game.home_team ? teamsMap[game.home_team] : null;
  const awayTeam = game.away_team ? teamsMap[game.away_team] : null;
  const homeTeamName = homeTeam?.name || 'TBD';
  const awayTeamName = awayTeam?.name || 'TBD';

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
        {/* Front: Game view card (visible when not editing) */}
        <Box
          sx={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            position: isEditing ? 'absolute' : 'relative',
            width: '100%',
            top: 0,
            left: 0,
            zIndex: isEditing ? 0 : 1,
            pointerEvents: isEditing ? 'none' : 'auto',
            visibility: isEditing ? 'hidden' : 'visible'
          }}
        >
          <CompactGameViewCard
            isGameGuess={false}
            isGameFixture={false}
            gameNumber={game.game_number}
            gameDate={game.game_date}
            location={game.location}
            gameTimezone={game.game_local_timezone}
            isPlayoffGame={isPlayoffs}
            homeTeamNameOrDescription={homeTeamName}
            awayTeamNameOrDescription={awayTeamName}
            homeTeamTheme={homeTeam?.theme || null}
            awayTeamTheme={awayTeam?.theme || null}
            isDraft={game.gameResult ? game.gameResult.is_draft : true}
            homeScore={game.gameResult?.home_score}
            awayScore={game.gameResult?.away_score}
            homePenaltyScore={game.gameResult?.home_penalty_score}
            awayPenaltyScore={game.gameResult?.away_penalty_score}
            onEditClick={handleEditStart}
            onPublishClick={handlePublishToggle}
          />
        </Box>

        {/* Back: Edit controls (visible when editing) */}
        <Box
          sx={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: isEditing ? 'relative' : 'absolute',
            width: '100%',
            top: 0,
            left: 0,
            zIndex: isEditing ? 1 : 0,
            pointerEvents: isEditing ? 'auto' : 'none',
            visibility: isEditing ? 'visible' : 'hidden'
          }}
        >
          {isEditing && (
            <Card variant="outlined">
              <CardContent>
                <BackofficeGameResultEditControls
                  homeTeamName={homeTeamName}
                  awayTeamName={awayTeamName}
                  isPlayoffGame={isPlayoffs}
                  homeScore={editHomeScore}
                  awayScore={editAwayScore}
                  homePenaltyScore={editHomePenaltyScore}
                  awayPenaltyScore={editAwayPenaltyScore}
                  onHomeScoreChange={setEditHomeScore}
                  onAwayScoreChange={setEditAwayScore}
                  onHomePenaltyScoreChange={setEditHomePenaltyScore}
                  onAwayPenaltyScoreChange={setEditAwayPenaltyScore}
                  loading={saving}
                  error={saveError}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  homeScoreInputRef={homeScoreInputRef}
                  awayScoreInputRef={awayScoreInputRef}
                />
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}
