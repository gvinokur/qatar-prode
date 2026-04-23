# Story 358 Context

## Metadata
- **Story Number:** 358
- **Story Title:** [Story 5] Dashboard: Dynamic Friend Group Widgets
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-358
- **Branch:** feature/story-358
- **PR Number:** 379
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/379

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-358-plan.md

## Quick Summary
Activates the "Groups" slot on the Tournament Hub dashboard by replacing the static Lorem ipsum placeholder card with dynamic per-group leaderboard peek cards. Each active friend group gets its own separate card in the dashboard CSS Grid (up to 3). Edge states (no groups, pre-tournament) render as a single consolidated card. Requires refactoring `TournamentHubLeaderboardPeek` to return a React Fragment for active groups, updating `LeaderboardPeekCard` styling for grid consistency, and wiring both into the hub page via Suspense.
