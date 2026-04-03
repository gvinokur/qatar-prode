# Components: Backoffice

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-03-28

---

## Files

### app/components/backoffice/backoffice-tabs.tsx
Reusable tabbed interface with URL synchronization. [Client] tab management with routing.
- **BackofficeTabs({ tabs, tabIdParam }: Props)**: `React.ReactNode` — [Client] Manages tab selection with URL parameters and status indicators (dev mode, active/inactive).
  Uses: useSearchParams, useRouter, useMediaQuery, useMemo, useCallback, useEffect
  Renders: Tabs, Tab, TabPanel

### app/components/backoffice/tournament-permissions-selector.tsx
Multi-select for users with dev tournament access. [Client] autocomplete for permission management.
- **TournamentPermissionsSelector({ allUsers, selectedUserIds, onChange, disabled }: Props)**: `JSX.Element` — [Client] Allows selecting which users can access development tournaments in production.
  Renders: Autocomplete, TextField, Chip, Box, Typography

### app/components/backoffice/groups-backoffice-tab.tsx
Tab container for group and playoff management. [Client] data loading and tab orchestration.
- **GroupsTab({ tournamentId }: Props)**: `JSX.Element` — [Client] Fetches group data and renders tabs for each group plus playoffs.
  Calls: getGroupDataWithGamesAndTeams
  Renders: GroupBackoffice, PlayoffTab, BackofficeTabs

### app/components/backoffice/tournament-scoring-config-tab.tsx
Scoring points configuration interface. [Client] form for tournament scoring setup.
- **TournamentScoringConfigTab({ tournamentId }: Props)**: `JSX.Element` — [Client] Configures points for game predictions, awards, and boost multipliers with recommended values.
  Calls: getTournamentScoringConfigAction, updateTournamentScoringConfigAction, getRecommendedScoringValues
  Renders: TextField, Button, Card, Grid, Alert, Chip

### app/components/backoffice/tournament-third-place-rules-tab.tsx
JSON-based configuration for third-place team assignments. [Client] CRUD interface for third-place rules.
- **TournamentThirdPlaceRulesTab({ tournamentId }: TournamentThirdPlaceRulesTabProps)**: `React.FC<TournamentThirdPlaceRulesTabProps>` — [Client] Manages JSON rules mapping bracket positions to group letters for third-place qualification.
  Calls: getThirdPlaceRulesForTournament, upsertThirdPlaceRuleAction, deleteThirdPlaceRuleAction
  Renders: Dialog, TextField, List, ListItem, Card, Alert

### app/components/backoffice/backoffice-game-result-edit-controls.tsx
Score input form for game results with penalty handling. [Client] form controls for editing game scores.
- **BackofficeGameResultEditControls({ homeTeamName, awayTeamName, isPlayoffGame, homeScore, awayScore, homePenaltyScore, awayPenaltyScore, onHomeScoreChange, onAwayScoreChange, onHomePenaltyScoreChange, onAwayPenaltyScoreChange, loading, error, onSave, onCancel, homeScoreInputRef, awayScoreInputRef }: BackofficeGameResultEditControlsProps)**: `JSX.Element` — [Client] Score input fields with conditional penalty shootout section for playoff games.
  Renders: TextField, Typography, Button, Grid

### app/components/backoffice/bulk-actions-menu.tsx
Menu with auto-fill and clear scores bulk operations. [Client] action menu with confirmations.
- **BulkActionsMenu({ groupId, playoffRoundId, sectionName, onComplete }: BulkActionsMenuProps)**: `JSX.Element` — [Client] Provides bulk operations (auto-fill, clear scores) with confirmation dialogs.
  Calls: autoFillGameScores, clearGameScores
  Renders: Button, Menu, MenuItem, ConfirmDialog, Snackbar, Alert

### app/components/backoffice/notification-sender.tsx
Admin form for sending push notifications to users. [Client] notification dispatch interface.
- **NotificationSender()**: `JSX.Element` — [Client] Form for sending push notifications to all users or specific user by ID.
  Calls: sendNotification
  Renders: TextField, Button, Checkbox, FormControlLabel, Paper, Snackbar, Alert

### app/components/backoffice/awards-tab.tsx
Individual awards assignment interface. [Client] autocomplete interface for awards.
- **BackofficeAwardsTab({ tournamentId }: Props)**: `JSX.Element` — [Client] Allows admin to manually assign individual award winners (best player, top goalscorer, etc).
  Calls: findDataForAwards, updateTournamentAwards
  Uses: useTranslations, useLocale, useEffect, useState
  Renders: Autocomplete, Card, Grid, Typography, Button

### app/components/backoffice/i18n-field-editor.tsx
Component for editing i18n JSONB fields with English and Spanish inputs. Reusable editor for localized text.
- **I18nFieldEditor({ label, value, onChange, originalValue, required, helperText, disabled }: I18nFieldEditorProps)**: `JSX.Element` — Dual-language input editor for localized text fields (English and Spanish).
  Renders: TextField, Typography, Grid, Alert

### app/components/backoffice/tournament-main-data-tab.tsx
Main tournament configuration form with colors, logos, playoff rounds. [Client] comprehensive tournament setup.
- **TournamentMainDataTab({ tournamentId, onUpdate }: Props)**: `JSX.Element` — [Client] Configures tournament name, theme colors, logo, dev mode, playoff rounds, third-place qualification settings, and Transfermarkt URL template (Story #306).
  Calls: getTournamentById, createOrUpdateTournament, getPlayoffRounds, getTournamentPermissionData, updateTournamentPermissions
  Uses: useTranslations, useLocale, useRouter, useCallback, useEffect, useState
  Renders: MuiColorInput, ImagePicker, TextField, FormControlLabel, Switch, PlayoffRoundDialog, TournamentPermissionsSelector, Button, Paper, Alert

### app/components/backoffice/tournament-game-manager-tab.tsx
Table for managing all tournament games with create/edit/delete. [Client] game CRUD interface.
- **TournamentGameManager({ tournamentId }: TournamentGameManagerProps)**: `React.FC<TournamentGameManagerProps>` — [Client] Displays games in table with edit/delete actions and dialog for create/edit.
  Calls: getGamesInTournament, getTeamsMap, getCompleteTournamentGroups, getPlayoffRounds
  Uses: useTranslations, useCallback, useEffect, useState
  Renders: Table, GameDialog, Dialog, Button, Chip, Tooltip, IconButton, Paper

### app/components/backoffice/backoffice-flippable-game-card.tsx
Flippable card showing game or edit form with 3D animation. [Client] interactive game card with flip animation.
- **BackofficeFlippableGameCard({ game, teamsMap, isPlayoffs, onSave, onPublishToggle }: BackofficeFlippableGameCardProps)**: `JSX.Element` — [Client] Shows game view on front, edit controls on back with smooth 3D flip animation.
  Uses: useTheme, useMediaQuery, useReducedMotion, useRef, useEffect, useState
  Renders: CompactGameViewCard, BackofficeGameResultEditControls, Card, Box

### app/components/backoffice/users-tab.tsx
Admin user list with search, pagination, and ad-free toggle. [Client] self-fetching via Server Action.
- **UsersTab()**: `JSX.Element` — [Client] Paginated, searchable table of all users for backoffice. No props — fetches via `getUsersPaginated`. Columns: Display Name, Email, Login Method(s), Role, Verified, Ad-Free (Switch with optimistic update, reverts on error).
  Calls: getUsersPaginated, toggleUserAdFreeAction
  Uses: useState, useEffect
  Renders: TextField (search), Table, TablePagination, Switch, Chip, CheckIcon, CloseIcon, CircularProgress

### app/components/backoffice/PlayersTab.tsx
Player management with Transfermarkt import. [Client] import interface and player list.
- **PlayersTab({ tournamentId, transfermarktUrlTemplate }: PlayersTabProps)**: `JSX.Element` — [Client] Displays teams with player lists and Transfermarkt import dialog. Pre-fills team's stored Transfermarkt ID on modal open; persists it after a successful import (Story #306).
  Calls: getPlayersInTournament, getTransfermarktPlayerData, createTournamentTeamPlayers, deleteTournamentTeamPlayers, saveTeamTransfermarktId
  Uses: useCallback, useEffect, useState
  Renders: Accordion, Dialog, TextField, Checkbox, Table, Button, Alert

### app/components/backoffice/tournament-teams-manager-tab.tsx
Grid of tournament teams with edit action. [Client] team management with card display.
- **TournamentTeamsManagerTab({ tournamentId }: TournamentTeamsManagerProps)**: `JSX.Element` — [Client] Displays teams in grid cards with logos and edit option.
  Calls: getTeamsMap
  Uses: useEffect, useState
  Renders: Card, CardMedia, Grid, Button, IconButton, Tooltip, Alert, TeamDialog

### app/components/backoffice/tournament-groups-manager-tab.tsx
Grid of groups with edit action. [Client] group management interface.
- **TournamentGroups({ tournamentId }: TournamentGroupsProps)**: `React.FC<TournamentGroupsProps>` — [Client] Displays tournament groups as cards with team lists and edit buttons.
  Calls: getCompleteTournamentGroups, getTeamsMap
  Renders: GroupDialog, Paper, Grid, List, Typography, Button, IconButton

### app/components/backoffice/group-backoffice-tab.tsx
Group-specific backoffice with games, standings, and conduct score editing. [Client] group data management.
- **GroupBackoffice({ group, tournamentId }: Props)**: `JSX.Element` — [Client] Manages games, team standings, and conduct scores for a specific group.
  Calls: getCompleteGroupData, saveGameResults, calculateAndSavePlayoffGamesForTournament, saveGamesData, calculateAndStoreGroupPosition, calculateGameScores, calculateAndStoreQualifiedTeamsScores, updateGroupTeamConductScores
  Uses: useLocale, useEffect, useState, useMemo
  Renders: BackofficeFlippableGameCard, BulkActionsMenu, TeamStandingsCards, TeamStatsEditDialog, Button, Grid, Paper, Snackbar, Alert

### app/components/backoffice/playoff-tab.tsx
Playoff games organized by round with game editing and team updates. [Client] playoff bracket management.
- **PlayoffTab({ tournamentId }: Props)**: `JSX.Element` — [Client] Displays playoff games by round with editing, publish toggle, and automatic bracket updates.
  Calls: getCompletePlayoffData, saveGameResults, saveGamesData, calculateGameScores, updateTournamentHonorRoll
  Uses: useLocale, useEffect, useState
  Renders: BackofficeFlippableGameCard, BulkActionsMenu, Grid, Typography, Box, Backdrop, CircularProgress, Snackbar, Alert

### app/components/backoffice/tournament-backoffice-tab.tsx
Tournament-level admin actions for import, recalculation, deactivation. [Client] high-level tournament operations.
- **TournamentBackofficeTab({ tournament }: Props)**: `JSX.Element` — [Client] Provides admin actions: import players, recalculate playoff/scores, activate/deactivate, delete tournament.
  Calls: generateDbTournamentTeamPlayers, recalculateAllPlayoffFirstRoundGameGuesses, calculateGameScores, triggerQualifiedTeamsScoringAction, deactivateTournament, deleteDBTournamentTree
  Uses: useLocale, useRouter, useState
  Renders: Button, Dialog, Grid, Typography, DebugObject, Snackbar, Alert
