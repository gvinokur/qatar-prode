# Story 303 Context

## Metadata
- **Story Number:** 303
- **Story Title:** [Story] JSON-LD structured data
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-303
- **Branch:** feature/story-303
- **PR Number:** 309
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/309

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-303-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Add JSON-LD structured data to tournament pages: SportsEvent schema on the tournament layout (covering all tournament pages) and BreadcrumbList schema on second-level sub-pages (results, stats, awards, qualified-teams, rules). Implementation uses a new JsonLd server component and pure utility functions, with React.cache() to avoid extra DB queries.
