# Story 412 Context

## Metadata
- **Story Number:** 412
- **Story Title:** [Story] Predictions hub: consolidate prediction completion progress queries for faster action center loading
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/sharp-fermi-5e3036
- **Branch:** claude/sharp-fermi-5e3036
- **PR Number:** 425
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/425

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-412-plan.md

## Quick Summary
Consolidates 13 sequential DB queries in `getTournamentPredictionCompletion` into 4 parallel queries using conditional aggregation (COUNT CASE WHEN) and `Promise.all`. The core target is `app/db/tournament-prediction-completion-repository.ts` which currently makes 6 separate COUNT queries for game/boost stats and 4 separate queries for playoff round data. These are collapsed into 2 mega-queries that run in parallel alongside the existing `findTournamentGuessByUserIdTournament` and `getAllUserGroupPositionsPredictions` calls. An optional `firstGameDate` param is added to hub-actions.ts to eliminate the redundant `getTournamentStartDate` call.
