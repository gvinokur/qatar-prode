# Story 418 Context

## Metadata
- **Story Number:** 418
- **Story Title:** [Bug] Mobile nav tabs cut off text on small screens
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/friendly-herschel-226d2f
- **Branch:** claude/friendly-herschel-226d2f
- **PR Number:** 419
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/419

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-418-plan.md

## Quick Summary
The group navigation tabs (HUB, MATCHES, QUALIFIED TEAMS, AWARDS) cut off text on mobile because all four use `variant="fullWidth"` with both icon and label. The fix: on mobile (`xs`), hide the label for unselected tabs via a responsive Box wrapper, so only the selected tab shows its label. Desktop behavior is unchanged. Touches one component file and its test file.
