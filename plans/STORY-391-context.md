# Story 391 Context

## Story Metadata

- **STORY_NUMBER**: 391
- **STORY_TITLE**: [Story] Prediction Entry Point & 'Open for Edit' Flow
- **WORKTREE_PATH**: /Users/gvinokur/Personal/qatar-prode-story-391
- **MAIN_WORKTREE**: /Users/gvinokur/Personal/qatar-prode
- **BRANCH_NAME**: feature/story-391
- **GITHUB_ISSUE**: https://github.com/gvinokur/qatar-prode/issues/391

## Current Phase

Plan created. Waiting for user review and approval before implementation.

## Plan File

`plans/STORY-391-plan.md`

## Summary

Story #391 is the integration layer connecting hub widget CTAs and the urgency popover to the Games page guided edit flow. All external CTAs should land the user with the most relevant game already open for editing.

Key changes:
- Add `EDIT_NEXT_TOKEN = 'next'` to `prediction-constants.ts`
- Extend `UnifiedGamesPageClient` Effect 1 to handle `?edit=next` token
- Update Hub carousel "View All" button href to include current game ID
- Update Hub info widget CTA href to include `?edit=next` when logged in
- Fix `urgency-accordion-group.tsx` navigation bug (was routing to hub page instead of games page)

## Files to be Modified

- `app/utils/prediction-constants.ts`
- `app/components/unified-games-page-client.tsx`
- `app/components/tournament-hub/games-active-client.tsx`
- `app/components/tournament-hub/games-info-widget.tsx`
- `app/components/urgency-accordion-group.tsx`

## Test Files

- `app/components/__tests__/urgency-accordion-group-navigation.test.tsx` (update existing)
- New tests for `unified-games-page-client`, `games-active-client`, `games-info-widget`

## Implementation Waves

- Wave 1: Add `EDIT_NEXT_TOKEN` constant + fix urgency-accordion-group navigation bug
- Wave 2: Extend UnifiedGamesPageClient + update hub CTAs
- Wave 3: Tests
