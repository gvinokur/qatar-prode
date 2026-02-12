'use client'

/**
 * Dedicated onboarding demo wrapper for game cards
 * Adds game type labels and handles playoff demo behavior
 */

import React from 'react'
import { Box, Typography, Chip } from '@mui/material'
import FlippableGameCard from '@/app/components/flippable-game-card'
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
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
      {/* Game type label */}
      <Chip
        label={label}
        color={isPlayoffs ? 'secondary' : 'primary'}
        size="small"
        sx={{ fontWeight: 600 }}
      />

      {/* Demo note for playoff */}
      {demoNote && (
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ maxWidth: 280, fontStyle: 'italic' }}
        >
          {demoNote}
        </Typography>
      )}

      {/* Game card */}
      <FlippableGameCard
        game={game}
        teamsMap={teamsMap}
        isPlayoffs={isPlayoffs}
        isEditing={isEditing}
        onEditStart={onEditStart}
        onEditEnd={onEditEnd}
        silverUsed={silverUsed}
        silverMax={silverMax}
        goldenUsed={goldenUsed}
        goldenMax={goldenMax}
        disabled={false}
      />
    </Box>
  )
}
