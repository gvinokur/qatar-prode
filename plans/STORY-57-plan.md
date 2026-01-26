# Plan: Fix Bonus Points Display in Friends-Groups Position Tables (#57)

## Story Context
- **Issue**: #57 - Bug: Bonus points not displayed/added in Position Tables on friends-groups page
- **Project**: UX Audit 2026 (Project #1)
- **Type**: Bug Fix
- **Branch**: feature/story-57
- **Worktree**: `/Users/gvinokur/Personal/qatar-prode-story-57`

## Objective
Fix the bug where bonus points from boosted game predictions are not displayed in the Position Tables on the friends-groups page. Users currently cannot see their bonus points in the standings, affecting the accuracy and transparency of the leaderboard.

## Root Cause Analysis

**Data Flow (Current - Broken):**
```
Database (game_guesses.final_score - score) ✓ Calculated correctly
  ↓
getGameGuessStatisticsForUsers() ✓ Fetches bonus data
  ↓
GameStatisticForUser ✓ Contains bonus fields (group_boost_bonus, playoff_boost_bonus, total_boost_bonus)
  ↓
getUserScoresForTournament() ✗ BREAKS HERE - doesn't extract bonus fields
  ↓
UserScore ✗ Missing bonus fields in interface
  ↓
ProdeGroupTable ✗ Cannot display what doesn't exist
```

**Problem Summary:**
1. ✅ Bonus points ARE calculated correctly in database
2. ✅ Bonus points ARE fetched via `GameStatisticForUser` type
3. ❌ `getUserScoresForTournament()` doesn't extract bonus fields from `GameStatisticForUser`
4. ❌ `UserScore` interface doesn't define bonus point fields
5. ❌ `ProdeGroupTable` component has no columns to display bonus points

## Technical Approach

### Solution Strategy
Fix the data flow by adding bonus point fields throughout the pipeline:
1. Extend `UserScore` interface with bonus fields
2. Update `getUserScoresForTournament()` to extract bonus data
3. Add bonus columns to the Position Tables UI
4. Update tests to cover bonus points scenarios

### UI Design Decisions
- **Desktop**: Show separate "Bonus Grupos" and "Bonus Playoffs" columns next to their respective score columns
- **Mobile**: Show single "Total Bonus" column to conserve space
- **Styling**: Use green color (`success.main`) for bonus values > 0
- **Display**: Always show values (including "0") for consistency

## Implementation Steps

### 1. Extend UserScore Interface
**File**: `app/definitions.ts` (lines 68-77)

Add three new fields to the `UserScore` interface:
```typescript
export interface UserScore {
  userId: string,
  groupStageScore: number,
  groupStageQualifiersScore: number,
  playoffScore: number,
  honorRollScore: number,
  totalPoints: number,
  individualAwardsScore: number,
  groupPositionScore?: number
  // ADD:
  groupBoostBonus: number,      // Bonus from boosted group stage games
  playoffBoostBonus: number,    // Bonus from boosted playoff games
  totalBoostBonus: number,      // Total bonus (group + playoff)
}
```

### 2. Update getUserScoresForTournament()
**File**: `app/actions/prode-group-actions.ts` (lines 193-214)

Extract bonus fields from `GameStatisticForUser` and add to `UserScore`:

**Current code:**
```typescript
return userIds.map(userId => ({
  userId,
  groupStageScore: gameStatisticsByUserIdMap[userId]?.group_score || 0,
  // ... other fields
  totalPoints: (gameStatisticsByUserIdMap[userId]?.total_score || 0) + ...
})) as UserScore[];
```

**Updated code:**
```typescript
return userIds.map(userId => {
  const gameStats = gameStatisticsByUserIdMap[userId];
  const tournamentGuess = tournamentGuessesByUserIdMap[userId];

  return {
    userId,
    groupStageScore: gameStats?.group_score || 0,
    groupStageQualifiersScore: tournamentGuess?.qualified_teams_score || 0,
    playoffScore: gameStats?.playoff_score || 0,
    honorRollScore: tournamentGuess?.honor_roll_score || 0,
    individualAwardsScore: tournamentGuess?.individual_awards_score || 0,
    groupPositionScore: tournamentGuess?.group_position_score || 0,
    // ADD:
    groupBoostBonus: gameStats?.group_boost_bonus || 0,
    playoffBoostBonus: gameStats?.playoff_boost_bonus || 0,
    totalBoostBonus: gameStats?.total_boost_bonus || 0,
    totalPoints:
      (gameStats?.total_score || 0) +
      (tournamentGuess?.qualified_teams_score || 0) +
      (tournamentGuess?.honor_roll_score || 0) +
      (tournamentGuess?.individual_awards_score || 0) +
      (tournamentGuess?.group_position_score || 0)
  };
}) as UserScore[];
```

### 3. Update ProdeGroupTable Component
**File**: `app/components/friend-groups/friends-group-table.tsx`

#### Add columns to TableHead (after line 166):
```typescript
<TableHead>
  <TableRow>
    <TableCell>#</TableCell>
    <TableCell>Usuario</TableCell>
    <TableCell>Puntos Totales</TableCell>
    <TableCell>Puntos Partidos</TableCell>
    {isNotExtraSmallScreen && <TableCell>Bonus Grupos</TableCell>}  {/* NEW */}
    {isNotExtraSmallScreen && <TableCell>Puntos Clasificados</TableCell>}
    {isNotExtraSmallScreen && <TableCell>Posiciones Grupo</TableCell>}
    <TableCell>Puntos Playoffs</TableCell>
    {isNotExtraSmallScreen && <TableCell>Bonus Playoffs</TableCell>}  {/* NEW */}
    {!isNotExtraSmallScreen && <TableCell>Total Bonus</TableCell>}  {/* NEW - mobile */}
    {isNotExtraSmallScreen && <TableCell>Cuadro de Honor</TableCell>}
    {isNotExtraSmallScreen && <TableCell>Premios</TableCell>}
    {ownerId === loggedInUser && <TableCell>Actions</TableCell>}
  </TableRow>
</TableHead>
```

#### Add cells to TableBody (after line 180):
```typescript
<TableBody>
  {userScoresByTournament[tournament.id]
    .sort((usa, usb) => usb.totalPoints - usa.totalPoints)
    .map((userScore, index) => {
      const member = membersState.find(m => m.id === userScore.userId);
      return (
        <TableRow key={userScore.userId} selected={userScore.userId === loggedInUser}>
          <TableCell>{index+1}</TableCell>
          <TableCell>{/* user name */}</TableCell>
          <TableCell>{userScore.totalPoints}</TableCell>
          <TableCell>{userScore.groupStageScore}</TableCell>
          {/* NEW: Group bonus column */}
          {isNotExtraSmallScreen && (
            <TableCell sx={{ color: userScore.groupBoostBonus > 0 ? 'success.main' : 'inherit' }}>
              {userScore.groupBoostBonus}
            </TableCell>
          )}
          {isNotExtraSmallScreen && <TableCell>{userScore.groupStageQualifiersScore}</TableCell>}
          {isNotExtraSmallScreen && <TableCell>{userScore.groupPositionScore || 0}</TableCell>}
          <TableCell>{userScore.playoffScore}</TableCell>
          {/* NEW: Playoff bonus column */}
          {isNotExtraSmallScreen && (
            <TableCell sx={{ color: userScore.playoffBoostBonus > 0 ? 'success.main' : 'inherit' }}>
              {userScore.playoffBoostBonus}
            </TableCell>
          )}
          {/* NEW: Total bonus column (mobile only) */}
          {!isNotExtraSmallScreen && (
            <TableCell sx={{ color: userScore.totalBoostBonus > 0 ? 'success.main' : 'inherit' }}>
              {userScore.totalBoostBonus}
            </TableCell>
          )}
          {isNotExtraSmallScreen && <TableCell>{userScore.honorRollScore}</TableCell>}
          {isNotExtraSmallScreen && <TableCell>{userScore.individualAwardsScore}</TableCell>}
          {/* admin actions */}
        </TableRow>
      )
    })}
</TableBody>
```

**Column Order (Desktop):**
1. Position #
2. Usuario
3. Puntos Totales
4. Puntos Partidos
5. **Bonus Grupos** ← NEW
6. Puntos Clasificados
7. Posiciones Grupo
8. Puntos Playoffs
9. **Bonus Playoffs** ← NEW
10. Cuadro de Honor
11. Premios
12. Actions (if owner)

**Column Order (Mobile):**
1. Position #
2. Usuario
3. Puntos Totales
4. Puntos Partidos
5. Puntos Playoffs
6. **Total Bonus** ← NEW

### 4. Update Tests
**File**: `__tests__/components/friend-groups/friends-group-table.test.tsx`

#### Update mock data (lines 104-135):
Add bonus fields to all `mockUserScores`:
```typescript
const mockUserScores: UserScore[] = [
  {
    userId: 'user1',
    totalPoints: 100,
    groupStageScore: 40,
    groupStageQualifiersScore: 20,
    groupPositionScore: 10,
    playoffScore: 25,
    honorRollScore: 5,
    individualAwardsScore: 0,
    groupBoostBonus: 8,        // NEW
    playoffBoostBonus: 5,      // NEW
    totalBoostBonus: 13        // NEW
  },
  // ... repeat for user2 and owner
];
```

#### Add new test suite:
```typescript
describe('Bonus points display', () => {
  it('shows bonus columns on desktop', () => {
    (useMediaQuery as any).mockReturnValue(true);
    render(<ProdeGroupTable {...defaultProps} />);

    expect(screen.getAllByText('Bonus Grupos')).toHaveLength(2);
    expect(screen.getAllByText('Bonus Playoffs')).toHaveLength(2);
    expect(screen.queryByText('Total Bonus')).not.toBeInTheDocument();
  });

  it('shows total bonus column on mobile', () => {
    (useMediaQuery as any).mockReturnValue(false);
    render(<ProdeGroupTable {...defaultProps} />);

    expect(screen.queryByText('Bonus Grupos')).not.toBeInTheDocument();
    expect(screen.queryByText('Bonus Playoffs')).not.toBeInTheDocument();
    expect(screen.getAllByText('Total Bonus')).toHaveLength(2);
  });

  it('displays bonus values correctly', () => {
    (useMediaQuery as any).mockReturnValue(true);
    render(<ProdeGroupTable {...defaultProps} />);

    // Verify bonus values from mock data appear
    expect(screen.getAllByText('8').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(2);
  });

  it('handles zero bonus values', () => {
    const scoresWithoutBonus = mockUserScores.map(score => ({
      ...score,
      groupBoostBonus: 0,
      playoffBoostBonus: 0,
      totalBoostBonus: 0
    }));

    render(
      <ProdeGroupTable
        {...defaultProps}
        userScoresByTournament={{
          'tournament1': scoresWithoutBonus,
          'tournament2': scoresWithoutBonus
        }}
      />
    );

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThanOrEqual(6);
  });

  it('maintains correct column order', () => {
    (useMediaQuery as any).mockReturnValue(true);
    render(<ProdeGroupTable {...defaultProps} />);

    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map(h => h.textContent);

    const groupBonusIndex = headerTexts.findIndex(text => text === 'Bonus Grupos');
    const playoffBonusIndex = headerTexts.findIndex(text => text === 'Bonus Playoffs');
    const groupScoreIndex = headerTexts.findIndex(text => text === 'Puntos Partidos');
    const playoffScoreIndex = headerTexts.findIndex(text => text === 'Puntos Playoffs');

    expect(groupBonusIndex).toBeGreaterThan(groupScoreIndex);
    expect(playoffBonusIndex).toBeGreaterThan(playoffScoreIndex);
  });
});
```

## Testing Strategy

### Automated Tests
```bash
# Run component tests
npm test __tests__/components/friend-groups/friends-group-table.test.tsx

# Run with coverage
npm run coverage -- __tests__/components/friend-groups/friends-group-table.test.tsx
```

### Manual Testing Checklist

**Desktop View (>900px):**
- [ ] "Bonus Grupos" column appears after "Puntos Partidos"
- [ ] "Bonus Playoffs" column appears after "Puntos Playoffs"
- [ ] Bonus values display correctly for each user
- [ ] Green color applied when bonus > 0
- [ ] Zero bonuses display as "0" (not blank)
- [ ] No horizontal overflow
- [ ] Column alignment is consistent

**Mobile View (<900px):**
- [ ] "Total Bonus" column visible
- [ ] "Bonus Grupos" and "Bonus Playoffs" columns hidden
- [ ] Total bonus values match sum of group + playoff
- [ ] Layout doesn't overflow horizontally

**Data Accuracy:**
- [ ] Compare displayed values with database query:
  ```sql
  SELECT
    user_id,
    SUM(COALESCE(final_score, 0) - COALESCE(score, 0)) as total_bonus
  FROM game_guesses
  WHERE tournament_id = '<id>' AND final_score IS NOT NULL
  GROUP BY user_id;
  ```
- [ ] Verify bonus values are consistent across all friend groups
- [ ] Test with different tournaments (group stage only, with playoffs, completed)

**Edge Cases:**
- [ ] Users with no bonuses (all zeros)
- [ ] Users with only group bonuses (playoff = 0)
- [ ] Users with only playoff bonuses (group = 0)
- [ ] Empty user scores array
- [ ] Tab switching maintains correct values

## Critical Files

- `app/definitions.ts` - Add bonus fields to UserScore interface
- `app/actions/prode-group-actions.ts` - Extract bonus data from GameStatisticForUser
- `app/components/friend-groups/friends-group-table.tsx` - Display bonus columns
- `__tests__/components/friend-groups/friends-group-table.test.tsx` - Test coverage

## Reference Implementation

`app/components/tournament-page/user-tournament-statistics.tsx` shows correct bonus display pattern (lines showing boostBonus for group and playoff stages).

## Rollout Considerations

- **Breaking changes**: None (purely additive)
- **Database migrations**: None required
- **Backward compatibility**: Full
- **Performance impact**: Negligible (3 additional number fields)

## Open Questions

None - implementation approach is clear based on existing patterns in the codebase.
