# Story 461 Context

## Metadata
- **Story Number:** 461
- **Story Title:** Fix player import: DOB parsing failures and delete-existing-players not working
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-461
- **Branch:** feature/story-461
- **PR Number:** (fill after PR creation)
- **PR URL:** (fill after PR creation)

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-461-plan.md

## Quick Summary
Two bug fixes in the Transfermarkt player import flow: (1) DOB parsing uses `new Date()` which fails for non-US formats, fixed by using `dayjs` with explicit format list; (2) "delete existing players" checkbox never deleted anything due to age mismatches, fixed by doing a full wipe via `deleteAllTeamPlayersInTournament` before reimporting.
