# Story 315 Context

## Metadata
- **Story Number:** 315
- **Story Title:** [Story] Rank Materialization Backend
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-315
- **Branch:** feature/story-315
- **PR Number:** 322
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/322

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-315-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Story #315 introduces a persisted `group_rankings` table to materialize per-user, per-group ranks in the database. Rank recalculation is triggered from existing admin actions (saveGameResults, updateTournamentAwards, updateTournamentHonorRoll) after score changes. Exposes a new Server Action for fetching materialized rank data for a given user + group, enabling downstream Tournament Hub widgets without runtime aggregation.
