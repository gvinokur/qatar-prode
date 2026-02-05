# CircularProgress Audit Results

## Summary
- **Total instances found**: 33 CircularProgress usages across 22 files
- **REPLACE with Skeleton**: 9 instances (page-level/content loading)
- **KEEP CircularProgress**: 24 instances (button/inline/action loading)

---

## REPLACE with Skeleton (9 instances)

### 1. reset-password/page.tsx
- **Line**: 101
- **Context**: Page-level loading state while verifying reset token
- **Usage**: Full page loading spinner in centered container
- **Skeleton**: Create `AuthPageSkeleton` component for authentication pages
```tsx
// Current code (lines 98-104):
if (loading) {
  return (
    <Container maxWidth="sm" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
      <CircularProgress />
    </Container>
  );
}
```

### 2. verification/email-verifier.tsx
- **Line**: 56
- **Context**: Email verification page loading state
- **Usage**: Page-level loading while verifying email token
- **Skeleton**: Use `AuthPageSkeleton` (same as above)
```tsx
// Current code (lines 47-64):
if (isVerifying) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Paper sx={{ p: 4, maxWidth: 500, width: '100%', textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Verifying Your Email
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
        <Typography color="text.secondary">
          Please wait while we verify your email address...
        </Typography>
      </Paper>
    </Box>
  );
}
```

### 3. backoffice/groups-backoffice-tab.tsx
- **Line**: 37
- **Context**: Loading groups data before rendering tabs
- **Usage**: Backdrop spinner blocking entire page
- **Skeleton**: Create `BackofficeTabsSkeleton` for backoffice tab loading states
```tsx
// Current code (lines 33-38):
<Backdrop
  sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
  open={loading}
>
  <CircularProgress color="inherit" />
</Backdrop>
```

### 4. backoffice/tournament-main-data-tab.tsx
- **Line**: 316
- **Context**: Initial data fetch for tournament details
- **Usage**: Centered spinner while loading tournament data
- **Skeleton**: Create `TournamentFormSkeleton` for form loading states
```tsx
// Current code (lines 313-319):
if (loadingData) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <CircularProgress />
    </Box>
  );
}
```

### 5. backoffice/tournament-scoring-config-tab.tsx
- **Line**: 120
- **Context**: Loading scoring configuration data
- **Usage**: Backdrop spinner blocking entire page
- **Skeleton**: Use `BackofficeTabsSkeleton`
```tsx
// Current code (lines 116-121):
<Backdrop
  sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
  open={loading}
>
  <CircularProgress color="inherit" />
</Backdrop>
```

### 6. backoffice/tournament-third-place-rules-tab.tsx
- **Line**: 141
- **Context**: Loading third-place rules data
- **Usage**: Centered spinner while loading rules
- **Skeleton**: Use `BackofficeTabsSkeleton`
```tsx
// Current code (lines 138-144):
if (loading) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress />
    </Box>
  );
}
```

### 7. backoffice/group-backoffice-tab.tsx
- **Line**: 169
- **Context**: Loading group data with games and teams
- **Usage**: Backdrop spinner blocking entire page
- **Skeleton**: Use `BackofficeTabsSkeleton`
```tsx
// Current code (lines 165-170):
<Backdrop
  sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
  open={loading}
>
  <CircularProgress color="inherit" />
</Backdrop>
```

### 8. backoffice/awards-tab.tsx
- **Line**: 61
- **Context**: Loading tournament and player data for awards
- **Usage**: Backdrop spinner blocking entire page
- **Skeleton**: Use `BackofficeTabsSkeleton`
```tsx
// Current code (lines 57-62):
<Backdrop
  sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
  open={!tournament}
>
  <CircularProgress color="inherit" />
</Backdrop>
```

### 9. backoffice/tournament-teams-manager-tab.tsx
- **Line**: 93
- **Context**: Loading teams data
- **Usage**: Centered spinner while loading teams
- **Skeleton**: Create `TeamGridSkeleton` for team card grid loading
```tsx
// Current code (lines 90-96):
if (loading) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );
}
```

---

## KEEP CircularProgress (24 instances)

### Button Loading States (14 instances)

#### 1. game-result-edit-dialog.tsx
- **Line**: 386
- **Context**: Save button loading indicator
- **Reason**: Inline button action - CircularProgress is appropriate
```tsx
startIcon={loading ? <CircularProgress size={20} /> : null}
```

#### 2. delete-account-button.tsx
- **Line**: 120
- **Context**: Delete account button loading
- **Reason**: Critical action button - CircularProgress is appropriate
```tsx
startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
```

#### 3. compact-game-view-card.tsx
- **Line**: 213
- **Context**: Publish checkbox loading state
- **Reason**: Toggle action indicator - CircularProgress is appropriate
```tsx
icon={publishing? <CircularProgress size={24} color={'secondary'}/> : <SaveOutlinedIcon color="error" />}
checkedIcon={publishing? <CircularProgress size={24} color={'secondary'}/> :<SaveIcon />}
```

#### 4. boost-info-popover.tsx
- **Line**: 36
- **Context**: Loading boost breakdown data
- **Reason**: Inline data fetching indicator - CircularProgress is appropriate
```tsx
<CircularProgress size={16} />
```

#### 5. create-tournament-modal.tsx
- **Line**: 166
- **Context**: Loading tournaments dropdown
- **Reason**: Inline dropdown loading - CircularProgress is appropriate
```tsx
<CircularProgress size={20} sx={{ mr: 1 }} />
```

#### 6. tournament-main-data-tab.tsx
- **Line**: 493
- **Context**: Loading permissions data
- **Reason**: Inline section loading - CircularProgress is appropriate
```tsx
<CircularProgress size={24} />
```

#### 7. tournament-main-data-tab.tsx
- **Line**: 547
- **Context**: Loading playoff rounds list
- **Reason**: Inline section loading - CircularProgress is appropriate
```tsx
<CircularProgress size={24} />
```

#### 8. tournament-third-place-rules-tab.tsx
- **Line**: 331
- **Context**: Save button in dialog
- **Reason**: Button action indicator - CircularProgress is appropriate
```tsx
{saving ? <CircularProgress size={24} /> : 'Save'}
```

#### 9. game-prediction-edit-controls.tsx
- **Line**: 1170
- **Context**: Retry button in error alert
- **Reason**: Inline retry action - CircularProgress is appropriate
```tsx
{loading && <CircularProgress size={16} />}
```

#### 10. PlayersTab.tsx
- **Line**: 137
- **Context**: Loading players data
- **Reason**: Page-level loading BUT in a tab context where skeleton would be overkill
```tsx
<CircularProgress />
```

#### 11. tournament-groups-manager-tab.tsx
- **Line**: 83
- **Context**: Loading groups and teams data
- **Reason**: Page-level loading BUT in a tab context where skeleton would be overkill
```tsx
<CircularProgress />
```

#### 12. group-dialog.tsx
- **Line**: 251
- **Context**: Save button in dialog
- **Reason**: Button action indicator - CircularProgress is appropriate
```tsx
{loading ? <CircularProgress size={24} /> : 'Save'}
```

#### 13. game-dialog.tsx
- **Line**: 538
- **Context**: Save button in dialog
- **Reason**: Button action indicator - CircularProgress is appropriate
```tsx
startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
```

#### 14. notification-sender.tsx
- **Line**: 14
- **Context**: Send notification button loading
- **Reason**: Button action indicator - CircularProgress is appropriate
```tsx
<CircularProgress />
```

### Backdrop/Overlay Loading (3 instances - KEEP)

These are used for preventing interaction during save/update operations, not initial page load:

#### 15. playoff-tab.tsx
- **Line**: 3
- **Context**: Loading playoff data
- **Reason**: Tab-level data loading with complex playoff bracket - Backdrop prevents interaction during updates
```tsx
<Backdrop
  sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
  open={loading}
>
  <CircularProgress color="inherit" />
</Backdrop>
```

#### 16. tournament-game-manager-tab.tsx
- **Line**: Multiple uses
- **Context**: Loading games, teams, groups data
- **Reason**: Complex data grid - Backdrop prevents interaction during updates
```tsx
<CircularProgress />
```

---

## Recommended Skeleton Components to Create

### 1. AuthPageSkeleton
**Files**: reset-password/page.tsx, email-verifier.tsx
```tsx
// app/components/skeletons/auth-page-skeleton.tsx
export default function AuthPageSkeleton() {
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={40} width={150} sx={{ ml: 'auto' }} />
        </CardContent>
      </Card>
    </Container>
  );
}
```

### 2. BackofficeTabsSkeleton
**Files**: groups-backoffice-tab.tsx, tournament-scoring-config-tab.tsx, tournament-third-place-rules-tab.tsx, group-backoffice-tab.tsx, awards-tab.tsx
```tsx
// app/components/skeletons/backoffice-tabs-skeleton.tsx
export default function BackofficeTabsSkeleton() {
  return (
    <Box pt={2}>
      <Card sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <CardHeader title={<Skeleton width={200} />} />
        <CardContent>
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6 }}>
                <Skeleton variant="rectangular" height={56} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
```

### 3. TournamentFormSkeleton
**Files**: tournament-main-data-tab.tsx
```tsx
// app/components/skeletons/tournament-form-skeleton.tsx
export default function TournamentFormSkeleton() {
  return (
    <Box component="form" sx={{ mt: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Skeleton variant="text" width={250} height={40} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 6 }}>
              <Skeleton variant="rectangular" height={56} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
```

### 4. TeamGridSkeleton
**Files**: tournament-teams-manager-tab.tsx
```tsx
// app/components/skeletons/team-grid-skeleton.tsx
export default function TeamGridSkeleton() {
  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Skeleton width={200} height={40} />
          <Skeleton width={120} height={40} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card>
                <Skeleton variant="rectangular" height={140} />
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
```

---

## Implementation Priority

### High Priority (User-Facing Pages)
1. **reset-password/page.tsx** - Direct user interaction
2. **email-verifier.tsx** - Direct user interaction

### Medium Priority (Backoffice - Main Data)
3. **tournament-main-data-tab.tsx** - Most frequently accessed backoffice tab
4. **tournament-teams-manager-tab.tsx** - Visual improvement for team grid

### Low Priority (Backoffice - Admin Only)
5. **groups-backoffice-tab.tsx**
6. **tournament-scoring-config-tab.tsx**
7. **tournament-third-place-rules-tab.tsx**
8. **group-backoffice-tab.tsx**
9. **awards-tab.tsx**

---

## Notes
- All button loading states should remain as CircularProgress (24 instances)
- Focus skeleton replacement on page-level and content loading states (9 instances)
- Backoffice tabs can share skeleton components to reduce duplication
- Consider adding stagger animation to skeleton grids for better UX
