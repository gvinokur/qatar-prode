# Story 445 Context

## Metadata
- **Story Number:** 445
- **Story Title:** [Story] Replace bespoke LoggedOffBanner on Games page with PredictionStatusHeader
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/naughty-edison-6a9b9c
- **Branch:** (fill after worktree creation)
- **PR Number:** (fill after PR creation)
- **PR URL:** (fill after PR creation)

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-445-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Replace the hand-rolled `LoggedOffBanner` blue sticky bar in `public-games-page-client.tsx` with a new `GamesLoggedOutHeader` component that renders `PredictionStatusHeader` via `computeLoggedOutVariant` — mirroring the pattern already used by `HubLoggedOutHeader` on the Hub page. Delete `public-cta-bar.tsx` and its test file once the replacement is in place.
