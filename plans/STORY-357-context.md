# Story #357 Context File

## Story Metadata

- **STORY_NUMBER**: 357
- **STORY_TITLE**: [Story 3] Dashboard: Status Widgets (Qualified/Awards)
- **BRANCH_NAME**: feature/story-357
- **WORKTREE_PATH**: /Users/gvinokur/Personal/qatar-prode-story-357
- **MAIN_REPO_PATH**: /Users/gvinokur/Personal/qatar-prode
- **PR_NUMBER**: (to be filled after PR creation)
- **PR_URL**: (to be filled after PR creation)
- **STATUS**: Planning

## GitHub Issue

- **Issue**: #357
- **URL**: https://github.com/gvinokur/qatar-prode/issues/357

## Plan Document

- **Plan file**: /Users/gvinokur/Personal/qatar-prode-story-357/plans/STORY-357-plan.md

## Summary

Create `QualifiedTeamsWidget` and `AwardsWidget` — pre-tournament-only hub cards that mirror the `GamesInfoWidget` structure but add a severity-coloured deadline box (48h/24h/2h thresholds). Remove the placeholder "Standings" and "Groups" `DashboardCard` lorem ipsum entries from the hub page.

## Key Files

### New Files
- `app/components/tournament-hub/qualified-teams-widget.tsx`
- `app/components/tournament-hub/awards-widget.tsx`
- `app/components/tournament-hub/__tests__/qualified-teams-widget.test.tsx`
- `app/components/tournament-hub/__tests__/awards-widget.test.tsx`

### Modified Files
- `app/utils/urgency-utils.ts`
- `app/[locale]/tournaments/[id]/page.tsx`
- `locales/en/hub.json`
- `locales/es/hub.json`
- `docs/code-structure/components/components-tournament-hub.md`

## Phase History

- **Planning**: Complete — plan reviewed and approved
