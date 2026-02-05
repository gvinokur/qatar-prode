# Implementation Plan: Story #90 - Visual Qualification Prediction Interface

## Story Context

**Issue:** #90 - [UXI] Implement Visual Qualification Prediction Interface with Card-Based UI

**Problem:** Current qualification predictions are tightly coupled to game score predictions and use a table-based UI. The UX is confusing (changing game scores accidentally changes qualification), and the interface is not mobile-friendly.

**Solution:** Create a dedicated "Qualified Teams" page with visual card-based drag-and-drop interface where users directly predict which teams qualify from each group and their final positions (1-4). Include special handling for 3rd place qualifiers (e.g., FIFA 2026's 8 "best 3rd place" teams across 12 groups).

## Objectives

1. **Decouple** qualification predictions from game score predictions
2. **Improve UX** with engaging, visual, mobile-friendly drag-and-drop interface
3. **Simplify** 3rd place qualification logic with clear UI
4. **Maintain** existing scoring system (1 pt for correct qualification + 1 pt for exact position)
5. **Ensure** 80% test coverage and 0 new SonarCloud issues

## Acceptance Criteria Summary

- AC1: New "Qualified Teams" tab and page route
- AC2: Card-based group display (responsive: 4/3/1 per row)
- AC3: Drag-and-drop ranking within groups
- AC4: Third place qualification checkbox with validation
- AC5: Real-time auto-save (debounced 500ms)
- AC6: New database table `tournament_qualified_teams_predictions`
- AC7: Tournament configuration (allows_third_place_qualification, max_third_place_qualifiers)
- AC8: Scoring system implementation
- AC9: Predictions lock timing (same as tournament)
- AC10: Integration with existing navigation and permissions
- AC11: Full accessibility (keyboard nav, ARIA, screen reader)
- AC12: Error states and edge cases

## Visual Prototypes

### Desktop Layout (≥1024px)

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Predicción de Equipos Clasificados                │
│              32 of 32 teams selected (24 direct + 8 third-place)     │
│                                                                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│  │ GRUPO A │  │ GRUPO B │  │ GRUPO C │  │ GRUPO D │                │
│  ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤                │
│  │ [⋮⋮] 1  │  │ [⋮⋮] 1  │  │ [⋮⋮] 1  │  │ [⋮⋮] 1  │                │
│  │ 🇦🇷 ARG  │  │ 🇪🇸 ESP  │  │ 🇩🇪 GER  │  │ 🇧🇷 BRA  │                │
│  │ ✓ Calif. │  │ ✓ Calif. │  │ ✓ Calif. │  │ ✓ Calif. │                │
│  │  (green) │  │  (green) │  │  (green) │  │  (green) │                │
│  ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤                │
│  │ [⋮⋮] 2  │  │ [⋮⋮] 2  │  │ [⋮⋮] 2  │  │ [⋮⋮] 2  │                │
│  │ 🇺🇾 URU  │  │ 🇵🇹 POR  │  │ 🇳🇱 NED  │  │ 🇫🇷 FRA  │                │
│  │ ✓ Calif. │  │ ✓ Calif. │  │ ✓ Calif. │  │ ✓ Calif. │                │
│  │  (green) │  │  (green) │  │  (green) │  │  (green) │                │
│  ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤                │
│  │ [⋮⋮] 3  │  │ [⋮⋮] 3  │  │ [⋮⋮] 3  │  │ [⋮⋮] 3  │                │
│  │ 🇨🇴 COL  │  │ 🇮🇹 ITA  │  │ 🇧🇪 BEL  │  │ 🇲🇽 MEX  │                │
│  │ [✓]3er?  │  │ [✓]3er?  │  │ [ ]3er?  │  │ [✓]3er?  │                │
│  │ (yellow) │  │ (yellow) │  │ (yellow) │  │ (yellow) │                │
│  ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤                │
│  │ [⋮⋮] 4  │  │ [⋮⋮] 4  │  │ [⋮⋮] 4  │  │ [⋮⋮] 4  │                │
│  │ 🇨🇱 CHI  │  │ 🇨🇷 CRC  │  │ 🇦🇹 AUT  │  │ 🇺🇸 USA  │                │
│  │  (gray)  │  │  (gray)  │  │  (gray)  │  │  (gray)  │                │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘                │
│                                                                        │
│  [... 8 more rows of 4 groups each ...]                              │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Third Place Qualifiers: 8 of 8 selected ✓                    │   │
│  │ • COL (Grupo A)  • ITA (Grupo B)  • MEX (Grupo D)            │   │
│  │ • [... 5 more teams ...]                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  [Auto-saved ✓]                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (<768px)

```
┌─────────────────────────────┐
│  Equipos Clasificados       │
│  24/32 selected             │
│  ⚠️ Select 8 more           │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │     GRUPO A           │  │
│  ├───────────────────────┤  │
│  │ [⋮⋮] 1 🇦🇷 Argentina  │  │
│  │      ✓ Qualified      │  │
│  │      (green bg)       │  │
│  ├───────────────────────┤  │
│  │ [⋮⋮] 2 🇺🇾 Uruguay    │  │
│  │      ✓ Qualified      │  │
│  │      (green bg)       │  │
│  ├───────────────────────┤  │
│  │ [⋮⋮] 3 🇨🇴 Colombia   │  │
│  │ [✓] Clasificar 3er?   │  │
│  │      (yellow bg)      │  │
│  ├───────────────────────┤  │
│  │ [⋮⋮] 4 🇨🇱 Chile      │  │
│  │      (gray bg)        │  │
│  └───────────────────────┘  │
│                              │
│  ┌───────────────────────┐  │
│  │     GRUPO B           │  │
│  ├───────────────────────┤  │
│  │ [...similar layout]   │  │
│  └───────────────────────┘  │
│                              │
│  [Vertical scroll...]        │
│                              │
│  ┌──────────────────────┐   │
│  │ 3rd Place: 3 of 8 ✓  │   │
│  │ • COL (A) • ITA (B)  │   │
│  └──────────────────────┘   │
│                              │
│  [Guardando... ⏳]          │
└─────────────────────────────┘
```

### Team Card Component States

```
┌─────────────────────────────────────┐
│  POSITION 1-2 (GREEN BACKGROUND)    │
├─────────────────────────────────────┤
│  [⋮⋮]  1  🇦🇷  Argentina            │
│             ✓ Qualified              │
│                                      │
│  • Drag handle visible on hover     │
│  • Green background (#4caf50)       │
│  • Checkmark chip                   │
│  • No checkbox                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  POSITION 3 (YELLOW/AMBER BG)       │
├─────────────────────────────────────┤
│  [⋮⋮]  3  🇨🇴  Colombia             │
│  [ ] Clasificar como 3er lugar?     │
│                                      │
│  • Yellow background (#ffc107)      │
│  • Checkbox for 3rd place selection │
│  • Shows validation if max reached  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  POSITION 4 (GRAY BACKGROUND)       │
├─────────────────────────────────────┤
│  [⋮⋮]  4  🇨🇱  Chile                │
│                                      │
│  • Gray background (#9e9e9e)        │
│  • No qualification indicator       │
│  • No checkbox                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  DRAGGING STATE                     │
├─────────────────────────────────────┤
│    [⋮⋮]  2  🇺🇾  Uruguay            │
│               ✓ Qualified            │
│                                      │
│  • Scale up 1.05x                   │
│  • Increased shadow                 │
│  • Slight opacity (0.8)             │
│  • Drop zones highlighted below     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  KEYBOARD ACCESSIBLE (FOCUS STATE)  │
├─────────────────────────────────────┤
│  [⋮⋮]  1  🇦🇷  Argentina            │
│  [↑] Move Up  [↓] Move Down         │
│                                      │
│  • 2px focus outline (blue)         │
│  • Move buttons visible on focus    │
│  • Screen reader: "Argentina,       │
│    position 1, qualified"           │
└─────────────────────────────────────┘
```

### Responsive Breakpoints

```
Desktop (≥1024px):   4 groups per row
Tablet (768-1023px): 3 groups per row
Mobile (<768px):     1 group per row (vertical scroll)
```

### Color Scheme (Material-UI Theme)

- **Position 1-2 (Qualified):** Green (#4caf50 / theme.palette.success.main)
- **Position 3 (Potential 3rd):** Yellow/Amber (#ffc107 / theme.palette.warning.main)
- **Position 4 (Not qualified):** Gray (#9e9e9e / theme.palette.grey[500])
- **Drag indicator:** Blue (#2196f3 / theme.palette.primary.main)
- **Focus outline:** Blue 2px solid
- **Error text:** Red (#f44336 / theme.palette.error.main)

### Animation Specifications

- **Drag start:** Scale 1 → 1.05, shadow 2 → 8, 200ms ease-out
- **Drop:** Position transition 300ms ease, background color 200ms ease
- **Reorder:** Cards shift with 250ms cubic-bezier(0.4, 0, 0.2, 1)
- **Checkbox:** Ripple effect from MUI (default)
- **Save indicator:** Fade in/out 300ms

## Technical Approach

### Tech Stack Decisions

1. **Drag-and-Drop:** `@dnd-kit/core` + `@dnd-kit/sortable` (NEW DEPENDENCY)
   - Modern, performant, accessible
   - Touch-friendly for mobile
   - Better than react-beautiful-dnd (deprecated) or react-dnd (complex)

2. **Animations:** Framer Motion (already in project)
   - Smooth card transitions
   - Auto-save indicator animations
   - Scale/shadow effects during drag

3. **UI Components:** Material-UI v7 (existing)
   - Card, CardContent, CardHeader
   - Checkbox, Chip
   - Grid for responsive layout
   - Snackbar for errors
   - useMediaQuery for breakpoints

4. **State Management:** React Context pattern (existing pattern from GuessesContext)
   - QualifiedTeamsContext for prediction state
   - Auto-save with debounce (500ms)
   - Optimistic updates with rollback on error

5. **Database:** PostgreSQL + Kysely ORM (existing)
   - New table: `tournament_qualified_teams_predictions`
   - Follow existing repository patterns

### Architecture Decisions

**Server vs Client Components:**
- **Server Component:** Page (`page.tsx`) - Fetch initial data, auth check
- **Client Component:** Main UI (`qualified-teams-client.tsx`) - Interactivity, drag-and-drop
- **Client Components:** Individual cards, group display - State management

**Data Flow:**
```
Server (page.tsx)
  ↓ Fetch user predictions, tournament config, teams
Client (qualified-teams-client.tsx)
  ↓ Initialize QualifiedTeamsContext
Drag/Drop Actions
  ↓ Update local state (optimistic)
  ↓ Debounced Server Action (500ms)
Server Action (qualification-actions.ts)
  ↓ Validate + Save to DB
  ↓ Return success/error
Client
  ↓ Confirm save OR rollback on error
```

### Database Schema Design

**New Table:** `tournament_qualified_teams_predictions`

```sql
CREATE TABLE tournament_qualified_teams_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES tournament_groups(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  predicted_position INT NOT NULL CHECK (predicted_position BETWEEN 1 AND 4),
  qualifies_as_third_place BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraints
  UNIQUE(user_id, tournament_id, group_id, team_id),
  UNIQUE(user_id, tournament_id, group_id, predicted_position),

  -- Indexes for performance
  INDEX idx_qualified_predictions_user_tournament (user_id, tournament_id),
  INDEX idx_qualified_predictions_tournament_group (tournament_id, group_id)
);

-- Constraint: Only position 3 can have qualifies_as_third_place = true
ALTER TABLE tournament_qualified_teams_predictions
  ADD CONSTRAINT check_third_place_position
  CHECK (
    (qualifies_as_third_place = FALSE) OR
    (qualifies_as_third_place = TRUE AND predicted_position = 3)
  );
```

**Tournament Configuration (existing table):**

```sql
ALTER TABLE tournaments
  ADD COLUMN allows_third_place_qualification BOOLEAN DEFAULT FALSE,
  ADD COLUMN max_third_place_qualifiers INT DEFAULT 0;
```

**Scoring Column (existing table):**

```sql
ALTER TABLE tournament_guesses
  ADD COLUMN qualification_score INT DEFAULT 0;
```

### Auto-Save State Machine (CRITICAL)

**State Management Pattern:**

```typescript
type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface PredictionState {
  predictions: Map<string, QualifiedTeamPrediction>;
  saveState: SaveState;
  lastSaved: Date | null;
  error: string | null;
  pendingChanges: QualifiedTeamPrediction[];
}
```

**State Transitions:**

```
idle ──(user drags)──> pending
    └──(component mount with data)──> idle

pending ──(500ms debounce expires)──> saving
       └──(user drags again)──> pending (reset timer)

saving ──(server success)──> saved
      └──(server error)──> error

saved ──(user drags)──> pending
     └──(2 seconds)──> idle

error ──(user clicks retry)──> saving
     └──(user makes change)──> pending (discard error)
```

**Implementation Details:**

```typescript
// qualified-teams-context.tsx
const [saveState, setSaveState] = useState<SaveState>('idle');
const [pendingChanges, setPendingChanges] = useState<QualifiedTeamPrediction[]>([]);
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// On user drag/checkbox change
const handlePredictionChange = (change: QualifiedTeamPrediction) => {
  // 1. Update local state immediately (optimistic)
  setPredictions(prev => new Map(prev).set(change.teamId, change));

  // 2. Add to pending queue
  setPendingChanges(prev => [...prev, change]);

  // 3. Set state to pending
  setSaveState('pending');

  // 4. Clear existing timeout
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }

  // 5. Set new 500ms timeout
  saveTimeoutRef.current = setTimeout(async () => {
    setSaveState('saving');
    try {
      await updateQualificationPredictions(pendingChanges);
      setSaveState('saved');
      setPendingChanges([]);

      // Auto-return to idle after 2s
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      // Rollback optimistic updates
      setPredictions(prevServerState);
      setSaveState('error');
      setError(error.message);
    }
  }, 500);
};

// On component unmount - flush pending
useEffect(() => {
  return () => {
    if (pendingChanges.length > 0) {
      // Flush immediately without debounce
      updateQualificationPredictions(pendingChanges);
    }
  };
}, [pendingChanges]);
```

**UI Indicators:**

- `idle`: No indicator visible
- `pending`: Show "..." (ellipsis animation)
- `saving`: Show "Guardando..." with spinner
- `saved`: Show "Guardado ✓" (green checkmark, fade out after 2s)
- `error`: Show "Error al guardar" (red X) + Retry button

### Keyboard & Screen Reader Strategy (ACCESSIBILITY CRITICAL)

**Keyboard Navigation Implementation:**

1. **Tab Order:**
   ```
   Page Header → Group 1 Card 1 → [Move Up] [Move Down] → Checkbox (if pos 3)
   → Group 1 Card 2 → ... → Group 1 Card 4
   → Group 2 Card 1 → ...
   ```

2. **Keyboard Shortcuts:**
   - `Tab` / `Shift+Tab`: Navigate between team cards
   - `Enter` / `Space`: Activate drag mode for focused card
   - `Arrow Up` / `Arrow Down`: Move card up/down while in drag mode
   - `Escape`: Cancel drag, return to original position
   - `Space`: Toggle checkbox (when focused on position 3)

3. **dnd-kit Keyboard Setup:**
   ```typescript
   // team-card-draggable.tsx
   import { useSortable } from '@dnd-kit/sortable';

   const {
     attributes,
     listeners,
     setNodeRef,
     transform,
     transition,
     isDragging,
   } = useSortable({
     id: teamId,
     // Enable keyboard sensors
     disabled: isLocked,
   });

   // Keyboard activation - Enter or Space
   const keyboardSensor = new KeyboardSensor({
     coordinateGetter: sortableKeyboardCoordinates,
   });
   ```

**ARIA Implementation:**

1. **Live Regions for Announcements:**
   ```typescript
   // qualified-teams-client.tsx
   <div
     role="status"
     aria-live="polite"
     aria-atomic="true"
     className="sr-only"
   >
     {announcement}
   </div>

   // Set announcement on drag end:
   setAnnouncement(`${teamName} moved to position ${newPosition} in ${groupName}`);
   ```

2. **Team Card ARIA Labels:**
   ```typescript
   // team-card-draggable.tsx
   <div
     ref={setNodeRef}
     role="button"
     aria-label={`${teamName}, position ${position}, ${
       position <= 2 ? 'qualified' :
       position === 3 ? 'third place, click to select' :
       'not qualified'
     }. Press Enter to drag, Arrow keys to reorder.`}
     aria-describedby={`group-${groupId}-instructions`}
     tabIndex={0}
     {...attributes}
     {...listeners}
   >
   ```

3. **Instructions for Screen Readers:**
   ```typescript
   // group-card.tsx
   <div id={`group-${groupId}-instructions`} className="sr-only">
     Use Arrow keys to reorder teams within this group.
     Press Escape to cancel dragging.
   </div>
   ```

4. **Third Place Counter (Live Updates):**
   ```typescript
   // third-place-summary.tsx
   <div role="status" aria-live="polite" aria-atomic="true">
     Third Place Qualifiers: {count} of {max} selected
     {count < max && ` - ${max - count} more needed`}
   </div>
   ```

**Screen Reader Testing Checklist:**
- [ ] VoiceOver (macOS): Announces position changes on drag
- [ ] NVDA (Windows): Announces checkbox state changes
- [ ] Focus moves logically through groups
- [ ] Drag mode announced when activated
- [ ] Error messages announced with `aria-live="assertive"`

### Third-Place Backward Compatibility (DATA INTEGRITY)

**Problem:** If tournament config changes from `max_third_place_qualifiers = 8` to `max_third_place_qualifiers = 4`, existing predictions might violate the new constraint.

**Solution - Data Migration Strategy:**

1. **Migration File:** `202602XX000001_cleanup_excess_third_place.sql`
   ```sql
   -- Run AFTER tournament config is updated
   -- Remove excess third-place selections for users exceeding new max

   WITH ranked_thirds AS (
     SELECT
       id,
       user_id,
       tournament_id,
       ROW_NUMBER() OVER (
         PARTITION BY user_id, tournament_id
         ORDER BY updated_at DESC
       ) as row_num,
       t.max_third_place_qualifiers
     FROM tournament_qualified_teams_predictions tq
     JOIN tournaments t ON t.id = tq.tournament_id
     WHERE tq.qualifies_as_third_place = TRUE
       AND tq.predicted_position = 3
   )
   DELETE FROM tournament_qualified_teams_predictions
   WHERE id IN (
     SELECT id FROM ranked_thirds
     WHERE row_num > max_third_place_qualifiers
   );
   ```

2. **Application-Level Check:**
   ```typescript
   // qualification-actions.ts
   export async function updateQualificationPredictions(
     predictions: QualifiedTeamPredictionNew[]
   ) {
     // Get tournament config
     const tournament = await getTournament(predictions[0].tournament_id);
     const maxThirdPlace = tournament.max_third_place_qualifiers;

     // Count current third place selections
     const currentCount = await countThirdPlaceQualifiers(
       userId,
       tournamentId
     );

     // Count new third place selections being added
     const newThirdPlaceCount = predictions.filter(
       p => p.qualifies_as_third_place && p.predicted_position === 3
     ).length;

     // Validate
     if (currentCount + newThirdPlaceCount > maxThirdPlace) {
       throw new Error(
         `Maximum ${maxThirdPlace} third place qualifiers allowed. ` +
         `You currently have ${currentCount} selected.`
       );
     }

     // Proceed with upsert...
   }
   ```

3. **UI Warning for Users:**
   - If user has excess third-place selections after config change, show banner:
   - "Tournament rules changed - you have too many third-place teams selected. Please remove {N} teams."
   - Disable saving until user compliance

### Component Structure

```
app/tournaments/[id]/qualified-teams/
├── page.tsx                              [Server Component]
│   - Fetch user, tournament, groups, teams, predictions
│   - Check permissions (user must be logged in)
│   - Pass data to client component
│
└── qualified-teams-client.tsx            [Client Component]
    - DndContext provider
    - QualifiedTeamsContextProvider
    - Auto-save logic (implements state machine above)
    - ARIA live region for announcements
    - Render GroupGrid

app/components/qualified-teams/
├── group-grid.tsx                        [Client Component]
│   - Responsive grid layout
│   - Map groups to GroupCard components
│
├── group-card.tsx                        [Client Component]
│   - Group header with letter
│   - SortableContext for team cards
│   - Handle drag events
│
├── team-card-draggable.tsx               [Client Component]
│   - useSortable hook from dnd-kit
│   - Position number, flag, team name
│   - Drag handle, move buttons (a11y)
│   - Third place checkbox (if position === 3)
│   - Background color based on position
│
├── third-place-summary.tsx               [Client Component]
│   - Count display: "X of Y selected"
│   - Warning if incomplete
│   - List of selected teams
│
└── qualified-teams-context.tsx           [Client Component]
    - State: predictions map, pending saves, errors
    - updatePosition(groupId, teamId, newPosition)
    - toggleThirdPlace(groupId, teamId)
    - Auto-save with debounce (500ms)
    - Optimistic updates

app/db/
├── qualified-teams-repository.ts         [NEW]
│   - upsertQualificationPrediction()
│   - getQualificationPredictions(userId, tournamentId)
│   - getQualificationPredictionsByGroup()
│   - countThirdPlaceQualifiers(userId, tournamentId)
│   - deleteQualificationPrediction()
│
└── tables-definition.ts                  [MODIFY]
    - Add QualifiedTeamPredictionTable interface
    - Add QualifiedTeamPrediction, QualifiedTeamPredictionNew types

app/db/database.ts                        [MODIFY]
    - Add qualified_team_predictions to Database interface

app/actions/
└── qualification-actions.ts              [NEW]
    - updateQualificationPredictions() [Server Action]
    - Validates max third place qualifiers
    - Batch upsert to repository
    - Returns success/error

app/utils/
└── qualification-scoring.ts              [NEW]
    - calculateQualificationScore(userPredictions, actualResults)
    - 1 pt for correct qualification
    - +1 pt for exact position match

app/components/groups-page/
└── group-selector.tsx                    [MODIFY]
    - Add "CLASIFICADOS" tab
    - Add route detection for /qualified-teams
```

### Implementation Steps

**⚠️ MIGRATION TIMING:**
- Migration files created in Phase 1
- Migration **RUN** only after user approval and before Phase 2 starts
- ALWAYS ask user permission before running migrations
- Follow implementation.md Section 8 Step 4

---

**Phase 0: Pre-Implementation Setup (Day 1)**
1. **Install dnd-kit dependencies** (MUST be first)
   ```bash
   npm install @dnd-kit/core@^6.1.0 @dnd-kit/sortable@^8.0.0 @dnd-kit/utilities@^3.2.2
   ```
2. Verify dependencies install without conflicts
3. Update package.json and package-lock.json

**Phase 1: Database & Foundation (Days 1-2)**
1. Create migration file for new table + tournament columns
2. **🛑 STOP - ASK USER PERMISSION TO RUN MIGRATION**
3. Run migration (only after approval)
4. Add TypeScript interfaces to `tables-definition.ts`
5. Register table in `database.ts`
6. Add test factory: `testFactories.qualifiedTeamPrediction()` in `test-factories.ts`
7. Create `qualified-teams-repository.ts` with CRUD functions
8. Write unit tests for repository (100% coverage target)

**Phase 2: Server Actions (Day 2)**
1. Create `qualification-actions.ts` with Server Action
2. Implement validation logic:
   - Max third place check (business rule)
   - Teams belong to correct groups (data integrity)
   - Tournament not locked (authorization)
   - User authenticated (security)
3. Add auth check (getLoggedInUser)
4. Implement error handling with clear messages
5. Write unit tests for Server Actions (100% coverage target)

**Phase 3: Context & State Management (Day 3)**
1. Create `qualified-teams-context.tsx`
2. **Implement auto-save state machine** (see section above)
   - Define SaveState type and transitions
   - Implement debounce logic (500ms)
   - Add component unmount flush
3. **Implement optimistic updates with rollback**
   - Store server state snapshot before changes
   - Rollback on error using snapshot
4. Add error recovery with retry button
5. Write unit tests for context logic:
   - State transitions (idle → pending → saving → saved/error)
   - Debounce timing (rapid changes reset timer)
   - Component unmount flush
   - Rollback on error
   - **Target: 100% coverage** (critical business logic)

**Phase 4: UI Components - Team Card (Days 4-5)**
1. Create `team-card-draggable.tsx`
2. Implement useSortable hook from dnd-kit
3. Add visual elements: drag handle, position number, flag, team name
4. Add third place checkbox (conditional on position === 3)
5. Add background color logic (green/yellow/gray based on position)
6. **Add keyboard accessibility:**
   - Tab navigation with proper focus indicators (2px blue outline)
   - Move up/down buttons (visible on focus, hidden otherwise)
   - Enter/Space to activate drag mode
   - Arrow keys to move card (when in drag mode)
   - Escape to cancel drag
7. **Add ARIA attributes:**
   - `role="button"` on card
   - `aria-label` with position, team name, qualification status
   - `aria-describedby` pointing to group instructions
   - `tabIndex={0}` for keyboard focus
8. Write unit tests:
   - Rendering (team name, flag, position, colors)
   - Drag events (mock useSortable)
   - Checkbox visibility based on position
   - Keyboard move buttons appear on focus
   - **Target: 80% coverage**

**Phase 5: UI Components - Group Card (Day 5)**
1. Create `group-card.tsx`
2. Implement SortableContext for team cards (dnd-kit)
3. Add hidden instructions div for screen readers (`sr-only` class)
4. Handle drag events (onDragEnd)
5. Update context state on reorder
6. **Set announcement** in ARIA live region on drag complete
7. Write unit tests:
   - Renders all 4 team cards in correct order
   - Drag reorder updates positions correctly
   - Context state updates called with correct data
   - **Target: 80% coverage**

**Phase 6: UI Components - Grid & Summary (Day 6)**
1. Create `group-grid.tsx` with responsive layout
2. Implement useMediaQuery for breakpoints (xs/sm/md)
3. Responsive grid sizing: 1/3/4 groups per row
4. Create `third-place-summary.tsx`
5. Display count with ARIA live region: "X of Y selected"
6. Show warning if incomplete (⚠️ icon + text)
7. List selected teams with group labels
8. Color-coded display (green if complete, yellow if incomplete)
9. Write unit tests:
   - Responsive layout changes at breakpoints
   - Summary count calculations
   - Warning visibility logic
   - **Target: 80% coverage**

**Phase 7a: Server Page Component (Day 7)**
1. Create `app/tournaments/[id]/qualified-teams/page.tsx` (Server Component)
2. Fetch required data in parallel:
   - User authentication (getLoggedInUser)
   - Tournament details with config
   - Groups for tournament
   - Teams for tournament
   - User's existing predictions
3. Check permissions:
   - Redirect if not logged in
   - Check if tournament allows viewing
4. Pass all data as props to client component
5. Handle loading and error states

**Phase 7b: Client Component & DnD Setup (Day 7)**
1. Create `qualified-teams-client.tsx` (Client Component)
2. Set up DndContext with sensors:
   - Mouse sensor
   - Touch sensor
   - Keyboard sensor (with sortableKeyboardCoordinates)
3. Wrap with QualifiedTeamsContextProvider
4. Add ARIA live region for announcements (polite)
5. Render GroupGrid with data
6. Add save state indicator UI (idle/pending/saving/saved/error)
7. Test DnD context setup (sensors configured correctly)

**Phase 7c: Navigation Integration (Day 8)**
1. Modify `app/components/groups-page/group-selector.tsx`:
   - Add "CLASIFICADOS" Tab component
   - Add route: `/tournaments/${tournamentId}/qualified-teams`
   - Add pathname detection: `pathname.includes('/qualified-teams')`
   - Position: After group tabs, before "PLAYOFFS"
2. Add conditional visibility logic:
   - Show tab if tournament has knockout stage (most tournaments)
   - Or if `allows_third_place_qualification = true`
3. Test tab navigation and active state

**Phase 7d: Integration Tests (Day 8)**
1. Write end-to-end drag test:
   - Render full page with mock data
   - Simulate drag from position 2 to 1
   - Verify UI updates (positions swap)
   - Verify Server Action called with correct data
   - Verify "Saved ✓" indicator appears
2. Write third-place validation test:
   - Check max teams as third place
   - Attempt to check one more
   - Verify error message appears
   - Verify checkbox disabled
3. Write auto-save debounce test:
   - Drag team, verify no immediate save
   - Wait 500ms, verify save called
   - Drag again within 500ms, verify debounce resets
4. **Target: 80% coverage on integration scenarios**

**Phase 8: Scoring System (Day 9)**
1. Create `qualification-scoring.ts` utility
2. Implement scoring calculation logic
3. Add Server Action `calculateAndStoreQualificationScores()`
4. Store in `tournament_guesses.qualification_score`
5. Write unit tests (various scoring scenarios)

**Phase 9a: ARIA & Screen Reader (Day 10 morning)**
1. Verify all ARIA labels implemented (from Phase 4-6)
2. Test ARIA live regions announce correctly
3. Test with VoiceOver (macOS):
   - Navigate through groups and cards
   - Verify position announcements on drag
   - Verify checkbox labels clear
   - Verify count updates announced
4. Document any screen reader issues found

**Phase 9b: Keyboard Navigation Testing (Day 10 afternoon)**
1. Test keyboard navigation flow:
   - Tab through all interactive elements
   - Enter/Space activates drag
   - Arrow keys move cards
   - Escape cancels drag
2. Verify focus indicators visible (2px blue outline)
3. Test move up/down buttons (visible on focus)
4. Document any keyboard issues found

**Phase 9c: Color Contrast & Visual Polish (Day 10 evening)**
1. Verify color contrast using DevTools:
   - Green text on green background ≥4.5:1
   - Yellow text on yellow background ≥4.5:1
   - Gray text on gray background ≥4.5:1
2. Adjust colors if needed to meet WCAG AA
3. Test focus indicators in high contrast mode
4. Polish animations (timing, easing)

**Phase 10: Error Handling & Edge Cases (Day 11)**
1. **Implement error states:**
   - Save failed: Show Snackbar with retry button
   - Load failed: Show error message with reload button
   - Network timeout: Show timeout message
2. **Add retry logic:**
   - Retry button triggers save attempt
   - Max 3 retries before showing "contact support" message
3. **Handle empty states:**
   - No groups: "No groups configured for this tournament"
   - No teams in group: "Group has no teams"
   - No tournament data: Redirect to tournament list
4. **Validation error messages:**
   - Max 3rd place exceeded: "Maximum {max} third-place teams allowed. You have {count} selected."
   - Tournament locked: "Predictions are locked for this tournament"
5. **Implement network error handling:**
   - Use MUI Snackbar for transient errors
   - Auto-dismiss after 5 seconds (except save errors)
6. **Write tests for error scenarios:**
   - Save failure with rollback
   - Network error with retry
   - Validation errors
   - Empty states render correctly
   - **Target: 80% coverage**

**Phase 10.5: Advanced Integration Tests (Day 11 afternoon)**
1. **Drag + Network Error Test:**
   - User drags team
   - Network fails during save
   - Verify rollback to previous state
   - Verify error message shown
   - User clicks retry
   - Verify save succeeds
2. **Concurrent Tab Editing Test:**
   - Open 2 tabs with same tournament
   - Make change in Tab A
   - Make different change in Tab B
   - Verify last write wins (document behavior)
3. **Tournament Lock During Editing:**
   - User is editing predictions
   - Tournament becomes locked (simulate)
   - Verify UI becomes read-only
   - Verify save blocked with clear message

**Phase 11: Testing & Quality (Days 12-13)**
1. **Run all unit tests** (`npm run test`)
   - Verify ALL tests pass
   - Check coverage report
2. **Verify 80% coverage on ALL new code:**
   - Repository: 100%
   - Server Actions: 100%
   - Context: 100%
   - Components: ≥80%
   - Utilities: 100%
3. **Run linter** (`npm run lint`)
   - Fix any lint errors
   - Fix any TypeScript errors
4. **Test on real devices:**
   - iOS Safari (iPhone): Drag-and-drop smooth
   - Android Chrome: Touch interactions work
   - Tablet: 3-groups-per-row layout correct
5. **Keyboard navigation final test:**
   - Complete navigation through all groups
   - Verify all shortcuts work
6. **Screen reader final test:**
   - VoiceOver: Full flow test
   - NVDA (if available): Basic test
7. **Build project** (`npm run build`)
   - Verify NO errors
   - Verify NO warnings (or justify if necessary)

**Phase 12: Documentation & Deployment**
1. Update README if needed
2. Add code comments for complex logic
3. Verify migration is ready to run
4. Commit changes
5. Push to GitHub
6. Create PR
7. Wait for CI/CD checks
8. SonarCloud analysis - fix any issues
9. User acceptance testing in Vercel Preview
10. Merge after approval

## Files to Create

**New Files:**
1. `/migrations/202602XX000000_create_qualified_teams_predictions.sql`
2. `/migrations/202602XX000001_cleanup_excess_third_place.sql` (backward compatibility)
3. `/app/db/qualified-teams-repository.ts`
4. `/app/actions/qualification-actions.ts`
5. `/app/utils/qualification-scoring.ts`
6. `/app/tournaments/[id]/qualified-teams/page.tsx`
7. `/app/tournaments/[id]/qualified-teams/qualified-teams-client.tsx`
8. `/app/components/qualified-teams/group-grid.tsx`
9. `/app/components/qualified-teams/group-card.tsx`
10. `/app/components/qualified-teams/team-card-draggable.tsx`
11. `/app/components/qualified-teams/third-place-summary.tsx`
12. `/app/components/qualified-teams/qualified-teams-context.tsx`
13. `/__tests__/db/qualified-teams-repository.test.ts`
14. `/__tests__/actions/qualification-actions.test.ts`
15. `/__tests__/utils/qualification-scoring.test.ts`
16. `/__tests__/components/qualified-teams/team-card-draggable.test.tsx`
17. `/__tests__/components/qualified-teams/group-card.test.tsx`
18. `/__tests__/components/qualified-teams/third-place-summary.test.tsx`

## Files to Modify

1. `/package.json` - Add dnd-kit dependencies (Phase 0)
2. `/app/db/tables-definition.ts` - Add QualifiedTeamPredictionTable interface
3. `/app/db/database.ts` - Register new table
4. `/__tests__/db/test-factories.ts` - Add `qualifiedTeamPrediction()` factory
5. `/app/components/groups-page/group-selector.tsx` - Add "CLASIFICADOS" tab

## Testing Strategy

### Unit Tests (Target: 80% coverage on new code)

**Repository Tests:** `qualified-teams-repository.test.ts`
- Test upsertQualificationPrediction with valid data
- Test getQualificationPredictions returns correct format
- Test countThirdPlaceQualifiers counts correctly
- Test deleteQualificationPrediction removes record
- Test unique constraints (same team can't have 2 positions)
- Use `createMockSelectQuery`, `createMockInsertQuery` from mock helpers
- Use `testFactories.qualifiedTeamPrediction()` for mock data

**Server Action Tests:** `qualification-actions.test.ts`
- Test updateQualificationPredictions with auth check
- Test validation: max third place qualifiers exceeded
- Test batch upsert calls repository correctly
- Test error handling (DB error, auth error)
- Mock `getLoggedInUser()` from next-auth
- Use `createMockSession()` from `next-auth.mocks.ts`

**Scoring Tests:** `qualification-scoring.test.ts`
- Test correct qualification + exact position = 2 points
- Test correct qualification + wrong position = 1 point
- Test team didn't qualify = 0 points
- Test edge cases (all correct, all wrong, mixed)
- Use `testFactories` for mock teams and predictions

**Component Tests:** `team-card-draggable.test.tsx`
- Test renders team name, flag, position number
- Test green background for position 1-2
- Test yellow background for position 3
- Test gray background for position 4
- Test checkbox only visible for position 3
- Test drag handle visible on hover (desktop)
- Test keyboard move buttons visible on focus
- Use `renderWithTheme()` from test-utils
- Mock `useSortable` hook from dnd-kit

**Component Tests:** `group-card.test.tsx`
- Test renders all 4 team cards
- Test drag reorder updates positions
- Test SortableContext setup correct
- Use `renderWithProviders()` with QualifiedTeamsContext

**Component Tests:** `third-place-summary.test.tsx`
- Test displays count correctly
- Test shows warning when incomplete
- Test lists selected teams
- Test color changes based on completion

### Integration Tests

**End-to-End Drag Test:**
1. Render full page with mock data
2. Drag team from position 2 to position 1
3. Verify positions update (2→1, 1→2)
4. Verify Server Action called with correct data
5. Verify UI shows "Saved ✓" indicator

**Third Place Validation Test:**
1. Check 8 teams as third place qualifiers
2. Attempt to check 9th team
3. Verify error Snackbar appears
4. Verify checkbox disabled for 9th team
5. Uncheck one team
6. Verify 9th team checkbox now enabled

**Auto-Save Test:**
1. Drag team to new position
2. Wait 500ms (debounce)
3. Verify Server Action called once
4. Drag another team immediately
5. Verify debounce resets, only 1 call after 500ms from last change

### Accessibility Tests

**Keyboard Navigation:**
- Tab through all groups and cards
- Enter key activates drag on selected card
- Arrow keys move card up/down
- Escape cancels drag
- Focus indicators visible (2px outline)

**Screen Reader:**
- Test with VoiceOver (macOS)
- Verify position announcements on drag
- Verify checkbox labels descriptive
- Verify live regions for count updates

**Color Contrast:**
- Verify green text on green background ≥4.5:1
- Verify yellow text on yellow background ≥4.5:1
- Verify gray text on gray background ≥4.5:1
- Use browser DevTools contrast checker

### Manual Testing Checklist

**Desktop (Chrome, Firefox, Safari, Edge):**
- [ ] Drag-and-drop smooth, no visual glitches
- [ ] Hover shows drag handle
- [ ] Cards reorder correctly
- [ ] Checkboxes work
- [ ] Auto-save indicator appears
- [ ] Responsive at 1024px, 1440px, 1920px

**Mobile (iOS Safari, Android Chrome - real devices):**
- [ ] Long press (500ms) initiates drag
- [ ] Scroll doesn't conflict with drag
- [ ] Cards stack vertically
- [ ] Touch targets ≥44px (WCAG)
- [ ] Checkboxes easy to tap
- [ ] Auto-save works on mobile network

**Tablet (iPad Safari, Android tablet):**
- [ ] 3 groups per row layout
- [ ] Drag-and-drop smooth
- [ ] Responsive at 768px, 1023px

**Edge Cases:**
- [ ] Empty groups show appropriate message
- [ ] No teams in group handled gracefully
- [ ] Network error shows retry button
- [ ] Concurrent editing (2 tabs) syncs correctly
- [ ] Tournament locked state = read-only UI

## Validation Considerations

### SonarCloud Requirements

**Coverage:**
- Target: ≥80% line coverage on ALL new code
- Repository functions: 100% coverage (simple CRUD)
- Server Actions: 100% coverage (auth + validation critical)
- Scoring logic: 100% coverage (business logic)
- Components: ≥80% coverage (focus on logic, not rendering)

**Code Quality:**
- 0 new bugs (critical, high, medium, low)
- 0 new vulnerabilities
- 0 new code smells (or justify if necessary)
- Maintainability rating: A
- Security rating: A
- Duplicated code: <5%

**Common Issues to Avoid:**
- Unused imports (ESLint will catch)
- Console.log statements (remove before commit)
- Any type usage (use proper types)
- Unhandled promise rejections (always catch)
- Missing error handling in Server Actions
- SQL injection risks (Kysely is safe, but verify)

### Pre-Commit Checklist

Before committing ANY changes:
- [ ] Run `npm run test` - ALL tests pass
- [ ] Run `npm run lint` - NO lint errors
- [ ] Run `npm run build` - Build succeeds
- [ ] Verify coverage ≥80% on new code
- [ ] Remove console.log, debugger statements
- [ ] Check for unused imports
- [ ] Verify no TypeScript errors
- [ ] Test on real mobile device

### Pre-Merge Checklist

After committing, before merging PR:
- [ ] CI/CD checks pass (GitHub Actions)
- [ ] SonarCloud analysis: 0 new issues
- [ ] User tested in Vercel Preview
- [ ] Migrations tested (ask user permission first)
- [ ] Accessibility tested (keyboard + screen reader)
- [ ] Performance acceptable (drag-and-drop smooth on low-end devices)

## Dependencies to Add

```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

These are the official dnd-kit packages for drag-and-drop functionality.

## Risk Assessment

**High Risk:**
1. **Drag-and-drop performance on mobile**
   - Mitigation: Use dnd-kit (optimized for mobile), test on real devices early
   - Fallback: Keyboard move buttons always available

2. **Third-place validation logic complexity**
   - Mitigation: Comprehensive unit tests, clear error messages
   - Edge case: Handle tournament config changes (max changes from 8 to 4)

3. **Accessibility for drag-and-drop**
   - Mitigation: Full keyboard support, screen reader announcements, move buttons
   - Test with actual screen reader users if possible

**Medium Risk:**
1. **Concurrent editing conflicts** (multiple tabs)
   - Mitigation: Last write wins (acceptable for this use case)
   - Future: Could add optimistic locking or conflict resolution

2. **Auto-save debounce complexity**
   - Mitigation: Use established debounce pattern, test thoroughly
   - Handle component unmount (flush pending saves)

**Low Risk:**
1. **Database migration** (new table, straightforward)
2. **Repository functions** (follow existing patterns)
3. **MUI component styling** (project already uses MUI v7)

## Open Questions

1. **Tournament locked state:** Should locked predictions show:
   - a) User's final predictions only
   - b) User's predictions + actual results with comparison
   - **Recommendation:** (b) - show comparison like existing group tables do

2. **Default order on first visit:** If user has no predictions yet:
   - a) Alphabetical by team name
   - b) Random order
   - c) Order from actual standings (if available)
   - **Recommendation:** (a) - alphabetical, consistent and predictable

3. **Tab visibility:** Should "CLASIFICADOS" tab:
   - a) Always visible for all tournaments
   - b) Only visible if `allows_third_place_qualification = true`
   - c) Visible if any direct qualifiers exist (most tournaments)
   - **Recommendation:** (c) - visible for tournaments with knockout stages

4. **Scoring display:** Where to show qualification score:
   - a) Combined with existing scores in dashboard
   - b) Separate section on stats page
   - c) Inline on qualified teams page
   - **Recommendation:** (a) + (c) - show in both places for visibility

5. **Migration timing:** ~~When to run migrations~~ **RESOLVED**
   - **Answer:** Run migration in Phase 1, step 3
   - Process: Create migration file → ASK USER PERMISSION → Run if approved
   - Follow implementation.md Section 8 Step 4 guidance
   - NEVER run migrations without explicit user approval

## Success Criteria

**Functional:**
- ✅ Users can drag teams to reorder within groups
- ✅ Users can select up to 8 third place qualifiers
- ✅ Auto-save works with 500ms debounce
- ✅ Predictions lock when tournament locks
- ✅ Scoring calculates correctly (1 pt + 1 pt)
- ✅ Responsive on mobile, tablet, desktop

**Quality:**
- ✅ 80% test coverage on ALL new code
- ✅ 0 new SonarCloud issues (any severity)
- ✅ Passes all lint checks
- ✅ Builds successfully
- ✅ All CI/CD checks pass

**UX:**
- ✅ Drag-and-drop smooth on mobile devices
- ✅ Keyboard navigation works completely
- ✅ Screen reader announces changes correctly
- ✅ Color contrast meets WCAG 4.5:1
- ✅ Touch targets ≥44px on mobile

**Performance:**
- ✅ Page loads in <3 seconds on 3G
- ✅ Drag operations feel instant (<100ms)
- ✅ Auto-save doesn't block UI

## Next Steps After Plan Approval

1. User reviews plan in PR
2. User provides feedback or approves
3. User says "execute the plan"
4. Read `docs/claude/implementation.md` completely
5. Define tasks with TaskCreate
6. Set dependencies with TaskUpdate
7. Start implementation in execution waves
8. Create tests in parallel where possible
9. Run validation checks before ANY commit
10. Deploy to Vercel Preview for user testing
