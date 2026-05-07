# Story 426 Context

## Metadata
- **Story Number:** 426
- **Story Title:** [Bug] QT header shows auto-fill banner before group stage matches are complete
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/hungry-mayer-52fe39
- **Branch:** claude/hungry-mayer-52fe39
- **PR Number:** 429
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/429

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-426-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Adds a new "group stage in progress" variant (6a) to the QT prediction status header. When the tournament has started but actual group standings aren't yet finalized, the auto-fill banner is suppressed in favor of an informational message. Two optional boolean flags (`tournamentStarted`, `groupStageComplete`) are added to `QTHeaderInput` with safe defaults, so existing tests and callers are unaffected.
