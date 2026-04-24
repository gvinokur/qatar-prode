# Story 383 Context

## Metadata
- **Story Number:** 383
- **Story Title:** [Story] Hub navigation unification and penalty winner indicators
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-383
- **Branch:** feature/story-383
- **PR Number:** 384
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/384

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-383-plan.md

## Quick Summary
Unifies hub widget navigation by: (1) converting the Recent Results widget from a static list to a 5-item vertical carousel with up/down arrows; (2) replacing the Action Center's horizontal card scroll with a single-card view + vertical arrow navigation; (3) adding penalty shootout score format `HomeTeam Score (Pen)–(Pen) Score AwayTeam` with winner bolded; (4) surfacing penalty winner info in prediction feedback subtexts. Requires adding penalty columns to the `findRecentGamesForDashboard` DB query and propagating them through the action and component layers.
