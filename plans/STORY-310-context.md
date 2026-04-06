# Story 310 Context

## Metadata
- **Story Number:** 310
- **Story Title:** [Story] Add location data to tournaments for SportsEvent structured data
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-310
- **Branch:** feature/story-310
- **PR Number:** 311
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/311

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-310-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
This story adds city/country-level location data to tournaments (e.g., "Qatar", "New York") stored in a new `tournament_locations` table. Admins can manage these locations via a new "Locations" tab in the backoffice. This is a prerequisite to story #303 which will use this data to populate the `location` field in the SportsEvent JSON-LD structured data. No JSON-LD changes are in scope for this story.
