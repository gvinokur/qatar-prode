'use client'

import { Accordion, AccordionSummary, AccordionDetails, Typography, useTheme, Box, IconButton } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { useState, useEffect, useRef } from 'react'
import TeamStandingsCards from '../groups-page/team-standings-cards'
import { Team, TeamStats } from '@/app/db/tables-definition'

interface GroupStandingsSidebarProps {
  groups: Array<{
    id: string
    letter: string
    teamStats: TeamStats[]      // Use TeamStats directly (from calculateGroupPosition)
    teamsMap: { [k: string]: Team }
  }>
  defaultGroupId: string
  qualifiedTeams: { id: string }[]  // Format expected by TeamStandingsCards
}

export default function GroupStandingsSidebar({ groups, defaultGroupId, qualifiedTeams }: GroupStandingsSidebarProps) {
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

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      defaultExpanded
      sx={{
        '&:before': {
          display: 'none',
        },
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
          },
        }}
      >
        <Typography variant="h5" component="h2">
          Grupos
        </Typography>
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
  )
}
