# Story 476 Context

## Metadata
- **Story Number:** 476
- **Story Title:** [Bug] Playoff games beyond Round of 16 show predicted team names instead of actual teams
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-476
- **Branch:** feature/story-476
- **PR Number:** 477
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/477

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-476-plan.md

## Quick Summary
When actual scores for playoff games are published, all playoff rounds beyond the first group-seeded round (R32) never get their `home_team`/`away_team` DB columns populated. This is caused by two related bugs in `calculateAndSavePlayoffGamesForTournament`: (1) it only processes `playoffStages[0]`, never propagating winners to subsequent stages, and (2) `saveGamesAndRecalculate` only triggers the function when group-stage games are saved, completely skipping it when playoff games are scored.
