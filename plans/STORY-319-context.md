# Story 319 Context

## Metadata
- **Story Number:** 319
- **Story Title:** [Story] Leaderboard Peek Widget
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-319
- **Branch:** feature/story-319
- **PR Number:** 331
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/331

## State
- **Current Phase:** review-ready
- **Plan File:** plans/STORY-319-plan.md
- **Task File:** plans/STORY-319-tasks.md

## Quick Summary
Builds the "Ego Section" of the Tournament Hub — a compact widget showing the user's competitive standing in their top 3 friend groups. Each group card displays a 3-row mini-table (person above, current user highlighted, person below) plus a momentum indicator (rank change from last snapshot). Taps navigate to the full group leaderboard. Data sourced from the materialized `group_rankings` table. Replaces the existing placeholder Paper in `hub/page.tsx`.
