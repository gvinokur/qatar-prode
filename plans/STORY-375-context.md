# Story 375 Context

## Metadata
- **Story Number:** 375
- **Story Title:** [Story] User Stats at a Glance Widget
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-375
- **Branch:** feature/story-375
- **PR Number:** 380
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/380

## State
- **Current Phase:** review-ready
- **Plan File:** plans/STORY-375-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Adds a "Stats at a Glance" DashboardCard widget to the Tournament Hub showing the user's total score, per-category breakdowns (Matches / Qualified Teams / Awards) with deltas since the last daily snapshot, a sparkline trend chart, and a "See all statistics" link. Displayed only after tournament starts for logged-in users. Data comes from the existing `tournament_score_history` table via a new `getStatsAtAGlanceData` server action in `hub-actions.ts`.
