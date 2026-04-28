# Story #401 Plan: Stable Sorting for Simultaneous Games

## Objective & Context
Currently, game lists are primarily sorted by `game_date`. When multiple games occur at the same time (common in the final round of group stages), the relative order between these games is unstable. This confuses users who might be completing predictions in official "game number" order, only to see the cards jump around or appear out of sequence. The goal is to add a stable secondary sort using `game_number`.

## Acceptance Criteria
- [ ] Games are primarily sorted by date/time (or matchday where applicable).
- [ ] Game number is used as a secondary sort key for all game lists to provide stable ordering for simultaneous games.
- [ ] Action Center "Urgent" and "Fallback" modes show games in consistent sequential order.
- [ ] The "Games" page list matches the official tournament numbering when dates are identical.
- [ ] Recent Results widget maintains a consistent reverse-chronological order (`game_date` DESC, then `game_number` DESC).

## Technical Approach
Modify the database queries in `app/db/game-repository.ts` to add `ORDER BY game_number` as a secondary sorting criterion. Modify in-memory array `.sort()` methods in `app/actions/hub-actions.ts`, `app/actions/tournament-actions.ts`, `app/utils/game-filters.ts`, and `app/components/urgency-accordion-group.tsx` to fallback to `game_number` differences when `game_date` differences are zero. 

## Visual Prototypes
N/A - This is a purely logical sorting update. No UI components are structurally changed.

## Mid-Level Design

### Database Queries (`app/db/game-repository.ts`)
- `findFirstGameInTournament`: Add `.orderBy('game_number', 'asc')`
- `findFirstGameFullData`: Add `.orderBy('game_number', 'asc')`
- `findLastGameInTournament`: Add `.orderBy('game_number', 'desc')`
- `findGamesInNext24Hours`: Add `.orderBy('game_number', 'asc')`
- `findGamesForDashboard`: Add `.orderBy('game_number', 'asc')`
- `getAllTournamentGames`: Add `.orderBy('game_number', 'asc')`
- `findRecentGamesForDashboard`: Add `.orderBy('games.game_number', 'desc')`
- `findRecentGamesWithUserGuesses`: Add `.orderBy('games.game_number', 'desc')`

*Test Cases for DB Queries:*
1. Queries return correct fallback when dates are same.
2. Queries return correct ascending/descending order for `game_number` respectively.
3. Queries don't crash when `game_number` is null (handled correctly).

### In-Memory Sorting Updates
- `findGamesAroundCurrentTime` (`app/db/game-repository.ts`):
  Update sort to `const diff = a.game_date.getTime() - b.game_date.getTime(); return diff === 0 ? a.game_number - b.game_number : diff;`
- `getActionCenterGames` and `getCarouselGames` (`app/actions/hub-actions.ts`):
  Update `urgentGames` and `upcomingGames` sorting logic to fallback to `game_number`.
- `tournament-actions.ts` (line 149):
  Update `.toSorted` fallback to `game_number`.
- `filterGames` (`app/utils/game-filters.ts`):
  Update `filtered.sort` fallback to `game_number`.
- `UrgencyAccordionGroup` (`app/components/urgency-accordion-group.tsx`):
  Update `sortByDeadline` fallback to `game_number`.

*Test Cases for Array Sorting:*
1. `Date A < Date B`: correctly returns negative.
2. `Date A == Date B, Num A < Num B`: correctly returns negative.
3. `Date A == Date B, Num A > Num B`: correctly returns positive.

## Verification Plan
1. Run `npm run test` to verify no unit tests are broken.
2. If tests break due to mocked games lacking `game_number` or expecting different sort order, update test factories.
3. Start the application and verify simultaneous games in Action Center and Unified Games Page sort correctly by `game_number`.
