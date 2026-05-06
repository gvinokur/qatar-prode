# Story 411 Context

## Metadata
- **Story Number:** 411
- **Story Title:** Hub page: stop fetching action center data for finished tournaments and eliminate duplicate tournament queries
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/optimistic-banzai-cda404
- **Branch:** claude/optimistic-banzai-cda404
- **PR Number:** 427
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/427

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-411-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Merges `getPublicTournamentTiming` into `getTournamentHubPageData` (adding a `locale` param) to eliminate 2 duplicate DB queries (`findTournamentById` + `findFirstGameInTournament`) on every hub page load. Deletes the now-redundant `getPublicTournamentTiming` server action. Updates `page.tsx` to use the merged function and simplify the two-batch fetch pattern. Updates tests to reflect the new interface.
