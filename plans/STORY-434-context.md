# Story 434 Context

## Metadata
- **Story Number:** 434
- **Story Title:** [Bug] Backoffice allows publishing incomplete or invalid game scores
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/quizzical-lumiere-fdacd6
- **Branch:** claude/quizzical-lumiere-fdacd6
- **PR Number:** 438
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/438

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-434-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Adds validation to prevent admins from publishing incomplete game results. A new `isGameResultPublishable` utility enforces that both scores must be set, and tied playoff games require penalty scores. The UI disables the publish toggle (with tooltip) when scores are incomplete; the server action also throws defensively if violated.
