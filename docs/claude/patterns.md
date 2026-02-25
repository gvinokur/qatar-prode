# Common Patterns Quick Reference

This guide covers the 5 most critical patterns in the qatar-prode codebase. Each pattern includes ✅ DO and ❌ DON'T examples.

---

## Pattern 1: Database-Driven i18n

**Files:** `app/utils/localization-helper.ts`, `app/actions/*.ts`

**Rule:** Repositories return raw data, Server Actions apply localization.

### ✅ DO:

```typescript
// Repository (no locale)
export async function findTournaments() {
  return db.selectFrom('tournaments')
    .select(['id', 'name', 'name_i18n'])
    .execute();
}

// Server Action (apply localization)
export async function getTournaments() {
  const locale = await getLocale();
  const tournaments = await findTournaments();
  return applyLocalizationBatch(tournaments, locale, [
    { field: 'name', i18nField: 'name_i18n' }
  ]);
}
```

### ❌ DON'T:

```typescript
// Don't add locale to repository
export async function findTournaments(locale: Locale) {  // ❌
  // Repository should not handle localization
}

// Don't manually access i18n fields
export async function getTournaments() {
  const locale = await getLocale();
  const tournaments = await findTournaments();
  return tournaments.map(t => ({
    ...t,
    name: t.name_i18n?.[locale] || t.name  // ❌ Manual localization
  }));
}
```

**See:** [i18n Architecture Guide](architecture/i18n.md) for complete guide

---

## Pattern 2: Testing with Factories & Mock Helpers

**Files:** `__tests__/db/test-factories.ts`, `__tests__/db/mock-helpers.ts`, `__tests__/utils/test-utils.tsx`

**Rule:** ALWAYS use test utilities. NEVER create mock data or queries manually.

### ✅ DO:

```typescript
import { testFactories } from '@/__tests__/db/test-factories';
import { createMockSelectQuery } from '@/__tests__/db/mock-helpers';
import { renderWithProviders } from '@/__tests__/utils/test-utils';

// Mock data
const mockTournament = testFactories.tournament({ id: '1', name: 'Test' });

// Mock Kysely query
const mockQuery = createMockSelectQuery(mockTournament);
vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any);

// Render component
renderWithProviders(<Component />, { locale: 'en', theme: 'dark' });
```

### ❌ DON'T:

```typescript
// Don't create mock data manually
const mockTournament = {  // ❌
  id: '1',
  name: 'Test',
  is_active: true,
  // ... 20 more fields you'll forget
};

// Don't build Kysely chains manually
const mockQuery = {  // ❌
  where: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([mockTournament])
};

// Don't create local wrappers
const wrapper = ({ children }) => (  // ❌
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);
render(<Component />, { wrapper });
```

**See:** `__tests__/db/README.md` for complete testing guide

---

## Pattern 3: Context Provider Wrapping

**Files:** `app/components/unified-games-page.tsx`, `app/components/context-providers/`

**Rule:** Server Components fetch data, wrap Client Components with providers, pass data as props.

### ✅ DO:

```typescript
// Server Component
export async function GamesPage({ tournamentId }) {
  const games = await findGames(tournamentId);       // Server fetch
  const guesses = await findGuesses(userId, tournamentId);

  return (
    <GuessesContextProvider                         // Wrap with provider
      initialGuesses={guesses}                      // Pass server data
      games={games}
    >
      <GamesPageClient />                           // Client consumes context
    </GuessesContextProvider>
  );
}

// Client Component
'use client'
import { useGuessesContext } from '@/app/components/context-providers/guesses-context-provider';

export function GameCard() {
  const { gameGuesses, updateGameGuess } = useGuessesContext();  // Use context
  // ...
}
```

### ❌ DON'T:

```typescript
// Don't fetch in Client Component
'use client'
export function GameCard() {
  const [guesses, setGuesses] = useState([]);
  useEffect(() => {
    fetch('/api/guesses').then(/* ... */);  // ❌ Client-side fetch
  }, []);
}

// Don't put provider in Client Component
'use client'
export function GamesPage() {
  return (
    <GuessesContextProvider>  {/* ❌ Provider in Client Component */}
      <GameCard />
    </GuessesContextProvider>
  );
}
```

---

## Pattern 4: Public vs Authenticated Views

**Files:** `app/components/unified-games-page.tsx`, `app/components/tournament-page/public-games-page.tsx`

**Rule:** Branch at Server Component level, render different trees based on auth state.

### ✅ DO:

```typescript
// Server Component branches early
export async function UnifiedGamesPage({ tournamentId }) {
  const user = await getLoggedInUser();

  if (!user) {
    return <PublicGamesPage tournamentId={tournamentId} />;  // Public view
  }

  // Authenticated view with user-specific data
  const guesses = await findUserGuesses(user.id, tournamentId);
  return <AuthenticatedGamesPage guesses={guesses} />;
}
```

### ❌ DON'T:

```typescript
// Don't check auth in Client Component
'use client'
export function GamesPage() {
  const { data: session } = useSession();  // ❌ Client-side auth check

  if (!session) {
    return <PublicView />;
  }
  return <AuthView />;
}

// Don't use separate routes
// ❌ /public/tournaments/[id]
// ❌ /tournaments/[id]
// Use conditional rendering in same route instead
```

---

## Pattern 5: ScrollShadowContainer for Scrollable Areas

**Files:** `app/components/common/scroll-shadow-container.tsx`

**Rule:** Use ScrollShadowContainer for all scrollable lists. Don't create custom scroll indicators.

### ✅ DO:

```typescript
import { ScrollShadowContainer } from '@/app/components/common/scroll-shadow-container';

const isMobile = useMediaQuery(theme.breakpoints.down('md'));

<ScrollShadowContainer
  direction={isMobile ? 'vertical' : 'none'}
  height="100%"
  hideScrollbar={true}
>
  <GamesList />
</ScrollShadowContainer>
```

### ❌ DON'T:

```typescript
// Don't pass overflow in sx (conflicts with direction)
<ScrollShadowContainer
  direction="vertical"
  sx={{ overflow: 'auto' }}  // ❌ Conflicts with direction prop
>

// Don't create custom scroll indicators
<Box sx={{ position: 'relative' }}>  {/* ❌ Reinventing the wheel */}
  <Box sx={{
    position: 'absolute',
    top: 0,
    height: '20px',
    background: 'linear-gradient(...)',  // Custom shadow
  }} />
  <Box sx={{ overflowY: 'auto' }}>
    <GamesList />
  </Box>
</Box>
```

---

## Summary

| Pattern | Key Rule | File Reference |
|---------|----------|----------------|
| i18n | Repositories raw, Actions localize | `app/utils/localization-helper.ts` |
| Testing | Use factories, mock helpers, renderWithProviders | `__tests__/db/test-factories.ts` |
| Contexts | Server fetches, wraps Client with provider | `app/components/unified-games-page.tsx` |
| Auth Views | Branch at Server Component level | `app/components/unified-games-page.tsx` |
| Scroll | Use ScrollShadowContainer, not custom | `app/components/common/scroll-shadow-container.tsx` |
