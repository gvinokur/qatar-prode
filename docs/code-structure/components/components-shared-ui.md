# Components: Shared UI

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-03-27

---

## Files

### app/components/ads/ad-sidebar.tsx
Sticky right-side 300px ad panel for desktop. [Client] visible only on lg+ breakpoints.
- **AdSidebar({ isAdFree }: { isAdFree: boolean })**: `JSX.Element | null` — [Client] Renders null when isAdFree. Calls adsbygoogle.push() on each pathname change to refresh the ad. In dev mode renders a grey placeholder box instead of an ins element.
  Uses: usePathname, useEffect
  Renders: Box (sticky wrapper), ins.adsbygoogle or placeholder Box

### app/components/ads/ad-modal-controller.tsx
Global modal ad orchestrator for mobile. [Client] tracks page views and minutes to open ad dialog at configurable frequency.
- **AdModalController()**: `JSX.Element | null` — [Client] Renders null for ad-free users. Fetches ad settings once on mount, tracks page views via pathname, stores lastAdShownAt in localStorage. Opens MUI Dialog with AdSense slot when both min-minutes and min-pageviews thresholds are met. Resets counter and saves timestamp on close. Only renders on small screens (display xs:block lg:none).
  Uses: useSession, usePathname, useEffect, useRef, useState
  Calls: getAdSettingsAction
  Renders: Dialog, DialogContent, DialogActions, Button, ins.adsbygoogle or placeholder Box

---

---

**app/components/context-providers/next-theme-wrapper-provider.tsx**
Wraps next-themes ThemeProvider with dynamic import to disable SSR for theme management.
- `ThemeProvider` - [Client] - Renders: NextThemesProvider

**app/components/context-providers/timezone-context-provider.tsx**
Provides timezone preference context with localStorage persistence.
- `TimezoneProvider` - [Provider] - Renders: TimezoneContext.Provider
- `useTimezone` - Hook returning TimezoneContextType

**app/components/context-providers/countdown-context-provider.tsx**
Provides shared countdown timer updating every second to prevent performance issues from multiple countdown components.
- `CountdownProvider` - [Provider] - Renders: CountdownContext.Provider
- `useCountdownContext` - Hook returning CountdownContextType with currentTime

**app/components/context-providers/edit-mode-context-provider.tsx**
Manages edit mode state for coordinating game editing across tournament pages.
- `EditModeProvider` - [Provider] - Renders: EditModeContext.Provider
- `useEditMode` - Hook returning EditModeContextValue
- `EditModeContext` - Context export

**app/components/context-providers/edit-mode-wrapper.tsx**
Client-side wrapper component for EditModeProvider.
- `EditModeWrapper` - [Client] - Renders: EditModeProvider

**app/components/context-providers/filter-context-provider.tsx**
Manages tournament game filters (active filter, group filter, round filter) with localStorage persistence namespaced by tournament ID.
- `FilterContextProvider` - [Provider] - Renders: FilterContext.Provider
- `useFilterContext` - Hook returning FilterContextValue

**app/components/context-providers/guesses-context-provider.tsx**
Manages game guesses and boost counts for a tournament with optional auto-save functionality.
- `GuessesContextProvider` - [Provider] - Calls: `updateOrCreateGameGuesses` - Renders: GuessesContext.Provider
- `GuessesContext` - Context export
- `useLocale` - Uses: next-intl hook

**app/components/context-providers/edit-trigger-context-provider.tsx**
Provides edit trigger mechanism for game editing with isEditMode ref tracking.
- `EditTriggerContextProvider` - [Provider] - Renders: EditTriggerContext.Provider
- `useEditTrigger` - Hook returning EditTriggerContextValue

**app/components/context-providers/theme-provider.tsx**
MUI ThemeProvider wrapper with dynamic light/dark theme switching and CSS gradient injection.
- `AppThemeProvider` - [Client] - Renders: MUI ThemeProvider

**app/components/header/conditional-header.tsx**
Conditionally hides header on tournament pages (/tournaments/).
- `ConditionalHeader` - [Client] - Default export

**app/components/header/header.tsx**
Main application header with logo, title, and action controls (theme switcher, language switcher, user actions).
- `Header` - [Server] - Calls: `getLocale`, `getTranslations` - Renders: ThemeSwitcher, LanguageSwitcher, UserActions

**app/components/header/theme-switcher.tsx**
Icon button for switching between light and dark themes.
- `ThemeSwitcher` - [Client] - Uses: `useTheme` (next-themes), `useTranslations` - Renders: Avatar with DarkMode/LightMode icons

**app/components/header/user-actions.tsx**
User menu displaying login button or user avatar with dropdown menu (settings, tutorial, backoffice, logout, delete account).
- `UserActions` - [Client] - Calls: `signOut` - Uses: `useSearchParams`, `useRouter`, `useLocale`, `useTranslations` - Renders: UserSettingsDialog, LoginOrSignupDialog, OnboardingDialogClient

**app/components/header/language-switcher.tsx**
Language selector with menu showing English and Español options.
- `LanguageSwitcher` - [Client] - Calls: `updateUserLocale` - Uses: `useLocale`, `useTranslations`, `usePathname`, `useRouter`, `useSession` - Renders: Avatar, Menu

**app/components/common/dev-tournament-badge.tsx**
Development tournament indicator badge.
- `DevTournamentBadge` - [Client] - Renders: BugReportIcon

**app/components/common/scroll-shadow-container.tsx**
Scrollable container with shadow indicators at edges showing scroll position. Supports vertical, horizontal, or bidirectional scrolling with ResizeObserver and MutationObserver for responsive shadow updates.
- `ScrollShadowContainer` - [Client] - Detailed implementation with scroll visibility calculations, shadow positioning, responsive sizing

**app/components/skeletons/index.ts**
Barrel export for all skeleton loading components.

**app/components/skeletons/skeleton-utils.ts**
Utility function for accessibility props on skeleton loaders.
- `getSkeletonA11yProps` - Returns accessibility props (role: 'status', aria-busy, aria-label)

**app/components/skeletons/auth-page-skeleton.tsx**
Skeleton loader for authentication page (title, input fields, button).
- `AuthPageSkeleton` - [Client] - Renders: Container, Card, Skeleton components

**app/components/skeletons/backoffice-tabs-skeleton.tsx**
Skeleton loader for backoffice tab interface with title and grid of field placeholders.
- `BackofficeTabsSkeleton` - [Client] - Renders: Card, Grid, Skeleton components

**app/components/skeletons/friend-group-list-skeleton.tsx**
Skeleton loader for friend groups list with title and grid of group cards.
- `FriendGroupListSkeleton` - [Client] - Renders: TournamentGroupCardSkeleton

**app/components/skeletons/game-card-skeleton.tsx**
Skeleton loader for game cards with compact and full variants (game number, teams, score, location, date).
- `GameCardSkeleton` - [Client] - Renders: Skeleton components

**app/components/skeletons/game-dialog-skeleton.tsx**
Skeleton loader for game detail dialog (team names, scores, boost info if applicable).
- `GameDialogSkeleton` - [Client] - Renders: DialogContent, Skeleton components

**app/components/skeletons/leaderboard-skeleton.tsx**
Skeleton loader for leaderboard table (rank, player, points, trend columns).
- `LeaderboardSkeleton` - [Client] - Renders: Table, TableBody, TableCell, Skeleton components

**app/components/skeletons/stats-card-skeleton.tsx**
Skeleton loader for statistics card with title and stat rows.
- `StatsCardSkeleton` - [Client] - Renders: Skeleton components in stacked layout

**app/components/skeletons/team-grid-skeleton.tsx**
Skeleton loader for team grid with header and 8-team card layout.
- `TeamGridSkeleton` - [Client] - Renders: Grid, Card, Skeleton components

**app/components/skeletons/tournament-form-skeleton.tsx**
Skeleton loader for tournament form with title and 6 input field placeholders in 12/6 responsive grid.
- `TournamentFormSkeleton` - [Client] - Renders: Grid, Skeleton components

**app/components/skeletons/tournament-group-card-skeleton.tsx**
Skeleton loader for tournament group card (group name, stat sections, button).
- `TournamentGroupCardSkeleton` - [Client] - Renders: Skeleton components in stacked layout

**app/components/mui-wrappers/index.ts**
Barrel export of MUI components (Grid, Box, AppBar, Toolbar, Paper, Typography, IconButton, Button, Chip, Alert, AlertTitle, Snackbar).

**app/components/celebration-effects.tsx**
Animation effects for score celebrations: confetti, trophy bounce, sob shake, and check bounce using framer-motion.
- `ConfettiEffect` - [Client] - Renders: motion.div particles
- `TrophyBounce` - [Client] - Renders: motion.div with TrophyIcon
- `SobEffect` - [Client] - Renders: motion.div with SobIcon
- `CheckEffect` - [Client] - Renders: motion.div with CheckIcon

**app/components/confirm-dialog.tsx**
Reusable confirmation dialog with customizable text, colors, and loading state.
- `ConfirmDialog` - [Client] - Renders: Dialog with DialogTitle, DialogContent, DialogActions

**app/components/debug.tsx**
Debug component displaying arbitrary objects as JSON tree.
- `DebugObject` - [Client] - Renders: JSONTree from react-json-tree

**app/components/delete-account-button.tsx**
Delete account button with confirmation dialog requiring "ELIMINAR" confirmation text.
- `DeleteAccountButton` - [Client] - Calls: `deleteAccount`, `signOut` - Uses: `useSession`, `useRouter` - Renders: Dialog with TextField, Alert

**app/components/environment-indicator.tsx**
Fixed-position alert indicating development mode environment.
- `EnvironmentIndicator` - [Client] - Renders: Alert with AlertTitle

**app/components/Install-pwa.tsx**
PWA install prompt with iOS manual install guide and exponential backoff for re-prompting.
- `InstallPwa` - [Client] - Uses: `useTranslations` - Renders: Snackbar, Alert, List, NotificationsSubscriptionPrompt

**app/components/invite-friends-dialog.tsx**
Dialog for sharing friend group invitations via short URL with copy-to-clipboard and WhatsApp share.
- `InviteFriendsDialog` - [Client] - Calls: `generateShortUrlForGroup`, `buildShortUrl`, `updateUserLocale` - Uses: `useTranslations`, `useLocale` - Renders: Dialog, TextField, Button, Snackbar

**app/components/notifications-subscription-prompt.tsx**
Prompt for enabling web push notifications with "not now" and "never ask" options.
- `NotificationsSubscriptionPrompt` - [Client] - Calls: `checkExistingSubscription`, `subscribeToNotifications` - Uses: `useSession`, `useTranslations` - Renders: Snackbar, Alert

**app/components/offline-detection.tsx**
Displays offline status indicator when network is unavailable.
- `OfflineDetection` - [Client] - Uses: `useTranslations` - Renders: Snackbar, Alert

**app/components/progress-tracker.tsx**
Shows prediction progress bar and boost usage badges.
- `ProgressTracker` - [Client] - Renders: Card, LinearProgress, BoostCountBadge

**app/components/service-worker-registration.tsx**
Service worker registration utilities (clearBadges, requestNotificationPermission, onUpdate).
- `clearBadges` - Utility function
- `requestNotificationPermission` - Async utility function
- `onUpdate` - Utility function

**app/components/session-wrapper.tsx**
SessionProvider wrapper from next-auth.
- `SessionWrapper` - [Client] - Renders: SessionProvider

**app/components/tab-panel.tsx**
Accessible tab panel component with role and aria attributes.
- `TabPanel` - [Client] - Renders: Box with tabpanel role and conditional content rendering

**app/components/team-score-row.tsx**
Displays team score row with logos, team names, and scores in responsive grid layout. Supports C2 winner styling: winner → bold + text.primary, loser → normal + text.secondary, draw/no-result → unchanged defaults.
- `TeamScoreRow` - [Client] - Props: `homeIsWinner?`, `awayIsWinner?` (optional booleans for C2 winner highlighting) - Uses: `getThemeLogoUrl` utility - Renders: Grid with Typography, Box (img)

**app/components/tournament-details-popover.tsx**
Popover displaying detailed tournament predictions (final standings, awards, qualifiers, overall progress).
- `TournamentDetailsPopover` - [Server] - Uses: `useTranslations` - Renders: Popover, Card, TournamentPredictionAccordion

**app/components/tournament-bottom-nav/tournament-bottom-nav-wrapper.tsx**
Mobile-only wrapper that conditionally renders bottom navigation using media queries.
- `TournamentBottomNavWrapper` - [Client] - Uses: `useMediaQuery`, `useTheme`, `usePathname` - Renders: TournamentBottomNav

**app/components/tournament-bottom-nav/tournament-bottom-nav.tsx**
Mobile bottom navigation with tabs for home, results, rules, stats, friend groups with active state detection.
- `TournamentBottomNav` - [Client] - Uses: `useRouter`, `useLocale`, `useTranslations` - Renders: BottomNavigation, BottomNavigationAction