# Story 381 Context

## Metadata
- **Story Number:** 381
- **Story Title:** [Story] Automatic Baseline (Day Zero) for Score History
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-381
- **Branch:** feature/story-381
- **PR Number:** 382
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/382

## State
- **Current Phase:** review-ready
- **Plan File:** plans/STORY-381-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Modify `writeScoreSnapshot` in `score-history-repository.ts` to automatically insert a "Day Zero" entry (all scores = 0, date = day before first snapshot) whenever a user has no existing score history for a tournament. This ensures tournament progression charts always start from a zero baseline. Also adds a `getPreviousDayYYYYMMDD` utility to `date-utils.ts` for boundary-safe date arithmetic.
