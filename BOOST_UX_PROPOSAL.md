# Boost Selection UX Alternatives

## Current Implementation (Below Card)
- ✅ Clear and visible
- ❌ Outside the card feels disconnected
- ❌ Takes extra vertical space
- ❌ Requires scrolling on mobile

---

## **Option A: Inside Edit Dialog** ⭐ RECOMMENDED

### Concept
Add boost selection directly in the `GameResultEditDialog` when users enter their prediction.

### Advantages
- ✅ All prediction data in one place (scores + boost)
- ✅ Clean card UI - no clutter
- ✅ Natural flow: edit prediction → select boost → save
- ✅ Can show boost counts and explanation in dialog
- ✅ Works well on mobile

### Implementation
```tsx
// In GameResultEditDialog
<DialogContent>
  {/* Existing score inputs */}

  <Divider sx={{ my: 2 }} />

  <Box>
    <Typography variant="subtitle2" gutterBottom>
      Apply Boost (Optional)
    </Typography>
    <Typography variant="caption" color="text.secondary">
      Silver: {silverRemaining} left • Golden: {goldenRemaining} left
    </Typography>

    <ToggleButtonGroup exclusive value={boost}>
      <ToggleButton value="silver">
        <StarIcon /> 2x Silver
      </ToggleButton>
      <ToggleButton value="golden">
        <TrophyIcon /> 3x Golden
      </ToggleButton>
      <ToggleButton value={null}>
        None
      </ToggleButton>
    </ToggleButtonGroup>
  </Box>
</DialogContent>
```

### Visual
```
┌─────────────────────────────┐
│ Edit Prediction             │
├─────────────────────────────┤
│ Home: [2] - [1] :Away      │
│                             │
│ ─────────────────────────  │
│                             │
│ Apply Boost (Optional)      │
│ Silver: 3 left • Golden: 1  │
│                             │
│ [⭐ 2x Silver] [🏆 3x Golden] [None] │
│                             │
│         [Cancel] [Save]     │
└─────────────────────────────┘
```

---

## **Option B: Compact Inline Badge**

### Concept
Small clickable boost indicators inside the card near the game number/date.

### Visual
```
┌─────────────────────────────────────┐
│ #12 - Dec 15, 3:00 PM  [⭐] [🏆]   │
│ ─────────────────────────────────── │
│    Argentina  2 - 1  France         │
│ ─────────────────────────────────── │
│           Location: Doha            │
└─────────────────────────────────────┘
```

### Advantages
- ✅ Compact and unobtrusive
- ✅ Always visible on card
- ✅ No extra space needed

### Disadvantages
- ❌ Small icons might be hard to tap on mobile
- ❌ Less discoverable
- ❌ Clutters the header slightly

---

## **Option C: Floating Badge on Card**

### Concept
Floating boost indicator in the top-right corner of the card.

### Visual
```
┌─────────────────────────────────────┐
│ #12 - Dec 15, 3:00 PM          [3x]│ ← Floating badge
│ ─────────────────────────────────── │
│    Argentina  2 - 1  France         │
│ ─────────────────────────────────── │
│           Location: Doha            │
└─────────────────────────────────────┘
```

### Advantages
- ✅ Clean visual hierarchy
- ✅ Doesn't interfere with content
- ✅ Badge can be clickable to change boost

### Disadvantages
- ❌ Less discoverable for first-time users
- ❌ Small click target
- ❌ Harder to show boost counts

---

## **Option D: Icon-Only Inline (Current, Improved)**

### Concept
Keep current icon buttons but move them inside the card footer.

### Visual
```
┌─────────────────────────────────────┐
│ #12 - Dec 15, 3:00 PM              │
│ ─────────────────────────────────── │
│    Argentina  2 - 1  France         │
│ ─────────────────────────────────── │
│ Location: Doha          [⭐] [🏆]   │ ← Inside card
└─────────────────────────────────────┘
```

### Advantages
- ✅ Keeps boost controls with the card
- ✅ Minimal refactoring needed
- ✅ Icon buttons already work well

### Disadvantages
- ❌ Still somewhat cluttered
- ❌ Less contextual than in edit dialog

---

## Recommendation: **Option A (In Edit Dialog)**

### Why?
1. **Best UX**: Users enter scores and select boost in one action
2. **Clean UI**: Cards remain uncluttered
3. **Discoverability**: Boost option is presented when users are already editing
4. **Mobile-friendly**: Plenty of space in dialog for clear UI
5. **Contextual**: Shows remaining boosts when user needs to decide

### Implementation Steps
1. Add boost state to `GameResultEditDialog`
2. Add boost UI section after score inputs
3. Update save handler to persist boost alongside scores
4. Remove standalone `GameBoostSelector` from card
5. Keep visual indicators (border/badge) on card to show active boosts

### Migration Path
- Phase 1: Add boost selection to dialog (this doesn't break anything)
- Phase 2: Test with users
- Phase 3: Remove standalone boost selector if dialog approach works well
- Fallback: Keep both options if users prefer inline controls
