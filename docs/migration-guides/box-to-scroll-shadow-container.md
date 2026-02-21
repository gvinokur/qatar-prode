# Migration Guide: Box to ScrollShadowContainer

This guide explains how to migrate existing `Box` components with `overflow: 'auto'` to use the new `ScrollShadowContainer` component for better UX with scroll indicators.

## When to Use ScrollShadowContainer

✅ **Use ScrollShadowContainer when:**
- Content may overflow the container (variable-length lists, long text)
- Users need visual feedback about scrollability
- You want to hide scrollbars but still indicate scrollable content
- The container has a defined height/width (see Parent Requirements below)

❌ **Don't use ScrollShadowContainer when:**
- Content never overflows (always fits in container)
- Native scrollbars are preferred for the use case
- Parent container doesn't have defined dimensions
- Shadows would visually clash with the design

## Parent Container Requirements

⚠️ **CRITICAL:** The parent container (or the ScrollShadowContainer itself) **MUST** have a defined height for vertical scrolling or width for horizontal scrolling.

### Valid Approaches:

```tsx
// ✅ Option 1: Pass height directly to ScrollShadowContainer
<ScrollShadowContainer height="400px">
  {content}
</ScrollShadowContainer>

// ✅ Option 2: Pass height via sx prop
<ScrollShadowContainer sx={{ height: '100%' }}>
  {content}
</ScrollShadowContainer>

// ✅ Option 3: Parent has defined height, ScrollShadowContainer fills it
<Box sx={{ height: '400px' }}>
  <ScrollShadowContainer sx={{ height: '100%' }}>
    {content}
  </ScrollShadowContainer>
</Box>
```

### Invalid Approaches:

```tsx
// ❌ No height defined - shadows won't work
<ScrollShadowContainer>
  {content}
</ScrollShadowContainer>

// ❌ Parent has no height, percentage doesn't work
<Box>
  <ScrollShadowContainer sx={{ height: '100%' }}>
    {content}
  </ScrollShadowContainer>
</Box>
```

## Migration Patterns

### Pattern 1: Simple Box with Overflow

**Before:**
```tsx
<Box sx={{ overflow: 'auto', height: '100%' }}>
  {content}
</Box>
```

**After:**
```tsx
<ScrollShadowContainer direction="vertical" height="100%">
  {content}
</ScrollShadowContainer>
```

**Notes:**
- `overflow: 'auto'` is applied automatically by ScrollShadowContainer
- `direction="vertical"` is the default, can be omitted
- Height is passed directly as a prop (cleaner than sx)

---

### Pattern 2: Box with Hidden Scrollbar

**Before:**
```tsx
<Box
  sx={{
    overflow: 'auto',
    height: '100%',
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE/Edge
    '&::-webkit-scrollbar': {
      display: 'none', // Chrome/Safari
    },
  }}
>
  {content}
</Box>
```

**After:**
```tsx
<ScrollShadowContainer
  direction="vertical"
  height="100%"
  hideScrollbar={true}
>
  {content}
</ScrollShadowContainer>
```

**Notes:**
- `hideScrollbar={true}` handles all browser-specific scrollbar hiding
- Much cleaner code - scrollbar CSS is encapsulated in the component
- Shadows now provide the scroll indicator instead of scrollbars

---

### Pattern 3: Box with Additional Styles

**Before:**
```tsx
<Box
  sx={{
    overflow: 'auto',
    height: '100%',
    padding: 2,
    backgroundColor: 'background.paper',
  }}
>
  {content}
</Box>
```

**After:**
```tsx
<ScrollShadowContainer
  height="100%"
  sx={{
    padding: 2,
    backgroundColor: 'background.paper',
  }}
>
  {content}
</ScrollShadowContainer>
```

**Notes:**
- Additional styles go in the `sx` prop as usual
- `overflow` is handled internally, don't include it in sx
- `height` can be in sx or as a dedicated prop (dedicated prop takes precedence)

---

### Pattern 4: Horizontal Scrolling

**Before:**
```tsx
<Box sx={{ overflow: 'auto', overflowY: 'hidden', width: '100%' }}>
  <Stack direction="row" spacing={2}>
    {items}
  </Stack>
</Box>
```

**After:**
```tsx
<ScrollShadowContainer direction="horizontal" width="100%">
  <Stack direction="row" spacing={2}>
    {items}
  </Stack>
</ScrollShadowContainer>
```

**Notes:**
- Use `direction="horizontal"` for left/right shadows
- Width is required for horizontal scrolling (like height for vertical)
- No need for `overflowY: 'hidden'` - component handles it

---

### Pattern 5: Bidirectional Scrolling

**Before:**
```tsx
<Box sx={{ overflow: 'auto', height: '400px', width: '600px' }}>
  {largeContent}
</Box>
```

**After:**
```tsx
<ScrollShadowContainer
  direction="both"
  height="400px"
  width="600px"
>
  {largeContent}
</ScrollShadowContainer>
```

**Notes:**
- Use `direction="both"` for content that scrolls in both directions
- Both height and width must be defined
- Shadows appear on all 4 sides as needed (top, bottom, left, right)

---

### Pattern 6: Nested in Flex Layout

**Before:**
```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
  <Header />
  <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
    {content}
  </Box>
</Box>
```

**After:**
```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
  <Header />
  <ScrollShadowContainer sx={{ flex: 1, minHeight: 0 }}>
    {content}
  </ScrollShadowContainer>
</Box>
```

**Notes:**
- `minHeight: 0` is important for flex children to enable scrolling
- `flex: 1` makes the container fill available space
- No explicit height needed - flex handles sizing

---

## Props Mapping

| Box Prop | ScrollShadowContainer Prop | Notes |
|----------|---------------------------|-------|
| `overflow: 'auto'` | *(automatic)* | Applied internally, don't specify |
| `height` (in sx) | `height` (dedicated prop) | Dedicated prop is cleaner and takes precedence |
| `width` (in sx) | `width` (dedicated prop) | Dedicated prop is cleaner and takes precedence |
| `scrollbarWidth: 'none'` | `hideScrollbar={true}` | Encapsulates all browser-specific CSS |
| `sx={{ ... }}` | `sx={{ ... }}` | Works the same, but don't include overflow |
| *(none)* | `direction="vertical"` | New prop - specify scroll direction |
| *(none)* | `shadowSize={40}` | New prop - customize shadow size (optional) |
| *(none)* | `shadowColor="#000"` | New prop - customize shadow color (optional) |

## Common Pitfalls

### ❌ Pitfall 1: No Defined Height

```tsx
// ❌ WRONG - No height, shadows won't work
<ScrollShadowContainer>
  {content}
</ScrollShadowContainer>
```

**Fix:**
```tsx
// ✅ CORRECT - Height defined
<ScrollShadowContainer height="400px">
  {content}
</ScrollShadowContainer>
```

---

### ❌ Pitfall 2: Including overflow in sx

```tsx
// ❌ WRONG - overflow is redundant (component handles it)
<ScrollShadowContainer sx={{ overflow: 'auto', height: '100%' }}>
  {content}
</ScrollShadowContainer>
```

**Fix:**
```tsx
// ✅ CORRECT - Let component handle overflow
<ScrollShadowContainer height="100%">
  {content}
</ScrollShadowContainer>
```

---

### ❌ Pitfall 3: Conflicting height/width

```tsx
// ⚠️ CONFUSING - height in both places (dedicated prop wins)
<ScrollShadowContainer height="400px" sx={{ height: '500px' }}>
  {content}
</ScrollShadowContainer>
```

**Fix:**
```tsx
// ✅ CORRECT - Use one or the other, not both
<ScrollShadowContainer height="400px">
  {content}
</ScrollShadowContainer>

// OR

<ScrollShadowContainer sx={{ height: '400px' }}>
  {content}
</ScrollShadowContainer>
```

**Note:** If you do provide both, the dedicated prop takes precedence. But it's clearer to use only one approach.

---

### ❌ Pitfall 4: Wrong direction

```tsx
// ❌ WRONG - Using vertical direction for horizontal scroll
<ScrollShadowContainer direction="vertical" width="100%">
  <Stack direction="row">{items}</Stack>
</ScrollShadowContainer>
```

**Fix:**
```tsx
// ✅ CORRECT - Use horizontal direction for horizontal scroll
<ScrollShadowContainer direction="horizontal" width="100%">
  <Stack direction="row">{items}</Stack>
</ScrollShadowContainer>
```

---

## Testing the Migration

After migrating a component, verify the shadows work correctly:

### Visual Testing Checklist

1. **No Overflow:**
   - Resize window to make content fit without scrolling
   - ✅ No shadows should appear

2. **Vertical Scroll - Top:**
   - Scroll to the very top
   - ✅ No shadow at top
   - ✅ Shadow appears at bottom (if content continues below)

3. **Vertical Scroll - Middle:**
   - Scroll to middle of content
   - ✅ Shadow appears at top (content above)
   - ✅ Shadow appears at bottom (content below)

4. **Vertical Scroll - Bottom:**
   - Scroll to the very bottom
   - ✅ Shadow appears at top (content above)
   - ✅ No shadow at bottom

5. **Theme Switching:**
   - Toggle between light and dark mode
   - ✅ Shadow color adapts to theme (darker in dark mode)

6. **Window Resize:**
   - Resize window to change content overflow
   - ✅ Shadows appear/disappear correctly as overflow changes

7. **Accessibility:**
   - Use keyboard (Tab, Arrow keys) to navigate
   - ✅ Keyboard navigation works normally
   - ✅ Use screen reader
   - ✅ Screen reader doesn't announce shadows (they're decorative)

### Performance Testing

- Scroll rapidly up and down
- ✅ Shadows respond immediately (no lag)
- ✅ No jank or stuttering
- ✅ Smooth shadow transitions

## Example Migration: TournamentSidebar

**Before:**
```tsx
<Grid item xs={12} md={4} sx={{ overflow: 'hidden', height: '100%' }}>
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: 2,
      flexGrow: 1,
      overflow: 'auto',
      minHeight: 0,
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    }}
  >
    <RulesAccordion />
    {session && <UserTournamentStats />}
    <GroupStandingsSidebar />
    {friendGroups && <FriendGroupsList />}
  </Box>
</Grid>
```

**After:**
```tsx
<Grid item xs={12} md={4} sx={{ overflow: 'hidden', height: '100%' }}>
  <ScrollShadowContainer
    direction="vertical"
    hideScrollbar={true}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      flexGrow: 1,
      minHeight: 0,
    }}
  >
    <RulesAccordion />
    {session && <UserTournamentStats />}
    <GroupStandingsSidebar />
    {friendGroups && <FriendGroupsList />}
  </ScrollShadowContainer>
</Grid>
```

**Changes:**
- Removed all scrollbar-hiding CSS (handled by `hideScrollbar={true}`)
- Removed `overflow: 'auto'` (handled internally)
- Removed explicit `height: '100%'` from inner Box (inherits from parent Grid)
- Cleaner, more maintainable code
- Now has scroll shadow indicators for better UX

## Need Help?

If you encounter issues during migration:

1. **Check parent container has defined height/width**
2. **Verify you're not including `overflow` in sx prop**
3. **Confirm `direction` prop matches scroll direction**
4. **Test with different content amounts** (empty, few items, many items)

For complex layouts, refer to the visual prototypes in `plans/STORY-187-plan.md`.
