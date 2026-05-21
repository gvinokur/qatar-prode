# Story 459 Context

## Metadata
- **Story Number:** 459
- **Story Title:** [Story] Add copy-to-clipboard UX to OTP authentication email
- **Worktree Path:** /Users/gvinokur/Personal/qatar-prode/.claude/worktrees/sweet-panini-099f38
- **Branch:** claude/sweet-panini-099f38
- **PR Number:** (fill after PR creation)
- **PR URL:** (fill after PR creation)

## State
- **Current Phase:** planning
- **Plan File:** plans/STORY-459-plan.md
- **Task File:** (fill when implementation starts)

## Quick Summary
Adds copy-to-clipboard UX to the OTP auth email: a "Copy code" link in the email opens a minimal
browser page that auto-copies the 6-digit code to clipboard. Also updates the email subject to
include the OTP code for iOS/Android/Gmail smart autofill detection. New route: /[locale]/otp-copy.
New client component: OtpCopyPage. Modifies generateOTPEmailContent() to accept a copyUrl param.
