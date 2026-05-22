# Story 450 Context

## Metadata
- **Story Number:** 450
- **Story Title:** [Story] AI-generate game score predictions based on team rankings
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/intelligent-varahamihira-a8988f
- **Branch:** claude/intelligent-varahamihira-a8988f
- **PR Number:** 456
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/456

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-450-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Adds an ✨ AI-generate feature to the games page. A sparkle icon button on each unfilled game card generates a probabilistic score using the Skellam model (independent Poisson sampling per team, driven by `team.rank` diff via symmetric exponential xG scaling: `λ = 1.2 · exp(±0.024 · diff)`). A bulk "AI-generate all" FAB fills all open unfilled games at once with a confirmation dialog. Both paths reuse the existing `updateOrCreateGameGuesses()` action and update the GuessesContext via a new `bulkSetGameGuesses()` method. No DB/migration work — `team.rank` is already seeded by Story #449.
