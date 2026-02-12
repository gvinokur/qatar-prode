'use client'

/**
 * Dedicated onboarding demo for qualified teams predictions
 * Self-contained with its own DnD setup, isolated from production code
 */

import React, { useCallback } from 'react'
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Box } from '@mui/material'
import GroupCard from '@/app/components/qualified-teams/group-card'
import { MockQualifiedTeamsContextProvider, useMockQualifiedTeamsContext } from './onboarding-demo-context'
import type { Team, TournamentGroup } from '@/app/db/tables-definition'

interface QualifiedTeamsOnboardingDemoProps {
  /** Demo group data */
  readonly group: TournamentGroup
  /** Demo teams */
  readonly teams: Team[]
}

/**
 * Inner component that uses the mock context
 */
function QualifiedTeamsOnboardingDemoInner({
  group,
  teams,
}: QualifiedTeamsOnboardingDemoProps) {
  const { predictions: allPredictions, isSaving, updateGroupPositions } = useMockQualifiedTeamsContext()

  // GroupCard expects predictions keyed by teamId, but context uses groupId-teamId
  // Transform the Map for this group
  const predictions = React.useMemo(() => {
    const groupPredictions = new Map()
    teams.forEach((team) => {
      const prediction = allPredictions.get(`${group.id}-${team.id}`)
      if (prediction) {
        groupPredictions.set(team.id, prediction)
      }
    })
    return groupPredictions
  }, [allPredictions, group.id, teams])

  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  )

  // Handle drag end - simplified for single group demo
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (!over || active.id === over.id) {
        return
      }

      const activeTeamId = active.id as string
      const overTeamId = over.id as string

      // Get current team order by position
      const teamOrder = teams
        .map((team) => {
          const prediction = predictions.get(team.id)
          return prediction ? { teamId: team.id, position: prediction.predicted_position } : null
        })
        .filter((item): item is { teamId: string; position: number } => item !== null)
        .sort((a, b) => a.position - b.position)
        .map((item) => item.teamId)

      const oldIndex = teamOrder.indexOf(activeTeamId)
      const newIndex = teamOrder.indexOf(overTeamId)

      if (oldIndex === -1 || newIndex === -1) {
        return
      }

      // Calculate new order after drag
      const newOrder = arrayMove(teamOrder, oldIndex, newIndex)

      // Build batch update for all teams
      const updates = newOrder.map((teamId, index) => {
        const newPosition = index + 1
        // Positions 1-2 always qualify, others don't (no third place in demo)
        const qualifies = newPosition <= 2

        return {
          teamId,
          position: newPosition,
          qualifies,
        }
      })

      // Send batch update
      updateGroupPositions(group.id, updates)
    },
    [group.id, teams, predictions, updateGroupPositions]
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Box
          sx={{
            width: { xs: '100%', sm: '83.333%', md: '66.666%', lg: '50%' },
            maxWidth: '600px',
          }}
        >
          <GroupCard
            group={group}
            teams={teams}
            predictions={predictions}
            isLocked={false}
            isSaving={isSaving}
            allowsThirdPlace={false}
            isGroupComplete={false}
            allGroupsComplete={false}
          />
        </Box>
      </Box>
    </DndContext>
  )
}

/**
 * Qualified teams onboarding demo with mock context
 */
export default function QualifiedTeamsOnboardingDemo(props: QualifiedTeamsOnboardingDemoProps) {
  return (
    <MockQualifiedTeamsContextProvider>
      <QualifiedTeamsOnboardingDemoInner {...props} />
    </MockQualifiedTeamsContextProvider>
  )
}
