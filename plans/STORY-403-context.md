# Story 403 Context

## Metadata
- **Story Number:** 403
- **Story Title:** [Story] Limit urgent games banner to 24-hour window
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-403
- **Branch:** feature/story-403
- **PR Number:** 404
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/404

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-403-plan.md

## Quick Summary
Change `computePriorityAttention()` in `app/utils/priority-attention.ts` to only return the `urgent-games` banner state (red banner) when at least one unpredicted game's prediction deadline is within 24 hours. Currently, any unpredicted game with an open deadline triggers the red banner even if the game is days away. The fix is a surgical filter that falls through to lower-priority states when no games are imminent. The carousel is unaffected.
