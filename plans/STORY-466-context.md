# Story 466 Context

## Metadata
- **Story Number:** 466
- **Story Title:** [Story] Admin view of user completion stats per tournament
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-466
- **Branch:** feature/story-466
- **PR Number:** 467
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/467

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-466-plan.md

## Quick Summary
Adds a "User Completion" tab to the backoffice tournament admin page (both active and inactive tournaments). The tab shows a paginated table of all platform users with their prediction stats for that tournament: display name, active status, overall completion %, games predicted / total, qualifiers filled / total, and awards filled / total. Users with at least one prediction appear first. Implemented via a new Kysely repository query, admin Server Action, and client component following existing backoffice patterns.
