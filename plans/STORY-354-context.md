# Story 354 Context

## Metadata
- **Story Number:** 354
- **Story Title:** [Story 1] Dashboard: Card Primitive & Grid Foundation
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-354
- **Branch:** feature/story-354
- **PR Number:** 361
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/361

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-354-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Establishes the new hub dashboard architecture: creates a reusable `DashboardCard` primitive (MUI Card with standardized header, icon avatar, title, action slot, and content area), refactors `page.tsx` to split the layout into a full-width Banner Area (Stack) and a responsive 2-column Widget Grid (CSS Grid with `repeat(auto-fit, minmax(340px, 1fr))`). Also backs up the current `tournament-hub` components to `app/components/hub_backup/` as a reference for later deletion as the new hub iteration progresses.
