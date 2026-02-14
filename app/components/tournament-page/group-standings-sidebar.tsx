'use client'

import { Accordion, AccordionSummary, AccordionDetails, Typography, useTheme, Box, IconButton, Button, Card, CardActions } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import AssessmentIcon from '@mui/icons-material/Assessment'
import { useState, useEffect, useRef } from 'react'
import TeamStandingsCards from '../groups-page/team-standings-cards'
import { Team, TeamStats } from '@/app/db/tables-definition'
import Link from 'next/link'

interface GroupStandingsSidebarProps {
  readonly groups: ReadonlyArray<{
    readonly id: string
    readonly letter: string
    readonly teamStats: TeamStats[]      // Use TeamStats directly (from calculateGroupPosition)
    readonly teamsMap: { readonly [k: string]: Team }
  }>
  readonly defaultGroupId: string
  readonly qualifiedTeams: ReadonlyArray<{ readonly id: string }>  // Format expected by TeamStandingsCards
  readonly tournamentId: string  // Add tournament ID for results link
  readonly isActive?: boolean
}

export default function GroupStandingsSidebar({ groups, defaultGroupId, qualifiedTeams, tournamentId, isActive = false }: GroupStandingsSidebarProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId)
  const [expanded, setExpanded] = useState(true)
  const theme = useTheme()
  const contentRef = useRef<HTMLDivElement>(null)

  // Sort groups alphabetically by letter (before early return to avoid hook issues)
  const sortedGroups = groups ? [...groups].sort((a, b) => a.letter.localeCompare(b.letter)) : []

  const currentIndex = sortedGroups.findIndex(g => g.id === selectedGroupId)
  const selectedGroup = sortedGroups[currentIndex] || sortedGroups[0]

  // Navigation functions
  const navigateToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedGroupId(sortedGroups[currentIndex - 1].id)
    }
  }

  const navigateToNext = () => {
    if (currentIndex < sortedGroups.length - 1) {
      setSelectedGroupId(sortedGroups[currentIndex + 1].id)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!expanded) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigateToPrevious()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        navigateToNext()
      }
    }

    globalThis.addEventListener('keydown', handleKeyDown)
    return () => globalThis.removeEventListener('keydown', handleKeyDown)
  }, [expanded, currentIndex, sortedGroups.length])

  // Touch/swipe support for mobile
  useEffect(() => {
    const element = contentRef.current
    if (!element) return

    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX
      handleSwipe()
    }

    const handleSwipe = () => {
      const swipeThreshold = 50 // Minimum swipe distance in pixels
      const diff = touchStartX - touchEndX

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swiped left, go to next group
          navigateToNext()
        } else {
          // Swiped right, go to previous group
          navigateToPrevious()
        }
      }
    }

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [currentIndex, sortedGroups.length])

  // Handle empty groups (after all hooks to comply with Rules of Hooks)
  if (!groups || groups.length === 0) {
    return null
  }

  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < sortedGroups.length - 1

  return (
    <Card sx={{
      ...(isActive && {
        borderLeft: 3,
        borderColor: 'primary.main',
        backgroundColor: 'action.selected',
      })
    }}>
      <Accordion
        expanded={expanded}
        onChange={(_, isExpanded) => setExpanded(isExpanded)}
        defaultExpanded
        sx={{
          '&:before': {
            display: 'none',
          },
          boxShadow: 'none',
        }}
      >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="group-standings-content"
        id="group-standings-header"
        sx={{
          color: theme.palette.primary.main,
          borderBottom: expanded ? `${theme.palette.primary.light} solid 1px` : 'none',
          '& .MuiAccordionSummary-content': {
            margin: '12px 0',
            flexDirection: 'column',
          },
        }}
      >
        <Typography variant="h5" component="h2">
          Grupos
        </Typography>
        {isActive && (
          <Typography variant="body2" color="text.secondary">
            Estás aquí
          </Typography>
        )}
      </AccordionSummary>
      <AccordionDetails ref={contentRef}>
        {/* Carousel navigation header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            gap: 1,
          }}
        >
          <IconButton
            onClick={navigateToPrevious}
            disabled={!hasPrevious}
            size="small"
            aria-label="Previous group"
            sx={{
              color: theme.palette.primary.main,
              '&.Mui-disabled': {
                opacity: 0.3,
              },
            }}
          >
            <NavigateBeforeIcon />
          </IconButton>

          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              minWidth: '120px',
              textAlign: 'center',
            }}
          >
            GRUPO {selectedGroup.letter.toUpperCase()}
          </Typography>

          <IconButton
            onClick={navigateToNext}
            disabled={!hasNext}
            size="small"
            aria-label="Next group"
            sx={{
              color: theme.palette.primary.main,
              '&.Mui-disabled': {
                opacity: 0.3,
              },
            }}
          >
            <NavigateNextIcon />
          </IconButton>
        </Box>

        {/* REUSE existing TeamStandingsCards component */}
        <TeamStandingsCards
          teamStats={selectedGroup.teamStats}
          teamsMap={selectedGroup.teamsMap}
          qualifiedTeams={qualifiedTeams}
          compact={true}
        />
      </AccordionDetails>
      </Accordion>
      <CardActions sx={{ justifyContent: 'center', px: 2, py: 1.5 }}>
        <Button
          component={Link}
          href={`/tournaments/${tournamentId}/results`}
          startIcon={<AssessmentIcon />}
          variant="text"
          color="primary"
        >
          Ver Resultados
        </Button>
      </CardActions>
    </Card>
  )
}
