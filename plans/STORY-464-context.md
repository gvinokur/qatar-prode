# Story #464 Context

## Story Metadata
- **STORY_NUMBER**: 464
- **STORY_TITLE**: [Story] Show AI auto-fill button in game card edit mode
- **BRANCH_NAME**: feature/story-464
- **MAIN_WORKTREE**: /Users/gvinokur/Personal/qatar-prode
- **WORKTREE_PATH**: /Users/gvinokur/Personal/qatar-prode-story-464

## Status
- Phase: Planning complete
- Plan file: `plans/STORY-464-plan.md`

## Summary
Wire the AI prediction auto-fill button (sparkle / AutoAwesome icon) into game card edit mode (`GamePredictionEditControls`), positioned below score inputs and above the Boost section. Currently the button only appears in view mode. The handler updates local edit state in `FlippableGameCard` rather than the `GuessesContext`.

## Files to Modify
1. `app/components/flippable-game-card.tsx` — Add `handleAIGenerateInEditMode`, pass to `GamePredictionEditControls`
2. `app/components/game-prediction-edit-controls.tsx` — Add `onAIGenerateClick` prop + render AI button
3. `docs/code-structure/components/components-tournament-games.md` — Update CODE-STRUCTURE entries

## Key Technical Notes
- No new translation keys — reuse `predictions.aiGenerate.tooltipSingle`
- No new cross-layer flows; handler stays in local component state
- `generateAIPrediction` already imported in `GameView` (same file pattern)
- Penalty winner fields set only for playoff games with tied AI prediction
