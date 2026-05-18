# Story 424 Context

## Metadata
- **Story Number:** 424
- **Story Title:** Consolidate tournament stats page to use single data fetch
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-424
- **Branch:** feature/story-424
- **PR Number:** 447
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/447

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-424-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Both `getGameGuessStatisticsForUsers` and `findTournamentGuessByUserIdTournament` hit the `tournament_guesses` table on the stats page. Adding `qualified_teams_correct` and `qualified_teams_exact` to the first query's SELECT list makes the second call redundant, allowing it to be removed from `TournamentStatsPage`.
