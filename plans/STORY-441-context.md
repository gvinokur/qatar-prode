# Story 441 Context

## Metadata
- **Story Number:** 441
- **Story Title:** [Story] Migrate Hub banner states to reusable PredictionStatusHeader component
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/elegant-buck-959bd5
- **Branch:** claude/elegant-buck-959bd5
- **PR Number:** 442
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/442

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-441-plan.md
- **Task File:** plans/STORY-441-tasks.md

## Quick Summary
Migrates the Hub page's three bespoke banner components (PriorityAttentionWidget, EngagementRotatorWidget, LoggedOffBanner) to render via the shared PredictionStatusHeader component. Creates a new `hub-header-variant.ts` that maps all 9 hub states to StatusHeaderVariant objects, adds 5 new leadIcon values (login, clock, book, mobile, bell) to the PSH type system, and replaces each bespoke Paper/Avatar/Button card with `<PredictionStatusHeader variant={...} />`.
