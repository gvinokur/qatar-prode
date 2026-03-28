---
name: gemini
description: Gemini delegation guide — when and how to call Gemini CLI instead of working in Claude directly. Defines the five agent entry points, standard invocation pattern with portable PROJECT_ROOT resolution, and heuristics for when delegation is appropriate.
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
- To write output to a file: `gemini --yolo -m gemini-2.5-flash -p "..." > ${PROJECT_ROOT}/tmp/output.md`
- To pass images (multimodal): `gemini --yolo -m gemini-2.5-flash -i /path/to/image.png -p "$(cat agent.md) ..."`

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

# Session management — save state after a call
gemini --yolo -m gemini-2.5-flash --save-chat <tag> -p "your prompt here"

# Resume a named session (new prompt, no re-send of original context)
gemini --yolo -m gemini-2.5-flash --resume-chat <tag> -p "follow-up prompt"

# Resume the absolute latest session in the current directory
gemini --yolo -m gemini-2.5-flash --resume -p "follow-up prompt"

# List existing sessions for this project
gemini --list-sessions
```

Sessions are stored at `~/.gemini/tmp/<project_hash>/chats/`, scoped to the project directory.

- Auto-loads `.gemini/GEMINI.md` from the project root on every invocation
- Auth: Google One AI Pro via OAuth (cached after first login)

---

## Session Management

Sessions persist Gemini context between calls so follow-up prompts don't need to re-send large inputs (code files, screenshots, sonar output). Each session is identified by a tag and stored locally, scoped to the project directory.

### Tag Naming Convention

| Use case | Tag format | Example |
|----------|-----------|---------|
| Architect analysis | `story-{N}-architect` | `story-295-architect` |
| Librarian audit | `story-{N}-audit` | `story-295-audit` |
| Sonar explainer | `story-{N}-sonar` | `story-295-sonar` |
| Ticket feasibility | `ticket-{slug}` | `ticket-join-requests` |
| UI/UX design | `story-{N}-ui` or `ui-{slug}` | `story-295-ui` |
| Ad-hoc (direct) | `adhoc-{keyword}` | `adhoc-leaderboard` |

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
- Issue a targeted follow-up using `--resume-chat <tag>` addressing only the gap.
- **Maximum 2 follow-up attempts** per call. After 2 attempts, proceed but surface the gap to the user.

**If the response is fundamentally off-track** (wrong framing, misunderstood the question):
- Do NOT continue the session. Start fresh with a new tag (`--save-chat <new-tag>`) and a better-structured prompt.

Each skill specifies the expected output sections for its agent.

---

## Session Awareness for Direct Invocations

When a user directly asks Claude to use Gemini (not through a specific skill):

1. **Always save the session**: use `--save-chat adhoc-{keyword}` where `{keyword}` is 1–2 words from the request, kebab-cased.
2. **Apply the Quality Assessment Loop** above on every response.
3. **Detect user follow-ups**: if the user's next message signals continuation ("also...", "what about...", "change X", "can you expand on...") → use `--resume` (picks up the latest session) rather than making a fresh call.
4. **Self-initiated follow-ups**: if Claude itself needs clarification or expansion on a prior Gemini response → use `--resume-chat adhoc-{keyword}` proactively. Do not make a fresh call for the same analysis.
