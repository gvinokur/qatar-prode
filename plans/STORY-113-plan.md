# Implementation Plan: Story #113 - Simplify User Stats Card for Compact Display

## Story Context

**Issue:** #113 - [UXI] Simplify User Stats Card for Compact Display
**Type:** UX Improvement
**Effort:** Low (1 day)
**Branch:** feature/story-113
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-113`

### Objective

Simplify the User Tournament Statistics card on the tournament home page to show only key metrics in a compact format, reducing vertical space usage by at least 30% while maintaining all essential information.

### Problem

The current card shows detailed stats with verbose labels across three sections (Fase de Grupos, Playoffs, Torneo). On mobile, this takes up significant vertical space alongside other sidebar content. The nested Grid layout with 8/4 column splits creates excessive whitespace.

### Solution

Create a streamlined single-line-per-metric format with simplified labels, visual separators, and prominent total display. This will:
- Reduce card height by 30%+ (especially on mobile)
- Make stats easier to scan quickly
- Create space for group tables widget (#110)
- Maintain link to detailed stats page

## Current Implementation Analysis

### Component Location
`app/components/tournament-page/user-tournament-statistics.tsx`

### Current Layout Structure
```typescript
// Grid-based layout with 8/4 column splits
<Grid container spacing={1}>
  <Grid size={8}>Label</Grid>
  <Grid size={4}>Value</Grid>
</Grid>

// Three main sections:
// 1. Fase de Grupos (5-6 rows)
//    - Aciertos (Exactos), Puntos por Partidos, Bonus por Boosts
//    - Puntos por Clasificados, Posiciones Grupo
// 2. Playoffs (3-4 rows)
//    - Aciertos (Exactos), Puntos por Partidos, Bonus por Boosts
// 3. Torneo (2 rows)
//    - Cuadro de Honor, Premios
```

### Current Data Sources
- **GameStatisticForUser**: Group/playoff correct guesses, exact guesses, scores, boost bonuses
- **TournamentGuess**: Qualified teams score, group position score, honor roll score, individual awards score

### Current Styling
- Theme colors: `primary.main`, `primary.light`, `success.main`
- Typography: `h6` (sections), `body1` (labels), `body2` (sub-labels)
- Spacing: `spacing={1}` (tight), `mt={2}` (sections)
- Borders: `borderTop` separators between sections

## Visual Prototypes

### Proposed Compact Layout

```
┌─────────────────────────────────────┐
│      YOUR TOURNAMENT STATS          │ ← Card Header
├─────────────────────────────────────┤
│                                     │
│  Groups:      45 pts                │ ← Single line, bold pts
│  Playoffs:    32 pts                │
│  Qualified:   15 pts                │
│  Awards:      10 pts                │
│                                     │
│  ─────────────────────               │ ← Divider
│                                     │
│  Total:      102 pts                │ ← Larger, primary color
│  Boosts:      3/5 used              │ ← Warning/accent color
│                                     │
│  ─────────────────────               │
│                                     │
│  [Ver Estadísticas Detalladas]      │ ← Link button
│                                     │
└─────────────────────────────────────┘
```

### Mobile View (< 600px)

```
┌───────────────────────┐
│  YOUR TOURNAMENT STATS│
├───────────────────────┤
│                       │
│ Groups:      45 pts   │
│ Playoffs:    32 pts   │
│ Qualified:   15 pts   │
│ Awards:      10 pts   │
│ ───────────────       │
│ Total:      102 pts   │
│ Boosts:      3/5      │ ← Shorter on mobile
│ ───────────────       │
│ [Ver Stats]           │ ← Shorter label
└───────────────────────┘
```

### Component Structure

**Material-UI Components:**
- `Card` - Container
- `CardHeader` - Title "YOUR TOURNAMENT STATS" (or localized)
- `CardContent` - Stats list
- `Stack` - Vertical layout with spacing (replaces Grid)
- `Box` - For label/value pairs and dividers
- `Typography` - Text elements
- `Button` or `Link` - Navigation to full stats

**Typography Scale:**
- Labels: `body2` (14px) - "Groups:", "Playoffs:", etc.
- Values: `body1` (16px, bold) - Point values
- Total: `h6` (20px, bold) - Total points row
- Boosts: `body2` (14px) - Boost usage

**Colors:**
- Labels: `text.secondary`
- Values: `text.primary`, bold
- Total: `primary.main`, bold
- Boosts: `warning.main` (if < 5), `text.secondary` (if 5/5)
- Dividers: `divider`

**Spacing:**
- `<Stack spacing={1}>` - 8px between stat rows (compact)
- `<Divider sx={{ my: 1.5 }}>` - 12px margin around dividers
- `<CardContent sx={{ p: 2 }}>` - 16px padding inside card

### State Variations

**Loading State:**
- Show skeleton loaders for each stat line
- Use `<Skeleton variant="text" width="80%" />`

**No Data State:**
- Display message: "No stats available yet. Start making predictions!"
- Show link to predictions page

**Boost States:**
- 0/5 used: `text.secondary` color
- 1-4 used: `warning.main` color (partial usage)
- 5/5 used: `success.main` color (all used)

**Conditional Rendering:**
- If no boosts available: Hide "Boosts" row entirely
- If no tournament ID: Hide link button

## Technical Approach

### 1. Component Refactoring Strategy

**Replace Grid with Stack:**
- Current: Nested `<Grid container spacing={1}>` with `size={8}` and `size={4}` creates 8/4 split
- New: `<Stack spacing={1}>` with flexbox `<Box>` for label/value pairs
- Benefits: Simpler markup, easier to read, more compact

**Simplify Data Aggregation:**
```typescript
// Current: groupScoreData and playoffScoreData objects with multiple fields
// New: Direct calculation of key totals

const groupsTotal = (userGameStatistics?.group_score || 0)
  + (userGameStatistics?.group_boost_bonus || 0)
  + (tournamentGuess?.qualified_teams_score || 0)
  + (tournamentGuess?.group_position_score || 0)

const playoffsTotal = (userGameStatistics?.playoff_score || 0)
  + (userGameStatistics?.playoff_boost_bonus || 0)

const qualifiedTotal = (tournamentGuess?.qualified_teams_score || 0)
  + (tournamentGuess?.group_position_score || 0)

const awardsTotal = (tournamentGuess?.honor_roll_score || 0)
  + (tournamentGuess?.individual_awards_score || 0)

const grandTotal = groupsTotal + playoffsTotal + awardsTotal

const boostsUsed = calculateBoostsUsed(userGameStatistics)
const totalBoosts = 5 // Or from tournament config
```

**Boost Calculation:**
```typescript
function calculateBoostsUsed(stats?: GameStatisticForUser): number {
  if (!stats) return 0

  // Boost is used if there's a bonus
  const groupBoosts = stats.group_boost_bonus > 0 ? 1 : 0
  const playoffBoosts = stats.playoff_boost_bonus > 0 ? 1 : 0

  // Need to query actual boost usage count from database
  // This is a simplification - actual implementation may differ
  return groupBoosts + playoffBoosts
}
```

### 2. Layout Implementation

**StatRow Component (Internal):**
```typescript
interface StatRowProps {
  label: string
  value: string | number
  valueColor?: string
  bold?: boolean
}

function StatRow({ label, value, valueColor = 'text.primary', bold = true }: StatRowProps) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body1"
        color={valueColor}
        fontWeight={bold ? 700 : 400}
      >
        {value}
      </Typography>
    </Box>
  )
}
```

**Main Component Structure:**
```typescript
export function UserTournamentStatistics({ userGameStatistics, tournamentGuess, tournamentId }: Props) {
  const theme = useTheme()

  // Calculate totals (see Data Aggregation section)
  const groupsTotal = ...
  const playoffsTotal = ...
  const qualifiedTotal = ...
  const awardsTotal = ...
  const grandTotal = ...
  const boostsUsed = ...

  return (
    <Card>
      <CardHeader
        title="TUS ESTADÍSTICAS"
        sx={{ color: theme.palette.primary.main }}
      />
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1}>
          <StatRow label="Fase de Grupos:" value={`${groupsTotal} pts`} />
          <StatRow label="Playoffs:" value={`${playoffsTotal} pts`} />
          <StatRow label="Clasificados:" value={`${qualifiedTotal} pts`} />
          <StatRow label="Premios:" value={`${awardsTotal} pts`} />

          <Divider sx={{ my: 1.5 }} />

          <StatRow
            label="Total:"
            value={`${grandTotal} pts`}
            valueColor={theme.palette.primary.main}
          />
          <StatRow
            label="Boosts:"
            value={`${boostsUsed}/5`}
            valueColor={boostsUsed < 5 ? theme.palette.warning.main : theme.palette.text.secondary}
          />

          <Divider sx={{ my: 1.5 }} />

          {tournamentId && (
            <Button
              component={Link}
              href={`/tournaments/${tournamentId}/stats`}
              variant="text"
              size="small"
            >
              Ver Estadísticas Detalladas
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
```

### 3. Data Handling Considerations

**Boost Usage Count Challenge:**
The current implementation calculates boost *bonuses* (extra points), but not the count of boosts *used*. We need to determine:

**Option A: Infer from bonus presence**
- If `group_boost_bonus > 0`, at least 1 boost used in groups
- If `playoff_boost_bonus > 0`, at least 1 boost used in playoffs
- **Limitation:** Doesn't track exact count (user could have used multiple boosts)

**Option B: Query game_guess table**
- Query `game_guess` table where `user_id = ? AND tournament_id = ? AND boost_applied = true`
- Count rows to get exact boost usage
- **Trade-off:** Additional database query

**Option C: Accept inaccuracy for MVP**
- Show "Boosts usados" without specific count (e.g., "Boosts: Activos")
- Document as future enhancement
- **Benefit:** No additional queries needed

**Recommendation:** Start with Option A (infer from bonuses) as it requires no schema changes or new queries. If precise tracking is needed, implement Option B in a follow-up story.

**Qualified vs Groups Breakdown:**
The story spec says "Qualified: [Z] pts" but the current implementation combines:
- `qualified_teams_score` - Points from predicting qualified teams
- `group_position_score` - Points from exact group positions

These are semantically different:
- Qualified teams = "Which 16 teams advance?"
- Group positions = "Exact standings within groups"

**Decision:** Merge both into "Clasificados" row to simplify (matches story requirements). Detailed breakdown remains in full stats page.

### 4. Responsive Design

**Breakpoints:**
- Desktop (≥960px): Full labels, wider spacing
- Tablet (600-960px): Same as desktop
- Mobile (<600px): Shorter labels, tighter spacing

**Mobile Optimizations:**
```typescript
<Typography
  variant="body2"
  sx={{
    display: { xs: 'none', sm: 'inline' } // Hide on mobile
  }}
>
  Ver Estadísticas Detalladas
</Typography>
<Typography
  variant="body2"
  sx={{
    display: { xs: 'inline', sm: 'none' } // Show only on mobile
  }}
>
  Ver Stats
</Typography>
```

**Alternative:** Use `Button` with responsive size:
```typescript
<Button
  size={{ xs: 'small', sm: 'medium' }}
  fullWidth={{ xs: true, sm: false }}
>
  {isMobile ? 'Ver Stats' : 'Ver Estadísticas Detalladas'}
</Button>
```

### 5. Localization

Current component uses Spanish labels hardcoded. To maintain consistency:

**Keep Spanish labels for now:**
- "Fase de Grupos" → "Grupos"
- "Playoffs" → "Playoffs" (unchanged)
- "Clasificados" → "Clasificados"
- "Premios" → "Premios"
- "Total" → "Total"
- "Boosts" → "Boosts"

**Future:** If i18n is implemented project-wide, add translation keys.

### 6. Accessibility

**ARIA Labels:**
```typescript
<Card aria-label="Estadísticas del usuario">
  <CardHeader title="TUS ESTADÍSTICAS" />
  <CardContent>
    {/* Stats */}
  </CardContent>
</Card>
```

**Link Accessibility:**
```typescript
<Button
  component={Link}
  href={`/tournaments/${tournamentId}/stats`}
  aria-label="Ver página de estadísticas detalladas"
>
  Ver Estadísticas Detalladas
</Button>
```

**Color Contrast:**
- Ensure all text meets WCAG AA standards (4.5:1 for body text)
- Test with theme colors (primary.main, warning.main, etc.)

## Files to Modify

### 1. Component File (Main Changes)
**Path:** `app/components/tournament-page/user-tournament-statistics.tsx`

**Changes:**
- Replace Grid layout with Stack + Box layout
- Simplify data aggregation (remove groupScoreData/playoffScoreData objects)
- Create StatRow helper component for label/value pairs
- Add calculateBoostsUsed utility function
- Update typography variants (body2 for labels, body1 for values, h6 for total)
- Update spacing (spacing={1}, my: 1.5 for dividers)
- Update colors (text.secondary for labels, primary.main for total, warning.main for boosts)
- Simplify conditional rendering (boosts, link button)

**Estimated Lines Changed:** ~150 lines (replace ~100 lines with ~50 new lines)

### 2. Create Unit Tests (New File)
**Path:** `app/__tests__/components/tournament-page/user-tournament-statistics.test.tsx`

**Test Coverage:**
- Rendering with complete data
- Rendering with missing data (no stats, no tournament guess)
- Boost usage calculation (0/5, 3/5, 5/5)
- Total calculation accuracy
- Conditional rendering (link button, boosts row)
- Accessibility (ARIA labels)
- Responsive behavior (mobile vs desktop labels)

**Estimated Lines:** ~300 lines

## Implementation Steps

### Step 1: Refactor Component Structure (30 min)
1. Create StatRow internal component
2. Replace Grid container with Stack
3. Replace Grid items with StatRow components
4. Update CardContent padding to `p: 2`

### Step 2: Simplify Data Aggregation (20 min)
1. Remove groupScoreData and playoffScoreData objects
2. Calculate direct totals: groupsTotal, playoffsTotal, qualifiedTotal, awardsTotal
3. Calculate grandTotal (sum of all)
4. Implement calculateBoostsUsed function (Option A: infer from bonuses)

### Step 3: Update Styling (15 min)
1. Update typography variants (body2, body1, h6)
2. Update colors (text.secondary, primary.main, warning.main)
3. Update spacing (Stack spacing={1}, Divider my: 1.5)
4. Add responsive button text (mobile vs desktop)

### Step 4: Conditional Rendering (10 min)
1. Hide boosts row if no boost data available
2. Hide link button if no tournamentId
3. Apply boost color logic (warning.main if < 5)

### Step 5: Accessibility & Semantics (10 min)
1. Add ARIA labels to Card and Button
2. Verify color contrast with theme
3. Test with screen reader (if available)

### Step 6: Create Unit Tests (60 min)
1. Set up test file with renderWithTheme utility
2. Create mock data using testFactories
3. Write tests for rendering scenarios
4. Write tests for calculations (totals, boosts)
5. Write tests for conditional rendering
6. Verify 80% coverage

### Step 7: Manual Testing (20 min)
1. Test in development server (https://localhost:3000)
2. Verify card height reduction (measure before/after)
3. Test on mobile viewport (Chrome DevTools)
4. Test with different data scenarios (no stats, partial stats, full stats)
5. Test link navigation to stats page

### Step 8: Validation & Commit (15 min)
1. Run unit tests: `npm run test`
2. Run linter: `npm run lint`
3. Run build: `npm run build`
4. Commit changes with descriptive message
5. Push to remote for CI/CD

**Total Estimated Time:** ~3 hours

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**File:** `app/__tests__/components/tournament-page/user-tournament-statistics.test.tsx`

**Test Categories:**

#### 1. Rendering Tests
```typescript
describe('UserTournamentStatistics', () => {
  it('renders all stat rows with correct labels', () => {
    const { getByText } = renderWithTheme(<UserTournamentStatistics {...mockProps} />)
    expect(getByText(/grupos:/i)).toBeInTheDocument()
    expect(getByText(/playoffs:/i)).toBeInTheDocument()
    expect(getByText(/clasificados:/i)).toBeInTheDocument()
    expect(getByText(/premios:/i)).toBeInTheDocument()
    expect(getByText(/total:/i)).toBeInTheDocument()
    expect(getByText(/boosts:/i)).toBeInTheDocument()
  })

  it('renders with no data gracefully', () => {
    const { getByText } = renderWithTheme(<UserTournamentStatistics />)
    expect(getByText(/0 pts/i)).toBeInTheDocument()
  })
})
```

#### 2. Calculation Tests
```typescript
describe('Total Calculations', () => {
  it('calculates groups total correctly', () => {
    const props = {
      userGameStatistics: testFactories.gameStatistic({
        group_score: 30,
        group_boost_bonus: 10
      }),
      tournamentGuess: testFactories.tournamentGuess({
        qualified_teams_score: 5,
        group_position_score: 0
      })
    }
    const { getByText } = renderWithTheme(<UserTournamentStatistics {...props} />)
    expect(getByText(/grupos:\s*45 pts/i)).toBeInTheDocument()
  })

  it('calculates grand total correctly', () => {
    // Test with all sources
  })
})

describe('Boost Usage', () => {
  it('shows 0/5 when no boosts used', () => {
    const props = {
      userGameStatistics: testFactories.gameStatistic({
        group_boost_bonus: 0,
        playoff_boost_bonus: 0
      })
    }
    const { getByText } = renderWithTheme(<UserTournamentStatistics {...props} />)
    expect(getByText(/boosts:\s*0\/5/i)).toBeInTheDocument()
  })

  it('shows 2/5 when both bonuses present', () => {
    const props = {
      userGameStatistics: testFactories.gameStatistic({
        group_boost_bonus: 5,
        playoff_boost_bonus: 3
      })
    }
    const { getByText } = renderWithTheme(<UserTournamentStatistics {...props} />)
    expect(getByText(/boosts:\s*2\/5/i)).toBeInTheDocument()
  })
})
```

#### 3. Conditional Rendering Tests
```typescript
describe('Conditional Rendering', () => {
  it('renders link button when tournamentId provided', () => {
    const props = { tournamentId: 'abc123' }
    const { getByRole } = renderWithTheme(<UserTournamentStatistics {...props} />)
    expect(getByRole('link', { name: /ver estadísticas detalladas/i })).toBeInTheDocument()
  })

  it('hides link button when no tournamentId', () => {
    const { queryByRole } = renderWithTheme(<UserTournamentStatistics />)
    expect(queryByRole('link')).not.toBeInTheDocument()
  })

  it('applies warning color to boosts when < 5', () => {
    // Test color application
  })

  it('applies success color to boosts when = 5', () => {
    // Test color application
  })
})
```

#### 4. Accessibility Tests
```typescript
describe('Accessibility', () => {
  it('has proper ARIA labels on card', () => {
    const { getByLabelText } = renderWithTheme(<UserTournamentStatistics />)
    expect(getByLabelText(/estadísticas del usuario/i)).toBeInTheDocument()
  })

  it('has accessible link button', () => {
    const props = { tournamentId: 'abc123' }
    const { getByRole } = renderWithTheme(<UserTournamentStatistics {...props} />)
    const link = getByRole('link')
    expect(link).toHaveAttribute('aria-label', expect.stringContaining('detalladas'))
  })
})
```

#### 5. Integration Tests
```typescript
describe('Integration with Parent Page', () => {
  it('links to correct stats page URL', () => {
    const props = { tournamentId: 'world-cup-2026' }
    const { getByRole } = renderWithTheme(<UserTournamentStatistics {...props} />)
    const link = getByRole('link')
    expect(link).toHaveAttribute('href', '/tournaments/world-cup-2026/stats')
  })
})
```

### Manual Testing Checklist

**Visual Verification:**
- [ ] Card height is reduced by at least 30% compared to current
- [ ] All stats are visible and correctly aligned
- [ ] Dividers are properly spaced
- [ ] Total row is visually prominent (primary color, bold)
- [ ] Boosts row shows correct color (warning for < 5)

**Functional Testing:**
- [ ] Stats calculate correctly with sample data
- [ ] Link navigates to correct stats page
- [ ] Component handles missing data gracefully (no crashes)

**Responsive Testing:**
- [ ] Mobile (< 600px): Card fits within viewport, labels are readable
- [ ] Tablet (600-960px): Same as desktop
- [ ] Desktop (≥960px): Full layout with optimal spacing

**Browser Testing:**
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Test Utilities

**Use existing test utilities from project:**
```typescript
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { testFactories } from '@/__tests__/db/test-factories'
```

**Mock Data Creation:**
```typescript
const mockGameStatistic = testFactories.gameStatistic({
  group_score: 30,
  group_boost_bonus: 10,
  playoff_score: 25,
  playoff_boost_bonus: 5
})

const mockTournamentGuess = testFactories.tournamentGuess({
  qualified_teams_score: 12,
  group_position_score: 8,
  honor_roll_score: 15,
  individual_awards_score: 10
})
```

### Coverage Target

**Requirement:** ≥80% coverage on new code (SonarCloud enforced)

**Expected Coverage:**
- Statements: 90%+
- Branches: 85%+ (conditional rendering)
- Functions: 95%+
- Lines: 90%+

**Coverage Gaps (Acceptable):**
- Theme hook usage (covered by integration tests)
- Next.js Link component (covered by functional tests)

## Validation Considerations

### SonarCloud Quality Gates

**Coverage:**
- Target: 80% minimum on new code
- Expected: 90%+ with comprehensive unit tests

**Code Smells:**
- Avoid complex nested conditionals (extract to functions)
- Keep functions small and focused (< 20 lines)
- Use TypeScript strict types (avoid `any`)

**Duplicated Code:**
- StatRow component eliminates 4 instances of label/value pattern
- Reuse theme colors via constants if needed

**Security:**
- No security concerns (display component, no user input)
- Link href is server-provided, not user input

### Acceptance Criteria Verification

**From Story #113:**

- [x] Stats card shows: Groups, Playoffs, Qualified, Awards points
  - **Verification:** Visual inspection + unit test for all labels present

- [x] Total points prominently displayed
  - **Verification:** Typography h6, primary.main color, bold weight

- [x] Boosts usage shown (e.g., 3/5)
  - **Verification:** Unit test for boost calculation, visual color coding

- [x] Compact single-line format for each section
  - **Verification:** Stack layout with spacing={1}, no nested Grids

- [x] Visual separator between sections and totals
  - **Verification:** Divider components with my: 1.5 spacing

- [x] Link to full stats page remains
  - **Verification:** Button component with href to /tournaments/{id}/stats

- [x] Responsive on all screen sizes
  - **Verification:** Manual testing on mobile/tablet/desktop viewports

- [x] Card height reduced by at least 30% compared to current
  - **Verification:** Manual measurement before/after (Chrome DevTools)

## Open Questions

### 1. Boost Usage Tracking (RESOLVED)

**Question:** How should we calculate boost usage count?
**Options:**
- A) Infer from bonus presence (group_boost_bonus > 0, playoff_boost_bonus > 0)
- B) Query game_guess table for boost_applied = true count
- C) Show qualitative status ("Boosts: Activos") without count

**Decision:** Option A (infer from bonuses) for MVP. Acceptable trade-off between accuracy and complexity. If precise tracking is needed, implement Option B in follow-up story.

### 2. "Qualified" Label Semantics (RESOLVED)

**Question:** Should "Clasificados" include both qualified_teams_score and group_position_score?
**Analysis:**
- qualified_teams_score = Points from predicting which 16 teams advance
- group_position_score = Points from exact group standings
- These are semantically different but both relate to group phase outcomes

**Decision:** Merge both into "Clasificados" row to match story spec simplification. Detailed breakdown remains in full stats page.

### 3. Localization Approach (DEFERRED)

**Question:** Should labels be hardcoded Spanish or use i18n keys?
**Decision:** Keep hardcoded Spanish for consistency with current implementation. If project-wide i18n is implemented later, add translation keys then. No localization infrastructure exists currently.

### 4. Mobile Label Abbreviation (OPTIONAL)

**Question:** Should mobile view use shorter labels (e.g., "Groups" instead of "Grupos")?
**Decision:** Keep same labels across all viewports for consistency. Card width is sufficient for full labels even on mobile. Button text can be shortened ("Ver Stats" vs "Ver Estadísticas Detalladas").

## Risk Assessment

### Low Risk

**Layout Changes:**
- Stack + Box layout is simpler than current Grid
- Less nesting = fewer edge cases
- Material-UI components are battle-tested

**Data Calculations:**
- Using same data sources as current implementation
- Simple addition operations (no complex business logic)
- Safe navigation with `|| 0` fallbacks

### Medium Risk

**Boost Usage Inference:**
- **Risk:** Inferred count may not match actual usage if bonus calculation logic changes
- **Mitigation:** Document assumption clearly, add unit tests to verify logic
- **Fallback:** If inaccuracy causes user confusion, implement precise query in follow-up

**Card Height Reduction:**
- **Risk:** May not achieve 30% reduction target on all screen sizes
- **Mitigation:** Measure before/after in Chrome DevTools, adjust spacing if needed
- **Fallback:** Accept 20-25% reduction if it maintains readability

### Minimal Risk

**Accessibility:**
- Simple text content, no complex interactions
- ARIA labels straightforward to implement
- Theme colors already meet contrast standards

**Testing:**
- Component is display-only (no side effects)
- Easy to mock props with testFactories
- High confidence in 80%+ coverage

## Dependencies

**No external dependencies:**
- Uses existing Material-UI components (Card, CardHeader, CardContent, Stack, Box, Typography, Divider, Button)
- Uses existing data sources (GameStatisticForUser, TournamentGuess)
- Uses existing theme and styling patterns

**Story Dependencies:**
- **Dependent on:** None (standalone refactor)
- **Enables:** #110 - Group standings in sidebar (needs vertical space)
- **Related to:** #111 - Navigation audit (parent story)

## Success Metrics

**Quantitative:**
- Card height reduced by ≥30% (measured in px)
- Unit test coverage ≥80%
- 0 SonarCloud issues (any severity)
- Build passes without warnings

**Qualitative:**
- Stats are easier to scan (user feedback)
- Mobile experience is less cluttered
- Card fits comfortably in sidebar with other widgets

## Rollback Plan

**If issues arise post-deployment:**
1. Revert commit (git revert)
2. Redeploy previous version
3. Investigate issue in development
4. Create fix and redeploy

**Minimal risk:** Display-only component, no database changes, no breaking API changes.

## Future Enhancements (Out of Scope)

**Not in this story:**
- Detailed stat breakdowns (remain in /tournaments/{id}/stats page)
- Historical trends or charts
- Comparison with other users
- Editing or updating stats
- Precise boost usage tracking via database query
- Localization (i18n)
- Dark mode specific styling (uses theme, should work automatically)
- Animations or transitions

**If requested later:**
- Add "Yesterday's Points" row (using existing 24-hour window calculation)
- Add progress bars for each stat category
- Add icons for each stat type (🏆 for awards, ⚡ for boosts, etc.)
