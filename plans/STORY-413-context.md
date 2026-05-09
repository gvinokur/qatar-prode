# Story 413 Context

## Metadata
- **Story Number:** 413
- **Story Title:** [Story] Hub leaderboard peek: only fetch ranking data for the groups that will actually be displayed
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/laughing-bose-ca3489
- **Branch:** claude/laughing-bose-ca3489
- **PR Number:** 435
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/435

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-413-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
The hub page's leaderboard peek widget currently fetches full ranking data (all members, with user names) for every group a user belongs to, then discards all but 3. This story optimizes `getLeaderboardPeekData` in `hub-actions.ts` by adding a lightweight `getGroupRankingSummaries` DB function that returns just counts and user presence in 2 DB round-trips for all groups, replaces N full-ranking queries with that single summary query, then only fetches the full ranking details for the top 3 groups actually displayed.
