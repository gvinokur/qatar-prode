# Components - Backoffice

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-04-06

---

## Files

### app/components/backoffice/tournament-main-data-tab.tsx
Component for managing a tournament's main data in the backoffice, including name, theme, logos, activity status, third-place rules, Transfermarkt configuration, locations, and playoff rounds.

- **TournamentMainDataTab({ tournamentId, onUpdate })**: `JSX.Element` — [Client] Main tab component for editing tournament details.
  Props:
  - `tournamentId`: `string` — The ID of the tournament being edited.
  - `onUpdate`: `(updatedTournament: Tournament) => void` — Callback fired when the tournament is successfully updated.
  Calls: createOrUpdateTournament, getTournamentById, getPlayoffRounds, getTournamentLocations, getTournamentPermissionData, updateTournamentPermissions
  Renders: I18nFieldEditor, ImagePicker, TournamentPermissionsSelector, PlayoffRoundDialog, TournamentFormSkeleton
