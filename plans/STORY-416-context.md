# Story 416 Context

## Metadata
- **Story Number:** 416
- **Story Title:** [Story] Friend group page: eliminate redundant tournament date and member profile fetches inside score history loading
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/stupefied-maxwell-3838b8
- **Branch:** (fill after worktree creation)
- **PR Number:** (fill after PR creation)
- **PR URL:** (fill after PR creation)

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-416-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Refactor the friend group detail page's score history loading to accept pre-fetched tournament date ranges and member profiles as parameters, eliminating ~9 redundant DB queries per page load (3 active tournaments × 3 redundant queries each).
