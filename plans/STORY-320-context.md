# Story 320 Context

## Metadata
- **Story Number:** 320
- **Story Title:** [Story] Migrate FE Rank Calculation to Materialized Ranks
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-320
- **Branch:** feature/story-320
- **PR Number:** 334
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/334

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-320-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Removes the client-side rank calculation from LeaderboardCards and replaces it with pre-computed ranks read from the group_rankings table (materialized by Story #315). Adds a new batch repository function getLatestRankingsForGroupWithChange, a new server action getMaterializedLeaderboardRanks, threads the result through ProdeGroupTable → LeaderboardView → LeaderboardCards, and removes the calculateRanks/calculateRanksWithChange imports from the client component.
