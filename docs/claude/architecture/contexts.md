# Context Providers Pattern

This guide explains how to use React Context with Server Components in the qatar-prode application.

## Pattern Overview

**Pattern:** Server Components fetch data, wrap Client Components with Context Providers, pass data as props to provider.

**Available Providers:**
- `GuessesContextProvider` - Game predictions and boost counts (main games page)
- `FilterContextProvider` - Game filtering state
- `EditModeContextProvider` - Toggle prediction edit mode
- `CountdownContextProvider` - Live countdown updates
- `TimezoneContextProvider` - User timezone handling
- `ThemeProvider` - MUI theme management

**Location:** `app/components/context-providers/`

## Example: GuessesContext Pattern

```typescript
// Server Component fetches data and wraps Client Component with provider
export async function UnifiedGamesPage({ tournamentId }) {
  const user = await getLoggedInUser();
  const games = await findGames(tournamentId);
  const guesses = await findGuesses(user.id, tournamentId);
  const boosts = await calculateBoosts(user.id, tournamentId);

  // Wrap Client Component with provider, pass server-fetched data as props
  return (
    <GuessesContextProvider
      initialGuesses={guesses}
      initialBoosts={boosts}
      games={games}
    >
      <GamesPageClient />  {/* Client Component consumes context */}
    </GuessesContextProvider>
  );
}

// Client Component uses context
'use client'
import { useGuessesContext } from '@/app/components/context-providers/guesses-context-provider';

export function GameCard({ game }) {
  const { gameGuesses, updateGameGuess, boostCounts } = useGuessesContext();
  // Component logic with optimistic updates...
}
```

## Rules

- ✅ Server Components fetch data and pass to provider as props
- ✅ Provider wraps Client Components that need the context
- ✅ Client Components use `useContext()` hook to consume
- ❌ NEVER fetch data inside Client Components (use context or props)
- ❌ NEVER put providers in Client Components (causes unnecessary re-renders)

## Why This Pattern

- Server-side data fetching (faster, secure, no loading states)
- Client-side state management (interactive, optimistic updates)
- Clean separation of concerns (fetch vs. interact)
