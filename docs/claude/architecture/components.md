# Component Organization & Reusable UI

This guide covers how components are organized and documents reusable UI components.

## Table of Contents
- [Component Organization](#component-organization)
- [Reusable UI Components](#reusable-ui-components)

## Component Organization

Components are organized by feature domain:
- `/auth` - Authentication (login, signup, password reset)
- `/tournament-page` - Tournament views and standings
- `/groups-page` - Friend group management
- `/playoffs`, `/playoffs-page` - Playoff brackets
- `/awards` - Award tracking components
- `/backoffice` - Admin interface
- `/common` - Reusable UI components

Use Server Components by default. Add `'use client'` only when needed for:
- User interactions (onClick, onChange)
- React hooks (useState, useEffect, useContext)
- Browser APIs

## Reusable UI Components

### ScrollShadowContainer

**Location:** `app/components/common/scroll-shadow-container.tsx`

Visual feedback component for scrollable content areas. Shows shadows at edges when content overflows.

**Usage:**
```typescript
import { ScrollShadowContainer } from '@/app/components/common/scroll-shadow-container';

const isMobile = useMediaQuery(theme.breakpoints.down('md'));

<ScrollShadowContainer
  direction={isMobile ? 'vertical' : 'none'}  // 'vertical' | 'horizontal' | 'both' | 'none'
  height="100%"
  hideScrollbar={true}
>
  <GamesList />
</ScrollShadowContainer>
```

**Features:**
- Automatic shadow calculation based on scroll position
- ResizeObserver for responsive behavior
- MutationObserver for dynamic content
- Theme-aware (adapts to light/dark mode)
- Debounced resize (250ms), immediate scroll feedback

**Rules:**
- ✅ Use for all scrollable lists (games, stats, qualified teams)
- ✅ Set `direction` prop based on layout needs
- ✅ Use `useMediaQuery` for responsive scrolling
- ❌ NEVER pass `overflow` in `sx` prop (conflicts with `direction`)
- ❌ NEVER create custom scroll indicators (use this component)

**Used In:** Tournament sidebar, games list, results tabs, stats pages, playoffs bracket, qualified teams page (9+ components)

### Storage Utilities

**Location:** `app/utils/dismissal-storage.ts`

localStorage helpers for UI state persistence (dismissible overlays, tournament selection).

**API:**
```typescript
import { getDismissalState, setDismissalState } from '@/app/utils/dismissal-storage';

// Check if overlay dismissed
const isDismissed = getDismissalState('qualified-teams-cta');

// Mark as dismissed
setDismissalState('qualified-teams-cta', true);

// Tournament selection
const lastTournamentId = getLastSelectedTournamentId();
setLastSelectedTournamentId(tournamentId);
```

**Used For:**
- Tournament redirect logic (last selected tournament)
- Dismissible CTAs (qualified teams, awards)
- Snackbar dismissal (new tournament notifications)

### Auto-Scroll Utilities

**Location:** `app/utils/auto-scroll.ts`

Smart scrolling to game cards (finds next upcoming game or last game).

**API:**
```typescript
import { findScrollTarget, scrollToGame } from '@/app/utils/auto-scroll';

const targetGame = findScrollTarget(games);  // Finds next upcoming or last game
scrollToGame(targetGame.id, 'smooth');       // Smooth scroll to game card
```

**Used In:** Main games page (auto-scroll on load to relevant game)
