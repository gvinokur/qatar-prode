---
name: gemini
description: Gemini delegation guide — when and how to call Gemini CLI instead of working in Claude directly. Defines the five agent entry points, standard invocation pattern with portable PROJECT_ROOT resolution, and heuristics for when delegation is appropriate.
context: fork
agent: general-purpose
---

# ⚡ Invocation: Always Forked

**This skill has `context: fork` — it must NEVER be loaded into the main conversation via `Skill({ skill: "gemini" })`.**

Callers should spawn this skill as an Agent:
```typescript
Agent({
  subagent_type: "general-purpose",
  description: "Gemini: [agent name] analysis",
  prompt: `Read and follow /Users/gvinokur/Personal/qatar-prode/.claude/skills/gemini/SKILL.md

Then invoke the [agent-name] agent for this story:
- Context file: ${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-context.md
- Agent file: /Users/gvinokur/Personal/qatar-prode/.ai/agents/[agent].md
- Output file: /tmp/gemini-story-${STORY_NUMBER}-[agent]-1.json

Return: A 3-5 sentence summary of the Gemini output. Do NOT return the raw JSON.`
})
```

**Why:** Gemini calls generate large JSON responses (50-200 lines) plus this skill's guidance content. Running in a forked agent means the main conversation only receives a short summary, not the full raw output.

**IMPORTANT for callers:** The Agent prompt must specify the output file and instruct the agent to return only a summary, not the full JSON content.

---

# Gemini (Delegation Guide)

## When to Delegate to Gemini

Delegate when **ANY** of these conditions apply:

| Trigger | Threshold | Example |
|---------|-----------|---------|
| File scope | >30 files to analyze | Codebase-wide pattern audit |
| Non-code creation | Always | Documentation audit, report explanation |
| Multimodal | Images involved | UI screenshot analysis for mockups |
| Token pressure | Context would exceed ~80K tokens | Reading all changed files at once |
| Parallel sub-questions | 3+ independent analysis questions | Architecture review across layers |

## When NOT to Delegate

- Single-file reads/writes → use Read/Write tools directly
- Git operations → use Bash tool or a Bash subagent
- Tasks requiring Claude's native tools (TaskCreate, gh CLI, Edit, etc.)
- Simple code changes to 1–3 files
- Interactive Q&A with the user → Claude handles this directly

---

## Standard Invocation Pattern

```bash
# Always resolve PROJECT_ROOT first — portable across any developer's clone
PROJECT_ROOT=$(git worktree list --porcelain | head -1 | sed 's/^worktree //')

gemini --yolo -m gemini-2.5-flash -p "$(cat ${PROJECT_ROOT}/.ai/agents/[agent-name].md)

---
[INPUT_VARIABLE_1]:
[value]

[INPUT_VARIABLE_2]:
[value]
"
```

**Rules:**
- Always resolve `PROJECT_ROOT` dynamically — never hardcode user-specific paths
- Separate the agent prompt from inputs with `---` on its own line
- Always use `-o json` so the session_id is captured for follow-up calls (see Session Management below)
- To pass images (multimodal): `gemini --yolo -m gemini-2.5-flash -i /path/to/image.png -o json -p "$(cat agent.md) ..."`

> **Note:** When invoked as a forked Agent (the required mode), write output to the specified file AND return a 3-5 sentence summary as the agent's result. The caller reads the summary — they do NOT need the raw JSON.

---

## The Five Agents

| Agent file | Invoked by | Purpose |
|-----------|-----------|---------|
| `.ai/agents/architect-agent.md` | `/architect` Step 3 | Story analysis + file impact map + Mid-Level Design scaffold |
| `.ai/agents/librarian-agent.md` | `/code-reviewer` Section 7.5 | CODE-STRUCTURE layer file accuracy audit |
| `.ai/agents/explainer-agent.md` | `/validator` Step 2 | SonarCloud issue explanation → `tmp/sonar-explanation.md` |
| `.ai/agents/ticket-creator-agent.md` | `/ticket-creator` Step 2 | Technical feasibility analysis (internal context only) |
| `.ai/agents/ui-ux-designer-agent.md` | `/ui-ux-designer` Step 2 | MUI component spec from screenshots → JSX scaffold |

---

## Gemini CLI Reference

```bash
# Install
npm install -g @google/gemini-cli

# Non-interactive prompt
gemini --yolo -m gemini-2.5-flash -p "your prompt here"

# With image (multimodal)
gemini --yolo -m gemini-2.5-flash -i /path/to/screenshot.png -p "your prompt here"

# Write output to file
gemini --yolo -m gemini-2.5-flash -p "your prompt" > output.md

# First-time auth (Google One AI Pro — interactive)
gemini

# Call with JSON output — always use this form to capture session_id
gemini --yolo -m gemini-2.5-flash -o json -p "your prompt here" > /tmp/gemini-${TAG}-1.json
# Strip MCP warning prefix that Gemini may prepend before the JSON (e.g. "MCP issues detected...{")
sed -i 's/^[^{]*//' /tmp/gemini-${TAG}-1.json

# Extract response and session_id
SESSION_ID=$(jq -r '.session_id' /tmp/gemini-${TAG}-1.json)
RESPONSE=$(jq -r '.response' /tmp/gemini-${TAG}-1.json)

# Resume a specific session by session_id (no re-send of original context)
gemini --yolo -m gemini-2.5-flash --resume-chat ${SESSION_ID} -o json \
  -p "follow-up prompt" > /tmp/gemini-${TAG}-2.json
sed -i 's/^[^{]*//' /tmp/gemini-${TAG}-2.json
RESPONSE=$(jq -r '.response' /tmp/gemini-${TAG}-2.json)
```

- Auto-loads `.gemini/GEMINI.md` from the project root on every invocation
- Auth: Google One AI Pro via OAuth (cached after first login)

---

## Session Management

Sessions persist Gemini context between calls so follow-up prompts don't need to re-send large inputs (code files, screenshots, sonar output). Every call uses `-o json` to capture the `session_id` returned by Gemini, which is then used to resume that exact session — safe for parallel agent workflows since each session has a unique UUID.

### Pattern

```bash
# ── Initial call ──────────────────────────────────────────────────────────
gemini --yolo -m gemini-2.5-flash -o json -p "$(cat agent.md)
---
INPUTS...
" > /tmp/gemini-${TAG}-1.json
# Strip MCP warning prefix (e.g. "MCP issues detected...{") before parsing JSON
sed -i 's/^[^{]*//' /tmp/gemini-${TAG}-1.json

# Extract — discard stats, keep only what's needed
SESSION_ID=$(jq -r '.session_id' /tmp/gemini-${TAG}-1.json)
RESPONSE=$(jq -r '.response'    /tmp/gemini-${TAG}-1.json)

# ── Resume (Quality Assessment follow-up, iteration, etc.) ────────────────
# Always read session_id from the first response file for this tag
SESSION_ID=$(jq -r '.session_id' /tmp/gemini-${TAG}-1.json)
gemini --yolo -m gemini-2.5-flash --resume-chat ${SESSION_ID} -o json \
  -p "follow-up prompt" > /tmp/gemini-${TAG}-2.json
sed -i 's/^[^{]*//' /tmp/gemini-${TAG}-2.json
RESPONSE=$(jq -r '.response' /tmp/gemini-${TAG}-2.json)
```

### File Naming Convention

`/tmp/gemini-{tag}-{n}.json` where `{n}` increments per call in the same session.

| Use case | TAG value | Example file |
|----------|-----------|--------------|
| Architect analysis | `story-${STORY_NUMBER}-architect` | `/tmp/gemini-story-295-architect-1.json` |
| Librarian audit | `story-${STORY_NUMBER}-audit` | `/tmp/gemini-story-295-audit-1.json` |
| Sonar explainer | `story-${STORY_NUMBER}-sonar` | `/tmp/gemini-story-295-sonar-1.json` |
| Ticket feasibility | `ticket-${TICKET_KEYWORD}` | `/tmp/gemini-ticket-join-requests-1.json` |
| UI/UX design | `${UI_TAG}` | `/tmp/gemini-story-295-ui-1.json` |
| Ad-hoc (direct) | `adhoc-${keyword}` | `/tmp/gemini-adhoc-leaderboard-1.json` |

The session_id is always read from the `-1.json` file (it remains consistent across all turns in a conversation).

---

## Required Permission

`.claude/settings.local.json` must include `"Bash(*)"` in the allow list.
This is already configured — no action needed.

## Model & Flags

Always use `gemini --yolo -m gemini-2.5-flash`:
- `--yolo` — auto-approves all tool calls (prevents hang waiting for file-read approval)
- `-m gemini-2.5-flash` — stable model with capacity; default `gemini-3-flash-preview` hits 429 on large prompts

---

## Quality Assessment Loop

**Apply after EVERY Gemini call** — whether ad-hoc or skill-driven. Before acting on any response, run these 3 checks:

1. **COMPLETENESS** — are all expected output sections present? (Each skill specifies its required sections.)
2. **SPECIFICITY** — are answers concrete and actionable, not vague?
3. **COHERENCE** — does the response align with what Claude knows about the codebase from prior research?

**If any check fails:**
- Issue a targeted follow-up using `--resume-chat ${SESSION_ID}` addressing only the gap (read SESSION_ID from `/tmp/gemini-${TAG}-1.json`).
- **Maximum 2 follow-up attempts** per call. After 2 attempts, proceed but surface the gap to the user.

**If the response is fundamentally off-track** (wrong framing, misunderstood the question):
- Do NOT continue the session. Start a fresh call with a new TAG (new `/tmp/gemini-${TAG}-v2-1.json`) and a better-structured prompt.

Each skill specifies the expected output sections for its agent.

---

## Session Awareness for Direct Invocations

When a user directly asks Claude to use Gemini (not through a specific skill):

1. **Always use `-o json`**: set TAG to `adhoc-{keyword}` (1–2 words from the request, kebab-cased), write to `/tmp/gemini-adhoc-{keyword}-1.json`, extract `SESSION_ID` and `RESPONSE` with `jq`.
2. **Apply the Quality Assessment Loop** above on every response.
3. **Detect user follow-ups**: if the user's next message signals continuation ("also...", "what about...", "change X", "can you expand on...") → use `--resume-chat ${SESSION_ID}` (read from `/tmp/gemini-adhoc-{keyword}-1.json`) rather than making a fresh call.
4. **Self-initiated follow-ups**: if Claude itself needs clarification or expansion on a prior Gemini response → use `--resume-chat ${SESSION_ID}` proactively. Do not make a fresh call for the same analysis.
