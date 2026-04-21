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
Establishes the new hub dashboard architecture: creates a reusable `DashboardCard` primitive (MUI Card with standardized header, icon avatar, title, action slot, and content area), rewrites `page.tsx` with a clean two-zone mock layout — full-width Banner Area (Stack with dashed Paper) and a responsive Widget Grid (CSS Grid, `repeat(auto-fit, minmax(340px, 1fr))`) showing 4 mock DashboardCard instances. No old hub components are used.
