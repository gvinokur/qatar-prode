# Component Styling Guidelines

This guide ensures consistent theme color usage across the application. Follow these guidelines when creating or modifying components to maintain visual consistency and brand identity.

**Created:** 2026-03-03 (Story #243)
**Last Updated:** 2026-03-03

---

## Table of Contents

1. [Decision Matrix: When to Use Each Color](#decision-matrix-when-to-use-each-color)
2. [Button Color Guidelines](#button-color-guidelines)
3. [IconButton Color Guidelines](#iconbutton-color-guidelines)
4. [CardHeader Theming Guidelines](#cardheader-theming-guidelines)
5. [When NOT to Use Theme Colors](#when-not-to-use-theme-colors)
6. [Testing Color Changes](#testing-color-changes)
7. [Examples](#examples)

---

## Decision Matrix: When to Use Each Color

| Element Type | Primary Color | Secondary Color | Inherit/Default |
|-------------|---------------|-----------------|-----------------|
| Submit/Save buttons | ✅ | | |
| Primary CTAs | ✅ | | |
| Cancel buttons | | ✅ | |
| Delete buttons | | ✅ | |
| Close buttons | | ✅ | |
| Navigation actions | ✅ | | |
| Edit actions | ✅ | | |
| Alternative actions | | ✅ | |
| Toggle buttons | ✅ | | |
| Disabled buttons | ✅/✅ * | | |
| Modal/Dialog actions | ✅/✅ * | | |
| Informational elements | | | ✅ |

**Notes:**
- \* Color prop still applies in disabled state (MUI handles visual styling)
- \* Modal/Dialog buttons follow same rules as page-level buttons
- **When in doubt:** Use primary for main action, secondary for alternative action
- IconButtons in toolbars/nav: primary color
- IconButtons for destructive actions (delete): secondary color
- IconButtons for informational (info, help): inherit/default

---

## Button Color Guidelines

### Primary Buttons

Use `color="primary"` for **main actions** and **primary CTAs**:

```tsx
// Submit/Save actions
<Button variant="contained" color="primary" type="submit">
  Submit
</Button>

// Create/Add actions
<Button variant="contained" color="primary" onClick={handleCreate}>
  Create Group
</Button>

// Navigation to important pages
<Button
  component={Link}
  href="/tournaments/1"
  variant="contained"
  color="primary"
>
  View Tournament
</Button>
```

**Use cases:**
- Form submissions (Submit, Save, Create, Update)
- Primary calls-to-action (Get Started, Learn More, Sign Up)
- Navigation to key features
- Confirm actions in dialogs
- Toggle/switch to active state

### Secondary Buttons

Use `color="secondary"` for **alternative actions** and **destructive operations**:

```tsx
// Cancel actions
<Button variant="outlined" color="secondary" onClick={handleCancel}>
  Cancel
</Button>

// Delete actions
<Button variant="contained" color="secondary" onClick={handleDelete}>
  Delete Group
</Button>

// Close dialogs
<Button color="secondary" onClick={handleClose}>
  Close
</Button>

// Alternative paths
<Button variant="outlined" color="secondary" onClick={handleSkip}>
  Skip for Now
</Button>
```

**Use cases:**
- Cancel/Close buttons
- Delete/Remove actions
- Destructive operations (requires confirmation)
- Alternative/optional paths
- Secondary CTAs

### Default/Inherit Buttons

Use **no color prop** or `color="inherit"` for **informational elements**:

```tsx
// Informational actions (rare)
<Button onClick={handleInfo}>
  Learn More
</Button>

// Tertiary actions in button groups
<Button variant="text" onClick={handleHelp}>
  Help
</Button>
```

**Use cases:**
- Very rare - most buttons should have explicit colors
- Informational links that aren't primary actions
- Tertiary actions in complex UIs

---

## IconButton Color Guidelines

### Primary IconButtons

Use `color="primary"` for **navigation and edit actions**:

```tsx
// Edit actions
<IconButton color="primary" onClick={handleEdit}>
  <EditIcon />
</IconButton>

// Share actions
<IconButton color="primary" onClick={handleShare}>
  <ShareIcon />
</IconButton>

// Navigation
<IconButton color="primary" onClick={handleNavigate}>
  <ArrowForwardIcon />
</IconButton>

// Expand/collapse (when it's a primary action)
<IconButton color="primary" onClick={handleExpand}>
  <ExpandMoreIcon />
</IconButton>
```

**Use cases:**
- Edit/modify actions
- Share/invite actions
- Important navigation
- Primary interactive elements

### Secondary IconButtons

Use `color="secondary"` for **destructive actions**:

```tsx
// Delete actions
<IconButton color="secondary" onClick={handleDelete}>
  <DeleteIcon />
</IconButton>

// Remove/close actions
<IconButton color="secondary" onClick={handleRemove}>
  <CloseIcon />
</IconButton>
```

**Use cases:**
- Delete/remove actions
- Close buttons that discard changes
- Other destructive operations

### Default/Inherit IconButtons

Use **no color prop** for **decorative or informational icons**:

```tsx
// Expand/collapse decorative
<IconButton onClick={handleExpand}>
  <ExpandMoreIcon />
</IconButton>

// Info/help icons
<IconButton onClick={handleInfo}>
  <InfoIcon />
</IconButton>

// Visibility toggles
<IconButton onClick={handleToggleVisibility}>
  {showPassword ? <VisibilityOff /> : <Visibility />}
</IconButton>

// Tournament/menu switchers
<IconButton onClick={handleSwitch}>
  <SwapHorizIcon />
</IconButton>
```

**Use cases:**
- Decorative expand/collapse icons
- Info/help icons
- Visibility toggles (show/hide password)
- Switchers and pickers
- Non-critical interactive elements

---

## CardHeader Theming Guidelines

### Standard Pattern

Apply theme colors to CardHeader components for visual hierarchy:

```tsx
import { Card, CardHeader, CardContent, useTheme } from '@mui/material';

function MyCard() {
  const theme = useTheme();

  return (
    <Card>
      <CardHeader
        title="Card Title"
        sx={{
          color: theme.palette.primary.main,
          borderBottom: `${theme.palette.primary.light} solid 1px`
        }}
      />
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
}
```

### With Subheader

```tsx
<CardHeader
  title="Main Title"
  subheader="Subtitle or description"
  sx={{
    color: theme.palette.primary.main,
    borderBottom: `${theme.palette.primary.light} solid 1px`
  }}
/>
```

### With Avatar/Action

```tsx
<CardHeader
  title="Card with Icon"
  avatar={<PersonIcon />}
  action={<IconButton color="primary"><MoreVertIcon /></IconButton>}
  sx={{
    color: theme.palette.primary.main,
    borderBottom: `${theme.palette.primary.light} solid 1px`
  }}
/>
```

### When to Skip CardHeader Theming

Some cards use custom layouts and don't need CardHeader theming:

- Game cards (flippable, urgency, compact) - custom layouts
- Result/bracket cards - specialized designs
- User avatars/profile cards - semantic coloring

---

## When NOT to Use Theme Colors

### Award Badges and Medals

Award badges have **specific semantic colors** that should not use theme colors:

```tsx
// CORRECT: Use specific colors for medals
<Chip
  label="1st Place"
  sx={{ bgcolor: 'gold', color: 'black' }}
/>
<Chip
  label="2nd Place"
  sx={{ bgcolor: 'silver', color: 'black' }}
/>
<Chip
  label="3rd Place"
  sx={{ bgcolor: '#CD7F32', color: 'white' }}  // Bronze
/>
```

### Status Indicators

Status indicators have **semantic meaning** - keep their standard colors:

```tsx
// CORRECT: Use semantic colors for status
<Chip label="Success" color="success" />
<Chip label="Error" color="error" />
<Chip label="Warning" color="warning" />
<Chip label="Info" color="info" />
```

### User Identification

User avatars/badges need **consistent colors** based on user ID for recognition:

```tsx
// CORRECT: Generate consistent colors for user identification
function getAvatarColor(userId: string): string {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', /* ... */];
  const hash = userId.split('').reduce((acc, char) =>
    acc + (char.codePointAt(0) || 0), 0
  );
  return colors[hash % colors.length];
}

<Avatar sx={{ bgcolor: getAvatarColor(user.id) }}>
  {user.initials}
</Avatar>
```

### Brand-Specific Elements

Elements that must maintain **exact brand colors** for recognition:

```tsx
// Team logos, sponsor badges, external brand elements
// Keep their specific colors - don't theme them
```

---

## Testing Color Changes

### 1. Visual Testing

**Always test in both light and dark modes:**

```tsx
// Toggle between light/dark in the UI
// Verify colors look good in both modes
```

### 2. Accessibility Verification

**Check WCAG AA contrast ratios** (≥4.5:1 for text, ≥3:1 for UI components):

- Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Browser dev tools → Accessibility panel
- Ensure all text remains readable

### 3. Snapshot Tests

**Update and review snapshot tests carefully:**

```bash
# Run tests first
npm test

# Update snapshots if only color props changed
npm test -- -u

# Review snapshot changes
git diff __tests__/**/*.snap
```

**What to verify in snapshots:**
- ✅ Only `color="primary"` or `color="secondary"` prop added
- ✅ No other prop changes
- ✅ No structural changes to component tree
- ❌ If more than color props changed → investigate why

### 4. Manual Testing Checklist

Before committing color changes:

- [ ] Buttons display correct theme colors (not gray)
- [ ] IconButtons have appropriate colors for their actions
- [ ] CardHeaders use primary color for titles and borders
- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] All text is readable (contrast check)
- [ ] Visual hierarchy is improved
- [ ] No functional regressions

---

## Examples

### Complete Form Example

```tsx
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

function CreateGroupDialog({ open, onClose }) {
  const handleSubmit = () => { /* ... */ };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create New Group</DialogTitle>
      <DialogContent>
        <TextField
          label="Group Name"
          fullWidth
          variant="standard"
        />
      </DialogContent>
      <DialogActions>
        {/* Secondary for cancel */}
        <Button color="secondary" onClick={onClose}>
          Cancel
        </Button>
        {/* Primary for submit */}
        <Button color="primary" variant="contained" onClick={handleSubmit}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### Complete Card Example

```tsx
import { Card, CardHeader, CardContent, CardActions, Button, IconButton, useTheme } from '@mui/material';
import { Share as ShareIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

function GroupCard({ group, onEdit, onDelete, onShare }) {
  const theme = useTheme();

  return (
    <Card>
      <CardHeader
        title={group.name}
        subheader={`${group.memberCount} members`}
        sx={{
          color: theme.palette.primary.main,
          borderBottom: `${theme.palette.primary.light} solid 1px`
        }}
        action={
          <>
            {/* Primary for share action */}
            <IconButton color="primary" onClick={onShare}>
              <ShareIcon />
            </IconButton>
            {/* Primary for edit action */}
            <IconButton color="primary" onClick={onEdit}>
              <EditIcon />
            </IconButton>
            {/* Secondary for delete action */}
            <IconButton color="secondary" onClick={onDelete}>
              <DeleteIcon />
            </IconButton>
          </>
        }
      />
      <CardContent>
        {/* Card content */}
      </CardContent>
      <CardActions>
        {/* Primary for main navigation */}
        <Button color="primary" variant="contained" fullWidth>
          View Leaderboard
        </Button>
      </CardActions>
    </Card>
  );
}
```

### Button List Example

```tsx
import { Stack, Button } from '@mui/material';

function ActionButtons({ onSave, onCancel, onDelete }) {
  return (
    <Stack direction="row" spacing={2}>
      {/* Primary for save */}
      <Button variant="contained" color="primary" onClick={onSave}>
        Save Changes
      </Button>
      {/* Secondary for cancel */}
      <Button variant="outlined" color="secondary" onClick={onCancel}>
        Cancel
      </Button>
      {/* Secondary for delete (destructive) */}
      <Button variant="contained" color="secondary" onClick={onDelete}>
        Delete
      </Button>
    </Stack>
  );
}
```

---

## Summary

**Quick Reference:**

- 🟣 **Primary (Violet):** Main actions, navigation, edit, share, CTAs
- 🔴 **Secondary (Coral):** Cancel, delete, close, alternative actions
- ⚪ **Inherit/Default:** Informational, decorative, visibility toggles

**Remember:**
1. Most buttons should have explicit `color` props
2. IconButtons for actions should use `color="primary"` or `color="secondary"`
3. Decorative IconButtons can remain default
4. CardHeaders should use theme styling pattern
5. Don't theme semantic colors (awards, status, user IDs)
6. Always test in both light and dark modes
7. Verify accessibility (contrast ratios)

---

**For more information:**
- Theme configuration: `app/components/context-providers/theme-provider.tsx`
- MUI Theme documentation: https://mui.com/material-ui/customization/theming/
- WCAG Contrast checker: https://webaim.org/resources/contrastchecker/
