---
name: ticket-creator
description: Ticket creation skill — invoke when user wants to brainstorm a new feature or problem. Interactive loop that clarifies requirements at feature/user level (never implementation), calls Gemini internally for technical context, optionally invokes /ui-ux-designer for mockups, and creates a properly-formed GitHub issue with Priority/Effort/Category fields set.
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

## Step 2: Delegate to Gemini for Internal Context

Once you can identify affected domains, call Gemini to understand feasibility and scope.
**This output is for your reasoning only — do not paste it into the ticket.**

```bash
PROJECT_ROOT=$(git worktree list --porcelain | head -1 | sed 's/^worktree //')
# KEYWORD: 2-3 words from the feature description, kebab-cased
# e.g., "join-requests" for "Friend group join requests"
TICKET_KEYWORD="[derive from FEATURE_DESCRIPTION]"

gemini --yolo -m gemini-2.5-flash -o json -p "$(cat ${PROJECT_ROOT}/.ai/agents/ticket-creator-agent.md)

---
FEATURE_DESCRIPTION:
${FEATURE_DESCRIPTION}

CODE_STRUCTURE:
$(cat ${PROJECT_ROOT}/CODE-STRUCTURE.md)

RELEVANT_LAYER_FILES:
$(cat ${PROJECT_ROOT}/docs/code-structure/actions.md \
      ${PROJECT_ROOT}/docs/code-structure/db.md)
" > /tmp/gemini-ticket-${TICKET_KEYWORD}-1.json

SESSION_ID=$(jq -r '.session_id' /tmp/gemini-ticket-${TICKET_KEYWORD}-1.json)
GEMINI_ANALYSIS=$(jq -r '.response' /tmp/gemini-ticket-${TICKET_KEYWORD}-1.json)
```

Use the analysis to:
- Validate the feature is technically feasible
- Calibrate the Effort estimate (XS/S/M/L/XL)
- Check whether the Acceptance Criteria scope is realistic
- Inform the Out of Scope list (what would be technically expensive to add in v1)

#### Quality Assessment

Apply the **Quality Assessment Loop** (see `/gemini`). Expected content in `GEMINI_ANALYSIS`:
- Effort Signal (XS/S/M/L/XL with reasoning)
- Capability Gaps (what the codebase lacks to support this feature)
- Technical Risks

If the effort signal is vague (e.g., "Medium, could vary"):
```bash
gemini --yolo -m gemini-2.5-flash --resume-chat ticket-${TICKET_KEYWORD} \
  -p "The effort estimate is not specific enough. Provide XS/S/M/L/XL with reasoning based on the number and complexity of layers that need to change."
```
Maximum 2 follow-up attempts.

---

## Step 3: Refine Scope Interactively

Iterate with the user via AskUserQuestion on:

- **Acceptance Criteria** — each criterion: user-observable, testable, zero code references
- **Out of Scope** — explicit list; prevents scope creep
- **Open Questions** — unresolved product decisions (not technical questions)

Typical cycles: 1–2 rounds.

**Scope refinement path:** Any user feedback during this step — scope additions, removals, changes to acceptance criteria, clarifications on requirements — should go through Gemini via `--resume-chat` rather than being handled by Claude alone. Gemini retains the full feature description and codebase context.

```bash
gemini --yolo -m gemini-2.5-flash --resume-chat ticket-${TICKET_KEYWORD} \
  -p "[The full user feedback, as stated. Examples:
      'Remove the email notification requirement'
      'Change the scope: this should only apply to group admins, not all members'
      'Clarify: by join request, the user means approval is required, not just invites'
      'Add: also cover the case where the group is private']
  How does this affect the effort, capability gaps, and technical risks?"
```

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
