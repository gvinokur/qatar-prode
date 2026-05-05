# Story 410 Context

## Metadata
- **Story Number:** 410
- **Story Title:** [Story] Tournament layout: eliminate redundant DB call and parallelize data loading
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/elegant-noether-f97e4f
- **Branch:** claude/elegant-noether-f97e4f
- **PR Number:** 420
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/420

## State
- **Current Phase:** review-ready
- **Plan File:** plans/STORY-410-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Optimize the tournament layout server component by (1) removing a redundant `findTournamentById` DB call — the data is already in `layoutData.tournament` — and (2) parallelizing 8+ sequential data fetches into 3 Promise.all waves, and (3) gating `getGroupStandingsForTournament` behind an auth check so unauthenticated visitors skip that expensive multi-query call entirely.
