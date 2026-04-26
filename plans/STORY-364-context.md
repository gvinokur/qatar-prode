# Story 364 Context

## Metadata
- **Story Number:** 364
- **Story Title:** Goal Difference Scoring Tier
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-364
- **Branch:** feature/story-364
- **PR Number:** 395
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/395

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-364-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Adds a middle scoring tier "Exact Goal Difference" between the existing "Correct Outcome" (1pt) and "Exact Score" (2pt) tiers. Players who predict the correct winner AND the exact margin (home - away goal difference) earn this new tier. Configurable per tournament (`game_correct_goal_difference_points`, default 2). Requires DB migrations, scoring logic update, UI badge/stats updates, backoffice config, and full i18n.
