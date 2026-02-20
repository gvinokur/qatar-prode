# Plan Update: Additional Scroll Containers Found

**Based on PR feedback from user (Comment #1):**
> "I think we also need to change tournament layout as it's using scrolling containers for the sidebar and for the tournament main content, right? Any other that we should look for?"

## Comprehensive Scroll Container Audit

**Audit completed:** All `overflow: auto` instances in the codebase have been identified and categorized.

### User-Facing Containers (Priority for Migration)

1. **Tournament Bracket View** (`playoffs-bracket-view.tsx`)
   - Currently has broken mask implementation (lines 149-154)
   - Needs horizontal + vertical shadows
   - **Priority: CRITICAL** (currently broken)

2. **Tournament Layout - Main Content** (`app/[locale]/tournaments/[id]/layout.tsx`)
   - Line 261: Main content Grid with `overflow: 'auto'`
   - Contains the primary tournament pages (games, results, groups, stats)
   - **Priority: HIGH** (main user navigation area)
   - **Status: NEW - Added from user feedback**

3. **Tournament Sidebar** (`tournament-page/tournament-sidebar.tsx`)
   - Line 68: Sidebar scroll container with hidden scrollbars
   - Contains rules, stats, group standings, friend groups
   - **Priority: HIGH** (main user navigation area)
   - **Status: NEW - Added from user feedback**

4. **Results Page Tabs** (`results-page-client.tsx`)
   - Lines 78, 95: Both tab panels have `overflow: 'auto'`
   - Groups stage and Playoffs tabs
   - **Priority: MEDIUM**

5. **Games List Container** (`unified-games-page-client.tsx`)
   - Vertical scrolling of game cards with hidden scrollbars
   - **Priority: MEDIUM**

### Additional Containers (Lower Priority / Optional)

6. **Popovers** (Good candidates for UX enhancement)
   - `tournament-details-popover.tsx` line 43: `maxHeight: '80vh', overflow: 'auto'`
   - `game-details-popover.tsx` line 58: `maxHeight: '80vh', overflow: 'auto'`
   - **Priority: LOW** (small modals, less critical)

7. **Backoffice Components** (Admin only, lowest priority)
   - `tournament-third-place-rules-tab.tsx` lines 232, 297
   - `internal/group-dialog.tsx` lines 178, 211
   - `tournament-main-data-tab.tsx` line 559
   - **Priority: VERY LOW** (admin-only features)

**Total Identified:** 10 scroll containers (7 user-facing + 3 backoffice)

---

## Updated Migration Strategy

**Core Migrations (Required - 3 minimum for acceptance criteria):**

### Migration #1: Tournament Bracket View (CRITICAL)
- **File:** `app/components/results-page/playoffs-bracket-view.tsx`
- **Action:** Remove broken mask (lines 149-154), wrap with `<ScrollShadowContainer direction="both">`
- **Impact:** Fixes currently broken functionality
- **Testing:** Horizontal + vertical scrolling, z-index conflicts with SVG, light/dark themes

### Migration #2: Tournament Layout Main Content (HIGH IMPACT)
- **File:** `app/[locale]/tournaments/[id]/layout.tsx` line 261
- **Action:** Wrap main content Grid with `<ScrollShadowContainer direction="vertical">`
- **Impact:** All tournament pages get scroll indicators (games, results, stats, groups)
- **Testing:** Test across all tournament pages, responsive behavior, long content
- **Notes:** This is the primary container users interact with

### Migration #3: Tournament Sidebar (HIGH IMPACT)
- **File:** `app/components/tournament-page/tournament-sidebar.tsx` line 68
- **Action:** Wrap sidebar Box with `<ScrollShadowContainer direction="vertical">`
- **Impact:** Sidebar navigation gets scroll indicators
- **Testing:** Expanded rules, multiple friend groups, conditional content
- **Notes:** Keep existing hidden scrollbar styling

**Rationale for New Priority:**
- **User feedback** highlighted tournament layout containers as important
- These containers have **highest user visibility** (main navigation areas)
- **Broader impact** than original plan (affects all tournament pages, not just results)
- Original plan targeted Results Page Tabs + Games List, but tournament layout is more critical

---

## Stretch Goals (If time permits)

### Migration #4: Results Page Tabs
- **Files:** `results-page-client.tsx` lines 78, 95
- **Action:** Wrap both tab panels
- **Impact:** Results/Playoffs tabs get scroll indicators

### Migration #5: Games List Container
- **File:** `unified-games-page-client.tsx`
- **Action:** Wrap scroll container
- **Impact:** Game lists get scroll indicators

### Migration #6: Popovers (Optional)
- **Files:** `tournament-details-popover.tsx`, `game-details-popover.tsx`
- **Action:** Wrap Card elements
- **Impact:** Better UX for scrollable modals

---

## Updated Files to Modify

**Core (Required):**
1. `playoffs-bracket-view.tsx` - Fix broken mask
2. `app/[locale]/tournaments/[id]/layout.tsx` - Main content (NEW)
3. `tournament-page/tournament-sidebar.tsx` - Sidebar (NEW)

**Stretch Goals:**
4. `results-page-client.tsx` - Tab panels
5. `unified-games-page-client.tsx` - Games list

**Backup Options** (if any core migration fails):
- Popovers (#6)
- Any stretch goal (#4, #5)
- Must still achieve 3 successful migrations

---

## Impact Assessment

**Original Plan:**
- 3 containers: Bracket (broken), Results Tabs, Games List
- Impact: Fixes 1 broken feature, enhances 2 specific pages

**Updated Plan (based on user feedback):**
- 3 containers: Bracket (broken), Tournament Main Content, Tournament Sidebar
- Impact: Fixes 1 broken feature, enhances **ALL tournament pages** (games, results, groups, stats, rules, friend groups)
- **Significantly broader user benefit**

---

## Migration Contingency

**If Tournament Layout migration has issues:**
- Layout.tsx is server component, might need client component wrapper
- Children rendering patterns must be preserved
- If blocked, fall back to Results Tabs (#4) or Games List (#5)
- Minimum 3 migrations still achievable with backup options

**Risk mitigation:**
- Test tournament layout migration carefully
- Verify no hydration issues with server/client boundary
- Ensure children prop forwarding works correctly
