# Components — Tournament Hub

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-04-16

---

## Files

### app/components/tournament-hub/tournament-hub-action-center.tsx
Thin Server Component wrapper for the hub's Action Center widget. Calls the server action and delegates rendering to the client carousel.

- **TournamentHubActionCenter({ tournamentId, locale })**: `JSX.Element | null` — [Server] Calls `getActionCenterGames`; returns `null` when `data.tournamentFinished` (last game has kicked off). Otherwise passes result to `ActionCenterCarousel`.
  Calls: getActionCenterGames
  Renders: ActionCenterCarousel

### app/components/tournament-hub/action-center-carousel.tsx
Client Component for the Action Center carousel. Manages card edit state (one card open at a time) and wires FlippableGameCard instances with GuessesContextProvider for inline prediction saving.

- **ActionCenterCarousel({ data, tournamentId, locale })**: `JSX.Element` — [Client] Wraps games in `GuessesContextProvider` (autoSave=true), renders a centered title/subtitle header, then either an empty-state placeholder (mode=empty, with a "Predict all games" link) or a horizontal `ScrollShadowContainer` with one `FlippableGameCard` per game. Tracks `editingGameId` state; exposes `onEditStart`, `onEditEnd`, `onAutoAdvanceNext`, and `onAutoGoPrevious` callbacks to each card. When `data.qtAndAwardsOpen` is true, renders a "More to predict" section below the carousel with Qualified Teams and Awards quick-action cards; cards show an urgency `Chip` (info/warning/error) with countdown text when the prediction lock is within 48h.
  Uses: GuessesContextProvider, ScrollShadowContainer, FlippableGameCard, getUrgencyLevel, formatCountdown, useTranslations
