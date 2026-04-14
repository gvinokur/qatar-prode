# Story 323 Context

## Metadata
- **Story Number:** 323
- **Story Title:** [Bug] Hide third-place qualifier checkbox when tournament doesn't allow third-place qualification
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-323
- **Branch:** feature/story-323
- **PR Number:** 324
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/324

## State
- **Current Phase:** review-ready
- **Plan File:** plans/STORY-323-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
A one-prop bug fix in the qualified-teams feature. `DraggableTeamCard` always renders the third-place checkbox for position-3 teams when the tournament isn't locked, but never checks the `allowsThirdPlace` flag. The fix threads `allowsThirdPlace` into the card and adds it to the render condition so the checkbox is fully hidden (not just disabled) when third-place qualification is not configured.
