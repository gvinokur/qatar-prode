# Story #401 Tasks: Stable Sorting for Simultaneous Games

## Wave 1: Database Queries
- [x] Update `app/db/game-repository.ts`
  - `findFirstGameInTournament`: Add `.orderBy('game_number', 'asc')`
  - `findFirstGameFullData`: Add `.orderBy('game_number', 'asc')`
  - `findLastGameInTournament`: Add `.orderBy('game_number', 'desc')`
  - `findGamesAroundCurrentTime`: Update in-memory array sort to fallback to `game_number`
  - `findGamesInNext24Hours`: Add `.orderBy('game_number', 'asc')`
  - `findGamesForDashboard`: Add `.orderBy('game_number', 'asc')`
  - `getAllTournamentGames`: Add `.orderBy('game_number', 'asc')`
  - `findRecentGamesForDashboard`: Add `.orderBy('games.game_number', 'desc')`
  - `findRecentGamesWithUserGuesses`: Add `.orderBy('games.game_number', 'desc')`

## Wave 2: In-Memory Array Sorting
- [x] Update `app/actions/hub-actions.ts`
  - `getActionCenterGames`: Update sorting for `urgentGames` and `upcomingGames`
  - `getCarouselGames`: Update sorting for `urgentGames` and `upcomingGames`
- [x] Update `app/actions/tournament-actions.ts`
  - Line 149: Update `.toSorted` logic
- [x] Update `app/utils/game-filters.ts`
  - `filterGames`: Update `filtered.sort` logic
- [x] Update `app/components/urgency-accordion-group.tsx`
  - `UrgencyAccordionGroup`: Update `sortByDeadline` logic

## Wave 3: Validation & Commit
- [x] Run `npm run test`
- [x] Run `npm run lint`
- [x] Run `npm run build`
- [x] Commit changes
