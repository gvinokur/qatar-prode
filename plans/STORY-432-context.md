# Story 432 Context

## Metadata
- **Story Number:** 432
- **Story Title:** [Bug] Draft game scores are visible to users in hub and games pages
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/lucid-mendeleev-54d367
- **Branch:** claude/lucid-mendeleev-54d367
- **PR Number:** 437
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/437

## State
- **Current Phase:** review-ready
- **Plan File:** plans/STORY-432-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Two repository functions — `findGamesForDashboard` and `getAllTournamentGames` — fetch game results via a correlated subquery without filtering `is_draft = false`, causing draft scores to leak to users on the hub games widget and the games page. The fix adds a single `.where('game_results.is_draft', '=', false)` clause to the `game_results` subquery in each function so that games with only a draft result show as score-less to users, while backoffice views remain unaffected.
