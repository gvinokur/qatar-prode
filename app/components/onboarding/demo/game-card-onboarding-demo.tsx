'use client'

/**
 * Dedicated onboarding demo wrapper for game cards
 * Adds game type labels and handles playoff demo behavior
 */

import React, { useContext } from 'react'
import { Box, Typography, Chip } from '@mui/material'
import FlippableGameCard from '@/app/components/flippable-game-card'
import { GuessesContext } from '@/app/components/context-providers/guesses-context-provider'
import type { Game, Team } from '@/app/db/tables-definition'

interface GameCardOnboardingDemoProps {
  readonly game: Game
  readonly teamsMap: Record<string, Team>
  readonly isPlayoffs: boolean
  readonly isEditing: boolean
  readonly onEditStart: () => void
  readonly onEditEnd: () => void
  readonly silverUsed: number
  readonly silverMax: number
  readonly goldenUsed: number
  readonly goldenMax: number
  readonly label: string
  readonly demoNote?: string
}

/**
 * Game card with onboarding-specific labels and behavior
 */
export default function GameCardOnboardingDemo({
  game,
  teamsMap,
  isPlayoffs,
  isEditing,
  onEditStart,
  onEditEnd,
  silverUsed,
  silverMax,
  goldenUsed,
  goldenMax,
  label,
  demoNote,
}: GameCardOnboardingDemoProps) {
  // Read current guess from context to pass to FlippableGameCard
  const { gameGuesses } = useContext(GuessesContext)
  const currentGuess = gameGuesses[game.id]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', width: '100%', maxWidth: 450 }}>
      {/* Game type label */}
      <Chip
        label={label}
        color={isPlayoffs ? 'secondary' : 'primary'}
        size="small"
        sx={{ fontWeight: 600 }}
      />

      {/* Demo note or placeholder for alignment */}
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        sx={{
          maxWidth: 280,
          fontStyle: demoNote ? 'italic' : 'normal',
          minHeight: '2.5em', // Reserve space for alignment
          visibility: demoNote ? 'visible' : 'hidden'
        }}
      >
        {demoNote || 'placeholder'}
      </Typography>

      {/* Game card */}
      <FlippableGameCard
        game={game}
        teamsMap={teamsMap}
        isPlayoffs={isPlayoffs}
        isEditing={isEditing}
        onEditStart={onEditStart}
        onEditEnd={onEditEnd}
        homeScore={currentGuess?.home_score}
        awayScore={currentGuess?.away_score}
        homePenaltyWinner={currentGuess?.home_penalty_winner}
        awayPenaltyWinner={currentGuess?.away_penalty_winner}
        boostType={currentGuess?.boost_type}
        silverUsed={silverUsed}
        silverMax={silverMax}
        goldenUsed={goldenUsed}
        goldenMax={goldenMax}
        disabled={false}
      />
    </Box>
  )
}
