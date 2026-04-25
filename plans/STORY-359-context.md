# Story 359 Context

## Metadata
- **Story Number:** 359
- **Story Title:** [Story 6] Dashboard: Hub Page Orchestration
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-359
- **Branch:** feature/story-359
- **PR Number:** 388
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/388

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-359-plan.md

## Quick Summary
Final cleanup story in the Dashboard series. The hub page (`app/[locale]/tournaments/[id]/page.tsx`) already correctly orchestrates all decoupled widgets with a proper visibility matrix (Teams/Awards hidden post-lock, Results/Stats shown post-start). This story removes the three orphaned legacy components (`TournamentHubActionCenter`, `PreTournamentNewUserActionCenter`, `ActionCenterCarousel`) and their test files, which are no longer referenced by any production code after Stories 1–5 migrated their functionality to individual widgets.
