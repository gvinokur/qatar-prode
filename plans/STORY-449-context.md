# Story 449 Context

## Metadata
- **Story Number:** 449
- **Story Title:** [Story] Seed team strength rankings
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/brave-dubinsky-b9682e
- **Branch:** claude/brave-dubinsky-b9682e
- **PR Number:** 453
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/453

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-449-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Adds a nullable `rank` INTEGER column to the `teams` table (lower = stronger, FIFA World Rankings convention) and seeds official FIFA World Rankings (December 2023) for all 42 confirmed FIFA 2026 teams. Includes a CHECK constraint (1–999), TypeScript type update, data file update, and 5 integration tests covering valid/null/boundary/rejection scenarios. Copa América and Euro teams remain unranked (NULL). No UI changes.
