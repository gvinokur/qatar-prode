# Story 414 Context

## Metadata
- **Story Number:** 414
- **Story Title:** [Story] Replace JS-side count with SQL COUNT query for "Predictions Made" on statistics page
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/determined-turing-f8c893
- **Branch:** claude/determined-turing-f8c893
- **PR Number:** 430
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/430

## State
- **Current Phase:** review-ready
- **Plan File:** plans/STORY-414-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Replaces JS-side `.length`-on-array pattern in the stats page with a new `countGameGuessesByUserId` repository function that issues a single SQL COUNT(*) query. Changes two files: game-guess-repository.ts (new function) and stats/page.tsx (import + usage swap).
