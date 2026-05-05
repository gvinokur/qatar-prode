# Story 422 Context

## Metadata
- **Story Number:** 422
- **Story Title:** [Story] Extract tournament sidebar into a dedicated Server Component with streaming
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/recursing-burnell-653801
- **Branch:** claude/recursing-burnell-653801
- **PR Number:** 423
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/423

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-422-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
This story extracts the tournament sidebar data fetching out of `TournamentLayout` into a dedicated async Server Component (`TournamentSidebarServer`) wrapped in React Suspense. Currently the layout blocks rendering until all sidebar data (friend groups, standings, user stats, group ranks) resolves — even though the header needs none of it. After this change, the header and navigation appear immediately while the sidebar streams in behind a skeleton placeholder.
