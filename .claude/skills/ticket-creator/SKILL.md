---
name: ticket-creator
description: Ticket creation skill — invoke when user wants to brainstorm a new feature or problem. Interactive loop that clarifies requirements at feature/user level (never implementation), optionally invokes /ui-ux-designer for mockups, and creates a properly-formed GitHub issue with Priority/Effort/Category fields set.
context: inline
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

The Gemini feasibility analysis is Claude's **internal reasoning context** — it informs scope and effort, but its code-level details **never appear in the ticket body**.

---

## Step 1: Capture the Raw Idea

Use AskUserQuestion to gather:

- What can the user do that they can't do today? (the behavior gap)
- Who is the primary user of this feature?
- Is there existing behavior this replaces or extends?

Keep it conversational — 2–3 questions max per round.

---

## Step 2: Assess Technical Feasibility

Based on the feature description and your understanding of the codebase (from Step 1 context), assess:
- Is the feature technically feasible given the current stack?
- Which layers would be affected (DB, actions, components, pages)?
- What's the rough Effort estimate (XS/S/M/L/XL)?
- What should be explicitly out of scope for v1?

Use Glob/Grep to spot-check relevant areas of the codebase if needed to calibrate your effort estimate.

---

## Step 3: Refine Scope Interactively

Iterate with the user via AskUserQuestion on:

- **Acceptance Criteria** — each criterion: user-observable, testable, zero code references
- **Out of Scope** — explicit list; prevents scope creep
- **Open Questions** — unresolved product decisions (not technical questions)

Typical cycles: 1–2 rounds.

---

## Step 4: UI/UX Design (If Feature Has UI Changes)

If the story involves new or changed UI, ask:

> "This feature has UI changes. Do you want to create a mockup first?"

If yes → invoke `/ui-ux-designer` with the feature description and any reference images.
The resulting mockup file path is included in the issue body.

---

## Step 5: Finalize Ticket Fields

With user, confirm:

- **Title**: `[Type] Short description` (e.g., `[Story] Friend group join requests`)
- **Priority**: Urgent / High / Medium / Low
- **Effort**: XS / S / M / L / XL (calibrated from Gemini analysis — never stated explicitly)
- **Category**: ask user or infer from domain (Social, Game Predictions, Backoffice, i18n, etc.)
- **Labels**: `story` or `bug` or `epic`

---

## Step 6: Create GitHub Issue

```bash
gh issue create \
  --title "${TITLE}" \
  --body "$(cat <<'EOF'
## Objective
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
[path to mockup file if created — omit this section if no mockup]
EOF
)" \
  --label "story"
```

Then set GitHub Projects fields:

```bash
./scripts/github-projects-helper story set-fields ${ISSUE_NUMBER} \
  --priority "${PRIORITY}" \
  --effort "${EFFORT}" \
  --category "${CATEGORY}"
```

---

## Step 7: Confirm with User

Show the issue URL. Ask if any fields need adjustment.

---

## Notes

- Never create the issue without user confirming the draft in Step 5
- Acceptance Criteria must be understandable by a non-developer
- Priority/Effort/Category are **MANDATORY** — never skip (CLAUDE.md Critical Rule 10)
- If effort is hard to gauge, err toward larger (L vs M) — the Gemini analysis informs this
- The ticket body should be good enough to hand directly to `/architect` with no further context
