# Story 356 Context

## Metadata
- **Story Number:** 356
- **Story Title:** [Story 4] Dashboard: Games Prediction Widget
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-356
- **Branch:** feature/story-356
- **PR Number:** 366
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/366

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-356-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Replaces the mock "Games" DashboardCard placeholder in the tournament hub dashboard with a real
`GamesPredictionWidget` Server Component. The widget has three states: (1) **Logged-Off** —
shows scoring rules + CTA to sign in; (2) **Pre-Start** (authenticated, tournament not yet
started) — shows description, deadline info, scoring rules, progress bar, CTA to start
predicting; (3) **Active** (authenticated, tournament underway) — shows a single flippable
game card with left/right navigation arrows plus a "View all" link. Data comes from
`getActionCenterGames` for authenticated states and a new minimal action
`getGamesWidgetConfigForLoggedOff` for guests.
