# Story 443 Context

## Metadata
- **Story Number:** 443
- **Story Title:** [Story] Configurable group tiebreaker rules per tournament, with head-to-head as default
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/ecstatic-dirac-497fec
- **Branch:** claude/ecstatic-dirac-497fec
- **PR Number:** 444
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/444

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-443-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Moves tiebreaker configuration from per-group (`sort_by_games_between_teams` boolean on `tournament_groups`) to per-tournament level (`tiebreaker_mode` on `tournaments` with values `'head_to_head'` | `'standard'`). New tournaments default to H2H; existing get `'standard'` via migration. Removes the per-group backoffice toggle and adds a tournament-level selector. Updates all callers of `calculateGroupPosition` to use the tournament's `tiebreaker_mode` instead of the group flag. The H2H algorithm in `group-position-calculator.ts` is already FIFA-correct and requires no logic changes.
