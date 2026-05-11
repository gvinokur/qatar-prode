# Story 431 Context

## Metadata
- **Story Number:** 431
- **Story Title:** [Bug] Group standings tiebreaker ranks teams incorrectly when conduct scores are set
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-431
- **Branch:** feature/story-431
- **PR Number:** (fill after PR creation)
- **PR URL:** (fill after PR creation)

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-431-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Fixes three compounding bugs that cause group standings to display incorrect rankings when admins set conduct scores: (1) `calculateGroupPosition` ignores conduct scores entirely (always starts at 0), (2) `calculateAndStoreGroupPosition` wipes admin-set conduct scores by overwriting them with 0 every time positions are recalculated, and (3) `TeamStandingsCards` client-side sort only uses points and goal_difference, ignoring goals_for and conduct_score.
