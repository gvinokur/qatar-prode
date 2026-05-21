# Story 454 Context

## Metadata
- **Story Number:** 454
- **Story Title:** [Story] Show and edit team FIFA rank in backoffice
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/suspicious-raman-ddd3d1
- **Branch:** claude/suspicious-raman-ddd3d1
- **PR Number:** 455
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/455

## State
- **Current Phase:** review-ready
- **Plan File:** plans/STORY-454-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Add FIFA rank display and editing to the backoffice Teams tab. Each team card shows the current rank (or "—" if unranked). The team edit dialog gains a numeric rank field with validation (1–999 only; clearing sets null). Server action validates rank server-side too. A migration adds the `rank` column to the teams table (idempotent, since story #449 may already have applied it to the DB).
