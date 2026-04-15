# Components — Tournament Hub

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-04-15

---

## Files

### app/components/tournament-hub/tournament-hub-action-center.tsx
Thin Server Component wrapper for the hub's Action Center widget. Calls the server action and delegates rendering to the client carousel.

- **TournamentHubActionCenter({ tournamentId, locale })**: `JSX.Element` — [Server] Calls `getActionCenterGames` and passes the result to `ActionCenterCarousel`.
  Calls: getActionCenterGames
  Renders: ActionCenterCarousel

### app/components/tournament-hub/action-center-carousel.tsx
Client Component for the Action Center carousel. Manages card edit state (one card open at a time) and wires FlippableGameCard instances with GuessesContextProvider for inline prediction saving.

- **ActionCenterCarousel({ data, tournamentId, locale })**: `JSX.Element` — [Client] Wraps games in `GuessesContextProvider` (autoSave=true), renders a section header with translated title/subtitle, then either an empty-state message (mode=empty) or a horizontal `ScrollShadowContainer` with one `FlippableGameCard` per game. Tracks `editingGameId` state; exposes `onEditStart`, `onEditEnd`, `onAutoAdvanceNext`, and `onAutoGoPrevious` callbacks to each card.
  Uses: GuessesContextProvider, ScrollShadowContainer, FlippableGameCard, useTranslations
