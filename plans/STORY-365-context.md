# Story 365 Context

## Metadata
- **Story Number:** 365
- **Story Title:** [Story 8] Tournament Hub Results Widget
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-365
- **Branch:** feature/story-365
- **PR Number:** 372
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/372

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-365-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Migrate the existing `RecentResultsWidget` into the standardized `DashboardCard` container used by all other hub widgets, and wire it into the tournament hub page to replace the current placeholder. The widget content (games list, qualified teams, awards, empty state, "See Stats" button) is preserved — only the outer layout shell changes from a custom Paper/title to DashboardCard.
