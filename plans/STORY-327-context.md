# Story 327 Context

## Metadata
- **Story Number:** 327
- **Story Title:** [Story] Group email invitations and CSV import
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode-story-327
- **Branch:** feature/story-327
- **PR Number:** 330
- **PR URL:** https://github.com/gvinokur/qatar-prode/pull/330

## State
- **Current Phase:** implementing
- **Plan File:** plans/STORY-327-plan.md

## Quick Summary
Implements the Email tab in the existing InviteFriendsDialog component, allowing group admins to invite multiple users by email via manual entry or CSV upload. Adds a new server action sendGroupEmailInvitations (with 50-recipient limit and admin auth check), a new email template generateGroupInvitationEmail, and a new EmailInvitationsTab client component. Includes localized EN/ES email sending.
