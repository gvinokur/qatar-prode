# Story 415 Context

## Metadata
- **Story Number:** 415
- **Story Title:** [Story] Parallelize sequential database calls in group join, standings, and email invitation actions
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/nifty-jang-6beacf
- **Branch:** claude/nifty-jang-6beacf
- **PR Number:** 448
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/448

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-415-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Replaces sequential `await` chains with `Promise.all` in three server action files: `prode-group-join-request-actions.ts` (5 functions), `group-tournament-betting-actions.ts` (2 functions), and `prode-group-actions.ts` (`sendGroupEmailInvitations`). No signatures or return types change — pure internal optimization that reduces DB round trips from 3–5 sequential calls down to 1 parallel call per action invocation. Also adds a new test file for the previously untested betting actions.
