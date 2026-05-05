# Story 417 Context

## Metadata
- **Story Number:** 417
- **Story Title:** [Bug] Locked games appear as predictable in header and backend allows saving post-deadline predictions
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/cranky-lumiere-96eca3
- **Branch:** claude/cranky-lumiere-96eca3
- **PR Number:** 421
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/421

## State
- **Current Phase:** review-ready
- **Plan File:** plans/STORY-417-plan.md
- **Task File:** plans/STORY-417-tasks.md

## Quick Summary
Three targeted fixes for locked-game prediction bugs: (1) filter `unpredictedUrgentGames` in the header by `calculateDeadline` to exclude past-deadline games, (2) fix the `edit=next` client-side navigation to skip games whose deadline has passed, and (3) add a backend deadline guard in `updateOrCreateGameGuesses` that rejects saves for locked games. AC4 (direct URL shows game as non-editable) is already handled by `game-view.tsx`.
