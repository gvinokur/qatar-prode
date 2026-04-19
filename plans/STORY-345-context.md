# Story 345 Context

## Metadata
- **Story Number:** 345
- **Story Title:** [Story] Allow non-admins to share group invite link
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-345
- **Branch:** feature/story-345
- **PR Number:** 346
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/346

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-345-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Allows all group members (not just owners/admins) to see and use the "Invite More" button in friend group pages. Non-admin members see a restricted dialog with only Link and Flier tabs; the Email tab is hidden for them (email invitations remain admin-only). Changes touch InviteFriendsDialog (new hideEmailTab prop), InviteFriendsDialogButton (prop passthrough), and both group page variants (non-tournament and tournament-scoped).
