'use client'

import { useEffect, useState } from 'react'
import OnboardingDialog from './onboarding-dialog'
import { getTournaments } from '@/app/actions/tournament-actions'
import type { Tournament } from '@/app/db/tables-definition'

type OnboardingDialogClientProps = {
  readonly initialOpen?: boolean
  readonly onClose?: () => void
}

/**
 * Client wrapper for OnboardingDialog that loads tournament data on mount
 * This avoids Server/Client component boundary issues with event handlers
 */
export default function OnboardingDialogClient({ initialOpen = true, onClose }: OnboardingDialogClientProps) {
  const [tournament, setTournament] = useState<Tournament | undefined>(undefined)
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTournament() {
      try {
        const tournaments = await getTournaments()
        const activeTournament = tournaments?.[0]

        // Debug: Log tournament data to verify fields are populated
        console.warn('[OnboardingDialogClient] Active tournament:', {
          id: activeTournament?.id,
          name: activeTournament?.short_name,
          hasScoring: {
            gameExact: activeTournament?.game_exact_score_points,
            gameOutcome: activeTournament?.game_correct_outcome_points,
            champion: activeTournament?.champion_points,
            silverBoosts: activeTournament?.max_silver_games,
            goldenBoosts: activeTournament?.max_golden_games,
          }
        })

        setTournament(activeTournament)
      } catch (error) {
        console.error('[OnboardingDialogClient] Failed to load tournament:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTournament()
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  // Don't render dialog until tournament data is loaded
  if (isLoading) {
    return null
  }

  return (
    <OnboardingDialog
      open={isOpen}
      onClose={handleClose}
      tournament={tournament}
    />
  )
}
