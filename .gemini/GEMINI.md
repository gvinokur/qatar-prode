# Qatar Prode — Project DNA

This file is auto-loaded by the Gemini CLI on every invocation. Facts only — no procedural instructions.

---

## Stack
- Next.js 15.3, App Router, TypeScript strict
- PostgreSQL + Kysely ORM (`@vercel/postgres-kysely`) — no Prisma
- NextAuth.js v5, Material-UI v7 with Emotion
- next-intl (locales: `en`, `es` — Argentine Spanish: use **vos** conjugation, Argentine vocabulary)
- Vitest 3.2 (≥60% overall coverage, ≥80% new code)
- Vercel deployment + SonarCloud quality gates (0 new issues of any severity)

---

## Repository Layout

```
app/
  actions/        (29 files — Server Actions: auth + localization + repo calls)
  db/             (26 files — Kysely repositories: pure data access only)
  components/     (74 entries — domain-organized React components)
  utils/          (38 entries — pure utility functions)
  [locale]/       (Next.js locale routing: en, es)
  api/            (route handlers: auth, uploads, webhooks)

plans/            (STORY-N-plan.md planning documents)
migrations/       (PostgreSQL migration SQL files)
data/             (tournament seed JSON, organized by tournament)
locales/          (translation files: locales/en/*.json, locales/es/*.json)
docs/
  code-structure/ (layer map: db.md, actions.md, utils.md, pages.md, components-*.md)
  claude/         (workflow docs: architecture.md, patterns.md, worktrees.md, etc.)
.claude/
  skills/         (native Claude skills: architect, implementer, code-reviewer, etc.)
.ai/
  agents/         (Gemini agent prompt templates: architect, librarian, explainer, etc.)
mockups/          (standalone HTML mockups using React + MUI CDN)
scripts/          (helper scripts: github-projects-helper, etc.)
CODE-STRUCTURE.md (index + call graph — the living codebase map)
```

---

## Five Critical Architectural Rules

1. **Server Components** import repositories directly. **Client Components** receive props only — never import repos.
2. **Repositories** return raw data. **Server Actions** apply localization via `applyLocalization()`.
3. **ALWAYS** use `testFactories.*` from `__tests__/db/test-factories.ts` — **NEVER** create manual mock data objects.
4. **Locale params NEVER** go in repository function signatures.
5. **Update `CODE-STRUCTURE.md`** in the **same commit** as every source change.

---

## Architecture Call Graph

```
Page (Server Component)
  → Server Action (auth + localization + business logic)
    → Repository (Kysely query, pure data access)
      → Database (PostgreSQL)
```

Never skip layers. Never import repositories in Client Components.

---

## Quality Gates

| Gate | Threshold |
|------|-----------|
| New SonarCloud issues | 0 (any severity) |
| Coverage on new code | ≥80% |
| Overall coverage | ≥60% |
| Security rating | A |
| Maintainability | B or higher |
| Duplicated code | <5% |

---

## i18n Pattern

- Locale routing via next-intl: all pages live under `app/[locale]/`
- Namespaces registered in `i18n.config.ts`; translation files in `locales/en/` and `locales/es/`
- Database-driven i18n: tables have `name_i18n` columns; repositories return raw, actions localize
- **Argentine Spanish** — use vos conjugation (`vos tenés`, not `tú tienes`), Argentine colloquialisms

---

## Testing Conventions

- Framework: Vitest 3.2 + `@testing-library/react`
- **Mock data**: always `testFactories.*` (never manual objects)
- **DB mocking**: always `createMockSelectQuery()` / `createMockInsertQuery()` from `mock-helpers.ts`
- **Component rendering**: always `renderWithTheme()` / `renderWithProviders()` from test utilities
- **Coverage approach**: identify uncovered scenarios by reading lines, write one test per scenario

---

## Workflow Skill Chain

```
new feature idea → /ticket-creator → /ui-ux-designer (if UI)
story ready     → /architect → /plan-reviewer → /implementer → /test-engineer → /code-reviewer → /git-ops
quality review  → /validator (Gemini-powered SonarCloud explanation)
```

---

## Key Domain Areas

| Domain | Components dir | Actions file | Notes |
|--------|---------------|-------------|-------|
| Tournament / Games | `components/tournament/`, `tournament-page/` | `game-actions.ts`, `tournament-actions.ts` | Core prediction flow |
| Friend Groups | `components/friend-groups/` | `prode-group-actions.ts`, `prode-group-join-request-actions.ts` | Social layer |
| Leaderboard / Stats | `components/leaderboard/`, `tournament-stats/` | `stats-actions.ts`, `score-history-actions.ts` | Rankings |
| Qualified Teams | `components/qualified-teams/` | `qualification-actions.ts` | World Cup bracket prediction |
| Auth / Onboarding | `components/auth/`, `onboarding/` | `oauth-actions.ts`, `onboarding-actions.ts`, `otp-actions.ts` | Auth flow |
| Backoffice | `components/backoffice/` | `backoffice-actions.ts` | Admin-only |
