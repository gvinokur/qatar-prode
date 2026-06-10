# Story 468 Context

## Story Metadata

- **Story Number:** 468
- **Story Title:** [Bug] Banner message and action buttons get squeezed onto the same row in narrow containers
- **Story URL:** https://github.com/gvinokur/qatar-prode/issues/468
- **Labels:** bug
- **Project:** UX Audit 2026

## Worktree

- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-468
- **Branch:** feature/story-468
- **Main Worktree:** /Users/gvinokur/Personal/qatar-prode

## PR

- **PR Number:** (fill after PR creation)
- **PR URL:** (fill after PR creation)

## Phase

- **Current Phase:** planning

## Plan File

- **Plan:** /Users/gvinokur/Personal/qatar-prode-story-468/plans/STORY-468-plan.md

## Summary

Single-file CSS/layout bug fix in `app/components/prediction-status-header/prediction-status-header.tsx`.

Three targeted changes:
1. Add `flexWrap: 'wrap'` to expanded section Box
2. Change Typography flex from `flex: 1` to `flex: '1 1 150px'`
3. Add `ml: 'auto'` to expandedActions wrappers (and wrap single action in a Box)

No schema changes, no new exports, no migration needed.
