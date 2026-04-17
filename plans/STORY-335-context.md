# Story 335 Context

## Metadata
- **Story Number:** 335
- **Story Title:** [Story] Read rank history chart data from group_rankings table
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-335
- **Branch:** feature/story-335
- **PR Number:** 336
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/336

## State
- **Current Phase:** review-ready
- **Plan File:** plans/STORY-335-plan.md
- **Task File:** plans/STORY-335-tasks.md

## Quick Summary
Replace the rank computation in the History tab's RankHistoryChart with pre-stored values from the `group_rankings` table. Add a new server action `getGroupRankHistory()` that reads snapshots, modify `HistoryTab` to accept and prefer pre-stored ranks over computed ones, and update both friend-group pages to fetch and pass the pre-stored data. Fall back to computed ranks when no snapshots exist.
