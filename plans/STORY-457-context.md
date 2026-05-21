# Story 457 Context

## Metadata
- **Story Number:** 457
- **Story Title:** [Story] Remove leftover debug console.warn() logs from components
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/magical-cartwright-42dba2
- **Branch:** claude/magical-cartwright-42dba2
- **PR Number:** 458
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/458

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-457-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Remove 5 debug `console.warn()` calls that were left in after development: 4 in `ScrollShadowContainer` (fired on every scroll/resize/mutation/child-observe event) and 1 in `OnboardingDialogClient` (logs tournament data on render). Component behavior is unchanged.
