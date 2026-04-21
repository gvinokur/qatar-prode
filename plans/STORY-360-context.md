# Story 360 Context

## Metadata
- **Story Number:** 360
- **Story Title:** [Story 7] Dashboard: Logged-Off Routing & Navigation
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-360
- **Branch:** feature/story-360
- **Base Branch:** feature/story-354
- **PR Number:** (fill after PR creation)
- **PR URL:** (fill after PR creation)

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-360-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Story #360 enables unauthenticated users to access the Tournament Hub page by: (1) removing the auth redirect from `app/[locale]/tournaments/[id]/page.tsx` that sent guests to `/games`, and (2) removing `disabled={!user}` from the Hub nav tab in `GroupSelector`. The Qualified Teams and Awards tabs keep their auth guards. Three source files change plus one CODE-STRUCTURE update; one test gets inverted and several guard tests get added.
