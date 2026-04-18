---
name: ticket-creator
description: Ticket creation skill — invoke when user wants to brainstorm a new feature or problem. Interactive loop that clarifies requirements at feature/user level (never implementation), creates a properly-formed GitHub issue with Priority/Effort/Category fields set via gh cli.
---

# Ticket Creator (Interactive Story Definition Skill)

## When to Invoke

- User says "let's create a ticket" / "I want to build X" / "new story idea" / "brainstorm a feature"
- Proactively when user describes a problem that doesn't have a GitHub issue yet

---

## Critical Rule: Feature Level Only

**Tickets MUST describe what users experience — never what code does.**

| ❌ Implementation level (NEVER in ticket) | ✅ Feature level (correct) |
|------------------------------------------|--------------------------|
| "Modify `getTournamentLeaderboard` server action to return rank delta" | "Leaderboard shows each player's rank change since the last round" |
| "Add `rank_change` column to `tournament_score_history` table" | "Players can see at a glance whether their rank went up or down" |
| "Update `LeaderboardRow` component to render `RankChangeBadge`" | "Rank changes are highlighted with a directional indicator" |

Use your internal reasoning context to inform scope and effort, but its code-level details **never appear in the ticket body**.

---

## Step 1: Capture the Raw Idea

Use `ask_user` tool to gather:

- What can the user do that they can't do today? (the behavior gap)
- Who is the primary user of this feature?
- Is there existing behavior this replaces or extends?

Keep it conversational — 2–3 questions max per round.

---

## Step 2: Internal Context Feasibility

Once you can identify affected domains, use your internal context and tools like `mcp_sourcegraph_sg_nls_search` or `grep_search` to understand feasibility and scope. 
**This output is for your reasoning only — do not paste it into the ticket.**

Use the analysis to:
- Validate the feature is technically feasible
- Calibrate the Effort estimate (XS/S/M/L/XL)
- Check whether the Acceptance Criteria scope is realistic
- Inform the Out of Scope list (what would be technically expensive to add in v1)

---

## Step 3: Refine Scope Interactively

Iterate with the user via `ask_user` on:

- **Acceptance Criteria** — each criterion: user-observable, testable, zero code references
- **Out of Scope** — explicit list; prevents scope creep
- **Open Questions** — unresolved product decisions (not technical questions)

---

## Step 4: UI/UX Design (If Feature Has UI Changes)

If the story involves new or changed UI, ask:

> "This feature has UI changes. Do you want to create a mockup first?"

If yes → pause ticket creation and invoke the `ui-ux-designer` skill. 
The resulting mockup file path is included in the issue body.

---
## Step 5: Finalize Ticket Fields

With user, confirm:

- **Title**: `[Type] Short description` (e.g., `[Story] Friend group join requests`)
- **Priority**: Urgent / High / Medium / Low
- **Effort**: XS / S / M / L / XL (calibrated from your analysis — never stated explicitly)
- **Category**: ask user or infer from domain (Social, Game Predictions, Backoffice, i18n, etc.)
- **Labels**: `story` or `bug` or `epic`

---

## Step 6: Review with User (Mandatory)

**Before calling any tool to create the issue, you MUST present the full final ticket content to the user for review.**

1.  Draft the full issue body (Objective, Background, Acceptance Criteria, etc.)
2.  Show it to the user in the chat.
3.  Explicitly ask: "Is this story ready to be created in GitHub?"
4.  **ONLY** proceed to Step 7 if the user gives explicit confirmation.

---

## Step 7: Create GitHub Issue


Use the `run_shell_command` tool to execute:

```bash
gh issue create \
  --title "${TITLE}" \
  --body "## Objective
[One sentence: what users gain. No code references.]

## Problem / Background
[Why this matters. User impact. No code references.]

## Acceptance Criteria
- [ ] [User can do X]
- [ ] [System shows Y when Z happens]
- [ ] [Feature works correctly in both EN and ES]

## Out of Scope
- [explicit deferral 1]

## Open Questions
- [if any — product decisions only, no technical questions]

## Mockup
[path to mockup file if created — omit this section if no mockup]" \
  --label "story"
```

Then set GitHub Projects fields using the helper script:

```bash
./scripts/github-projects-helper story set-fields ${ISSUE_NUMBER} \
  --project 1 \
  --priority "${PRIORITY}" \
  --effort "${EFFORT}" \
  --category "${CATEGORY}"
```

*Note: The helper script will match values to available project options.*

---

## Step 8: Confirm with User (Finish Line)

1. Show the final issue URL.
2. Ask if any fields need adjustment.
3. **STOP.** Once the ticket is created and the user is informed, your task is complete. Do not initiate implementation or planning unless explicitly asked in a new turn. Fulfilling the Inquiry (creating the ticket) is the finality of this skill.