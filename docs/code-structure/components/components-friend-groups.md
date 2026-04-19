# Components: Friend Groups

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-04-19

---

## Files

### app/components/friend-groups/image-picker-utils.ts
Utility functions for image processing and validation.

- **generateDataUrl(file: File, callback: (_imageUrl: string) => void)**: `void` — Convert file to data URL.
- **getImageDimensions(imageUrl: string)**: `Promise<{ width: number; height: number }>` — Load image and return dimensions.
- **validateImageDimensions(imageUrl: string, aspectRatio: number, aspectRatioTolerance: number)**: `Promise<string | null>` — Validate image matches aspect ratio; returns error message or null.

### app/components/friend-groups/image-picker.tsx
Client image upload component with file validation, aspect ratio checking, and preview. [Client]

- **ImagePicker(props: ImagePickerProps)**: `JSX.Element` — [Client] File input with validation, preview, and remove functionality.
  Uses: validateFile, generateDataUrl

### app/components/friend-groups/image-validate-file.ts
File validation utility for size, type, and image dimensions.

- **validateFile(file: File, maxSizeInMB: number, allowedTypes: string[], aspectRatio: number, aspectRatioTolerance: number)**: `Promise<string | null>` — Validate file size, type, and image dimensions; returns error message or null.

### app/components/friend-groups/image-picker-components.tsx
Image preview components for selected or empty state. [Client]

- **ImagePreview({ dataUrl, onClick, onRemove, aspectRatio?, previewWidth?, previewBackgroundColor? })**: `JSX.Element` — [Client] Display image preview with delete button.
- **NoImagePreview({ onClick, noImageText, aspectRatio?, previewWidth? })**: `JSX.Element` — [Client] Display placeholder for no image selected.
- **ImageCard(props: ImageCardProps)**: `JSX.Element` — [Client] Container with preview and upload button.

### app/components/friend-groups/friend-groups-join-message.tsx
Snackbar notification displayed when user joins a group. [Client]

- **JoinMessage()**: `JSX.Element` — [Client] Success snackbar with translated title and message.
  Uses: useTranslations

### app/components/friend-groups/group-tournament-betting-admin.tsx
Admin form to configure group tournament betting and track payment status. [Client]

- **GroupTournamentBettingAdmin(props: GroupTournamentBettingAdminProps)**: `JSX.Element` — [Client] Allows admin to enable betting, set amount/description, and toggle payment status per member.
  Calls: setGroupTournamentBettingConfigAction, setUserGroupTournamentBettingPaymentAction
  Uses: useTranslations, useLocale

### app/components/friend-groups/pending-request-view.tsx
Card showing pending group join request status with cancel option. [Client]

- **PendingRequestView(props: Props)**: `JSX.Element` — [Client] Displays group info, requested date, member count, and cancel button.
  Calls: cancelJoinRequestAction
  Uses: useTranslations, useLocale, useRouter

### app/components/friend-groups/admin-tabs.tsx
Unified tab navigation for group pages. Shows [Clasificación][Historial] for ALL users; adds [Administración] tab conditionally for admins. [Client]

- **AdminTabs(props: { isAdmin, standingsContent, historyContent, adminContent?, pendingRequestCount? })**: `JSX.Element` — [Client] Renders Clasificación and Historial tabs for all users. Adds Administración tab (with pending request badge) when isAdmin=true. URL-synced via ?tab=history and ?tab=admin; no param defaults to standings. Uses keepMounted on tabs to prevent unmount. TabList uses variant="scrollable" scrollButtons="auto" for mobile touch scrolling.
  Uses: useTranslations('groups.tabs'), useSearchParams, useRouter

### app/components/friend-groups/group-privacy-settings.tsx
Admin form to toggle group privacy (public/private) and manage public description. [Client]

- **GroupPrivacySettings(props: GroupPrivacySettingsProps)**: `JSX.Element` — [Client] Toggle visibility, set description, preview in discovery, and save with confirmation dialog.
  Calls: updateGroupPrivacyAction
  Uses: useTranslations
  Renders: PublicGroupPreviewDialog

### app/components/friend-groups/privacy-indicator-icon.tsx
Tooltip icon showing group privacy status. [Client]

- **PrivacyIndicatorIcon(props: PrivacyIndicatorIconProps)**: `JSX.Element` — [Client] Display lock or globe icon with privacy status tooltip.
  Uses: useTranslations

### app/components/friend-groups/join-request-manager.tsx
Admin card to view, approve, and reject pending join requests. [Client]

- **JoinRequestManager(props: Props)**: `JSX.Element` — [Client] List pending and rejected requests with approve/reject buttons, formatted timestamps, and source info.
  Calls: approveJoinRequestAction, rejectJoinRequestAction, trackEvent
  Uses: useTranslations, useRouter

### app/components/friend-groups/public-groups-browser.tsx
Searchable paginated browser for discovering and requesting to join public groups. [Client]

- **PublicGroupsBrowser(props: PublicGroupsBrowserProps)**: `JSX.Element` — [Client] Search, paginate, and browse public groups; open request dialog with optional message.
  Calls: requestToJoinGroup
  Uses: useTranslations, useLocale, useRouter, usePathname, useSearchParams, useTransition
  Renders: TournamentGroupCard

### app/components/friend-groups/FriendGroupsLandingEmptyState.tsx
Landing page empty state with hero, features, how-it-works, and use cases sections. [Client]

- **FriendGroupsLandingEmptyState(props: FriendGroupsLandingEmptyStateProps)**: `JSX.Element` — [Client] Multi-section landing page with scrollable content and CTA buttons.
  Uses: useTranslations
  Renders: FeatureCards, HowItWorksTabs, UseCases

### app/components/friend-groups/FriendGroupsSidebarEmptyState.tsx
Compact sidebar empty state with benefits and learn more link. [Client]

- **FriendGroupsSidebarEmptyState(props: FriendGroupsSidebarEmptyStateProps)**: `JSX.Element` — [Client] Display benefits list and learn more button.
  Uses: useTranslations

### app/components/friend-groups/empty-state/FeatureCards.tsx
Six feature cards highlighting friend groups capabilities. [Client]

- **FeatureCard(props: FeatureCardProps)**: `JSX.Element` — [Client] Individual feature card with icon, title, description.
- **FeatureCards()**: `JSX.Element` — [Client] Grid of six feature cards with headline and subtitle.
  Uses: useTranslations

### app/components/friend-groups/empty-state/HowItWorksTabs.tsx
Three-tab interface showing step-by-step guides for create/join workflows. [Client]

- **TabPanel(props: TabPanelProps)**: `JSX.Element` — [Client] Tab panel container with fade transition.
- **HowItWorksTabs()**: `JSX.Element` — [Client] Three tabs: create group, join private, join public; each with 4 step cards.
  Uses: useTranslations
  Renders: StepCard

### app/components/friend-groups/empty-state/StepCard.tsx
Individual step card with number badge, icon, title, description, and tip. [Client]

- **StepCard(props: StepCardProps)**: `JSX.Element` — [Client] Display step number, icon, title, description, and tip box.

### app/components/friend-groups/empty-state/UseCases.tsx
Four use case cards showing example group scenarios. [Client]

- **UseCaseCard(props: UseCaseCardProps)**: `JSX.Element` — [Client] Individual use case card with emoji, title, description.
- **UseCases()**: `JSX.Element` — [Client] Grid of four use case cards.
  Uses: useTranslations

### app/components/friend-groups/admin-section-tabs.tsx
Four-tab admin interface for requests, privacy, betting, and customization. [Client]

- **AdminSectionTabs(props: Props)**: `JSX.Element` — [Client] Tabs for join requests (with badge), privacy settings, betting config, and group customization.
  Renders: JoinRequestManager, GroupPrivacySettings, GroupTournamentBettingAdmin, ProdeGroupThemer

### app/components/friend-groups/friend-groups-themer.tsx
Form to customize group name, colors, and logo. [Client]

- **ProdeGroupThemer(props: Props)**: `JSX.Element` — [Client] Edit group name, primary/secondary colors, and upload logo using react-hook-form and color picker.
  Calls: updateTheme
  Uses: useTranslations, useRouter, useTheme
  Renders: ImagePicker

### app/components/friend-groups/EmailInvitationsTab.tsx
Email invitation tab with manual entry, CSV import, and batch send. [Client]

- **EmailInvitationsTab({ groupId, groupLogoUrl?, themeColor?, onSnackbar })**: `JSX.Element` — [Client] Renders recipient name/email rows, CSV import/template download buttons, optional custom message field, recipient count chip, and send button (disabled when empty or >50 recipients). Deduplicates by email before calling server action.
  Calls: sendGroupEmailInvitations
  Uses: useTranslations, useState, useRef

### app/components/friend-groups/invite-friends-dialog-button.tsx
Button triggering invite friends dialog. [Client]

- **InviteFriendsDialogButton({ groupId, groupName, tournamentId?, groupLogoUrl?, themeColor?, hideEmailTab? })**: `JSX.Element` — [Client] Wrapper button that opens invite friends dialog; passes all props including hideEmailTab through to InviteFriendsDialog.
  Uses: useTranslations
  Renders: InviteFriendsDialog

### app/components/friend-groups/join-request-form.tsx
Form to request group membership with optional message. [Client]

- **JoinRequestForm(props: Props)**: `JSX.Element` — [Client] Displays group info, message textarea, and submit button; shows rejection cooldown or success state.
  Calls: requestToJoinGroup
  Uses: useTranslations, useRouter, useTheme

### app/components/friend-groups/leave-group-button.tsx
Button and confirmation dialog to leave group. [Client]

- **LeaveGroupButton(props)**: `JSX.Element` — [Client] Error button with confirmation dialog and success/error snackbar.
  Calls: leaveGroupAction
  Uses: useLocale, useTranslations, useRouter

### app/components/friend-groups/notification-dialog.tsx
Dialog for admins to send notifications to group members. [Client]

- **NotificationDialog(props: NotificationDialogProps)**: `React.FC` — [Client] Form to select target page, title, and message; sends notification with feedback snackbar.
  Calls: sendGroupNotification
  Uses: useTranslations

### app/components/friend-groups/pending-requests-card.tsx
Card showing user's pending join requests with cancel and status tracking. [Client]

- **PendingRequestsCard(props: Props)**: `JSX.Element` — [Client] List up to 3 pending requests with status chips; cancel pending or view rejection cooldown.
  Calls: cancelJoinRequestAction
  Uses: useTranslations, useRouter, useTheme

### app/components/friend-groups/public-group-preview-dialog.tsx
Dialog preview of how group appears in public discovery. [Client]

- **PublicGroupPreviewDialog(props: PublicGroupPreviewDialogProps)**: `JSX.Element` — [Client] Show group card preview with name, privacy icon, description, and member count.
  Uses: useTranslations
  Renders: PrivacyIndicatorIcon

### app/components/friend-groups/friends-group-table.tsx
Multi-tournament leaderboard with sharing, notification, and betting display. [Client]

- **ProdeGroupTable(props: Props)**: `JSX.Element` — [Client] Tabbed tournament standings (one tab per tournament), share button, notification dialog, and read-only betting summary. Accepts `tournamentBadgeConfigs?: Record<string, TournamentBadgeConfig>` and passes per-tournament badge config to LeaderboardView. Accepts `historyByTournament?: Record<string, ScoreHistoryResult>` and passes per-tournament history data to LeaderboardView. Accepts `materializedRanksByTournament?: Record<string, Map<string, { currentRank: number; rankChange: number }>>` (added Story #320) and passes per-tournament materialized ranks to LeaderboardView.
  Uses: useTranslations, useTheme
  Renders: LeaderboardView, NotificationDialog

### app/components/friend-groups/sharing/InviteFlierTemplate.tsx
Branded invite flier card (360×480px) for PNG capture and sharing. [Client]

- **InviteFlierTemplate(props: InviteFlierTemplateProps, ref)**: `JSX.Element` — [Client] Fixed-size portrait card with gradient background (themeColor → black), group avatar (logo image or initials fallback), group name, custom italic message, QR code for shortUrl, short URL text, and "PRODE MUNDIAL" footer. Uses inline styles (no MUI theming) to avoid html-to-image class name issues. Shows Skeleton blocks when loading=true.
  Props: `{ groupName, groupLogoUrl?, customMessage, shortUrl, themeColor?, loading? }`
  Renders: Avatar (initials fallback), QRCodeSVG

### app/components/friend-groups/sharing/HeadToHeadTemplate.tsx
Head-to-head comparison card showing stats between two users. [Client]

- **StatRow(props: StatRowProps)**: `JSX.Element` — [Client] Stat row with left/right comparison, bold winner.
- **AvatarCircle(props: AvatarCircleProps)**: `JSX.Element` — [Client] Avatar with initials, name, and rank.
- **HeadToHeadTemplate(props: HeadToHeadTemplateProps, ref)**: `JSX.Element` — [Client] Compare two users' total points, group stage, knockout, accuracy; show who leads/loses/ties. Accepts myBadges and theirBadges; renders BadgeRow (17px, share context, maxDisplay=6) below each avatar.
  Uses: useTranslations
  Renders: BadgeRow

### app/components/friend-groups/sharing/LeaderboardTemplate.tsx
Shareable leaderboard image with top users, QR code, and join link. [Client]

- **LeaderboardTemplate(props: LeaderboardTemplateProps, ref)**: `JSX.Element` — [Client] Display standings with medals/stars, current user highlighted, points-from-lead info, and QR code with join URL. Each user row includes badges?: Badge[] (15px, share context, maxDisplay=6, flex-end justify).
  Uses: useTranslations
  Renders: BadgeRow

### app/components/friend-groups/sharing/PersonalHighlightTemplate.tsx
Personal achievement card showing rank improvement. [Client]

- **PersonalHighlightTemplate(props: PersonalHighlightTemplateProps, ref)**: `JSX.Element` — [Client] Show user avatar, rank change, before/after ranks, points, and tagline.
  Uses: useTranslations

### app/components/friend-groups/sharing/SharePreviewModal.tsx
Modal to preview, download, and share captured template images. [Client]

- **SharePreviewModal(props: SharePreviewModalProps)**: `JSX.Element` — [Client] Capture template to image, show preview, download or share via native/WhatsApp with fallback.
  Uses: useTranslations, useEffect

### app/components/friend-groups/sharing/ShareTemplateBase.tsx
Base layout for all share templates with header, content, and footer. [Client]

- **ShareTemplateBase(props: ShareTemplateBaseProps)**: `JSX.Element` — [Client] Container with colored header (title/subtitle), children content, and footer with app logo.
  Uses: useTranslations