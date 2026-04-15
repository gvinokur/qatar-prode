# Plan: Group Invite Flier with QR Code — Story #326

## Context

Users currently share group invites via a plain link or WhatsApp text. Visual sharing (Instagram stories, WhatsApp Status) is far more engaging. This story introduces a "Folleto" (flier) tab to the existing `InviteFriendsDialog` that generates a branded PNG flier with the group's logo, accent color, custom message, and a QR code — ready to download or share natively.

---

## Acceptance Criteria

- [ ] `InviteFriendsDialog` redesigned with tabs: **Enlace**, **Email**, **Folleto**
- [ ] Folleto tab shows a live preview of the flier
- [ ] Users can customize the promotional message (real-time)
- [ ] Flier pulls group logo, name, accent color, and generates a QR for the invite link
- [ ] Download as PNG
- [ ] Native Share (mobile) / WhatsApp fallback (desktop)
- [ ] Styling follows Royal Sports (Violet) theme
- [ ] Email tab is present but shows a "coming soon" placeholder (out of scope per story)

---

## Technical Approach

All required libraries are already installed: `qrcode.react` (v4.2.0), `html-to-image` (v1.11.13). The existing `captureElement`, `downloadBlob`, and `shareImage` utilities in `app/utils/share-utils.ts` handle PNG export and native sharing.

The implementation follows the same pattern as `LeaderboardTemplate` + `SharePreviewModal` but with an **inline preview** instead of a separate preview modal: the flier template is rendered inside the Folleto tab (scaled to fit the dialog), and the same DOM element is captured on demand.

**Flier template design (from mockup):**
- Portrait card, 360px wide × 480px tall (3:4 ratio)
- Linear gradient background using `themeColor` (defaults to `#7c3aed` Royal Violet)
- Group avatar (logo image or initials fallback) with white border
- Group name (large, bold, white)
- Custom italic message (centered, white)
- White box with QRCodeSVG for the invite URL
- Short URL text below QR
- "PRODE MUNDIAL" footer

**Tab layout inside dialog:**
- Tabs: Enlace | Email | Folleto
- Folleto tab is two-column on desktop (left: controls, right: live preview); single-column on mobile
- Scale the flier template for display using `transform: scale(...)`, but `captureElement` captures at natural resolution × pixelRatio

---

## Visual Prototype

```
┌─────────────────────────────────────────────────────┐
│  Invitar a [Nombre Grupo]                    [✕]    │
├─────────────────────────────────────────────────────┤
│  [ Enlace ]  [ Email ]  [ Folleto 🖼 ]              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │ Mensaje          │  │   ╔═══════════════════╗  │  │
│  │ ┌─────────────┐ │  │   ║  ░░░░░░░░░░░░░░░  ║  │  │
│  │ │ ¡Únete...   │ │  │   ║   [Avatar]         ║  │  │
│  │ │             │ │  │   ║   Nombre Grupo      ║  │  │
│  │ └─────────────┘ │  │   ║   "mensaje custom"  ║  │  │
│  │                 │  │   ║  ┌───┐              ║  │  │
│  │ [↓ Descargar]   │  │   ║  │QR │ prode.../j/ ║  │  │
│  │ [↑ Compartir]   │  │   ║  └───┘              ║  │  │
│  │                 │  │   ║   PRODE MUNDIAL      ║  │  │
│  └─────────────────┘  │   ╚═══════════════════╝  │  │
│                        └─────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

Mobile: preview on top (full width, smaller scale), controls below.

---

## Files to Create

### `app/components/friend-groups/sharing/InviteFlierTemplate.tsx` *(new)*

Branded flier card component, ref-forwarded for image capture.

---

## Files to Modify

### `app/components/invite-friends-dialog.tsx` *(modified)*

Add Tabs (Enlace, Email, Folleto). Add optional `groupLogoUrl?` and `themeColor?` props. Move existing link/WhatsApp UI into Tab 0. Add Email placeholder to Tab 1. Add Folleto tab (message input + live preview + download/share) as Tab 2.

### `app/components/friend-groups/invite-friends-dialog-button.tsx` *(modified)*

Add pass-through for `groupLogoUrl?` and `themeColor?` props.

### `app/[locale]/friend-groups/[id]/page.tsx` *(modified)*

Pass `groupLogoUrl` (via `getThemeLogoUrl(prodeGroup.theme)`) and `themeColor` to `InviteFriendsDialogButton`.

### `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` *(modified)*

Same as above.

### `locales/es/groups.json` *(modified)*

Add translation keys for tabs and flier UI.

### `locales/en/groups.json` *(modified)*

Same in English.

---

## Mid-Level Design

### Call Graph Changes

No new cross-layer call flows. All changes are client-side component-level. The existing flow for short URL generation (`generateShortUrlForGroup` → `buildShortUrl`) is reused unchanged. `captureElement` / `shareImage` / `downloadBlob` from `share-utils.ts` are called directly from the Folleto tab component.

### `app/components/friend-groups/sharing/InviteFlierTemplate.tsx` *(new)*

**New component:**

- **InviteFlierTemplate** (React.forwardRef): `(props: InviteFlierTemplateProps, ref: Ref<HTMLDivElement>) => ReactElement`
  Fixed-size (360×480px) gradient card for PNG capture. Does not use MUI theming to avoid class name issues with `html-to-image`.
  Props:
  ```ts
  interface InviteFlierTemplateProps {
    groupName: string
    groupLogoUrl?: string      // shows initials Avatar if absent
    customMessage: string
    shortUrl: string
    themeColor?: string        // default: '#7c3aed'
    loading?: boolean          // shows skeleton if true
  }
  ```
  Tests:
  - renders group name and custom message
  - renders QRCodeSVG with shortUrl as value
  - renders Avatar with group initials when groupLogoUrl is absent
  - renders group logo image when groupLogoUrl is provided
  - applies themeColor to gradient background
  - renders skeleton state when loading=true

### `app/components/invite-friends-dialog.tsx` *(modified)*

**Changed component:**

- **InviteFriendsDialog**: props extended:
  ```ts
  interface InviteFriendsDialogProps {
    readonly trigger: ReactNode
    readonly groupId: string
    readonly groupName: string
    readonly tournamentId?: string
    readonly groupLogoUrl?: string   // NEW
    readonly themeColor?: string     // NEW
  }
  ```
  State additions: `activeTab: number` (0=Enlace, 1=Email, 2=Folleto), `customMessage: string` (default from t('flier.defaultMessage')), `isCapturing: boolean`, `captureError: string | null`.
  Calls: `captureElement`, `downloadBlob`, `shareImage` (from share-utils), `generateShortUrlForGroup`, `buildShortUrl` (unchanged)
  Error paths: Download/Share buttons disabled while `isCapturing=true`; error snackbar shown when `captureElement` throws; fallback to WhatsApp link when `navigator.canShare` is unavailable (desktop).
  Tests:
  - renders Tabs with Enlace, Email, and Folleto labels
  - Enlace tab shows link TextField and copy button by default
  - Email tab shows a "coming soon" placeholder message
  - Folleto tab renders InviteFlierTemplate with shortUrl and customMessage
  - customMessage textarea change updates the `customMessage` prop passed to InviteFlierTemplate
  - download button calls captureElement then downloadBlob with filename `invite-{groupName}.png`
  - share button calls captureElement then shareImage with group name in share text
  - download and share buttons are disabled while isCapturing is true
  - shows error snackbar when captureElement rejects
  - customMessage empty string → InviteFlierTemplate receives empty string (component handles display)
  - groupLogoUrl missing → InviteFlierTemplate receives undefined (component shows initials)
  - themeColor missing → InviteFlierTemplate receives undefined (component uses default)

### `app/components/friend-groups/invite-friends-dialog-button.tsx` *(modified)*

**Changed component:**

- **InviteFriendsDialogButton**: props extended with `groupLogoUrl?` and `themeColor?`, passed through to InviteFriendsDialog.
  Tests:
  - renders the trigger button and passes groupLogoUrl and themeColor down to InviteFriendsDialog

---

## Implementation Steps

### Wave 1 — InviteFlierTemplate component

1. Create `app/components/friend-groups/sharing/InviteFlierTemplate.tsx`
   - Use `React.forwardRef<HTMLDivElement, InviteFlierTemplateProps>`
   - Gradient background: `background: 'linear-gradient(135deg, ${themeColor} 0%, #000 100%)'`
   - Avatar: if `groupLogoUrl`, use `<img>` tag; else MUI `<Avatar>` with initials
   - QR: `<QRCodeSVG value={shortUrl} size={100} />`
   - Skeleton: show `<Skeleton>` blocks when `loading=true`
   - Update `docs/code-structure/components/components-friend-groups.md`

### Wave 2 — Tab redesign in InviteFriendsDialog

2. Modify `app/components/invite-friends-dialog.tsx`
   - Import MUI `Tabs`, `Tab`, `Box` (already imported), and `QRCodeSVG`-free (template handles it)
   - Import `InviteFlierTemplate` and `flierRef = useRef<HTMLDivElement>(null)`
   - Import `captureElement`, `downloadBlob`, `shareImage` from `share-utils`
   - Add new props: `groupLogoUrl?`, `themeColor?`
   - Add `activeTab` and `customMessage` state
   - Add `handleDownload`, `handleShare` async functions
   - Wrap all content in Tabs/TabPanel structure
   - Update `docs/code-structure/components/components-friend-groups.md`

### Wave 3 — Prop propagation to call sites

3. Modify `app/components/friend-groups/invite-friends-dialog-button.tsx` — add prop pass-through
4. Modify `app/[locale]/friend-groups/[id]/page.tsx` — pass `groupLogoUrl` and `themeColor`
5. Modify `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` — same

### Wave 4 — Translations

6. Add to `locales/es/groups.json` under `invite`:
   ```json
   "tabs": { "link": "Enlace", "email": "Email", "flier": "Folleto" },
   "flier": {
     "customMessageLabel": "Mensaje personalizado",
     "defaultMessage": "¡Súmate a nuestro prode y demostrá cuánto sabés de fútbol!",
     "download": "Descargar",
     "share": "Compartir",
     "emailComingSoon": "El envío por email estará disponible próximamente.",
     "footer": "PRODE MUNDIAL"
   }
   ```
7. Add same keys to `locales/en/groups.json`

---

## Testing Strategy

### InviteFlierTemplate (6 test cases)
- renders group name and custom message
- renders QRCodeSVG with shortUrl as value
- renders Avatar with group initials when groupLogoUrl is absent
- renders group logo image when groupLogoUrl is provided
- applies themeColor to gradient background
- renders skeleton state when loading=true

### InviteFriendsDialog (12+ test cases)

**Happy path:**
- renders 3 tabs with labels (Enlace, Email, Folleto)
- Enlace tab shows link TextField and copy button by default
- Email tab shows "coming soon" placeholder
- Folleto tab renders InviteFlierTemplate with shortUrl and customMessage
- customMessage change updates `customMessage` prop on InviteFlierTemplate

**Error paths:**
- captureElement rejects → shows error snackbar, buttons re-enabled
- generateShortUrlForGroup rejects → dialog shows fallback URL
- download/share buttons disabled while isCapturing is true

**Edge cases:**
- empty customMessage → InviteFlierTemplate receives empty string
- groupLogoUrl missing → InviteFlierTemplate receives undefined
- themeColor missing → InviteFlierTemplate receives undefined
- download calls captureElement then downloadBlob with filename `invite-{groupName}.png`
- share calls captureElement then shareImage with group name in share text

### Mocks required
```ts
// Server actions
vi.mock('@/app/actions/short-url-actions', () => ({
  generateShortUrlForGroup: vi.fn().mockResolvedValue({ code: 'abc123' }),
  buildShortUrl: vi.fn().mockResolvedValue('https://prodemundial.app/j/abc123'),
}))

// Share utilities
vi.mock('@/app/utils/share-utils', () => ({
  captureElement: vi.fn().mockResolvedValue(new Blob(['img'], { type: 'image/png' })),
  downloadBlob: vi.fn(),
  shareImage: vi.fn().mockResolvedValue(undefined),
}))

// Browser APIs
vi.stubGlobal('navigator', { canShare: vi.fn().mockReturnValue(true), share: vi.fn() })

// i18n
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'es' }))

// All tests use renderWithTheme() wrapper (project convention)
// InviteFlierTemplate renders only primitive props — no testFactory needed; use direct values:
//   groupName='Test Group', shortUrl='https://prodemundial.app/j/abc123', customMessage='Join us!'
// InviteFriendsDialog uses direct prop values:
//   groupId='group-1', groupName='Test Group', groupLogoUrl='https://example.com/logo.png', themeColor='#7c3aed'
```

Target ≥80% coverage on new/changed files.

---

## Validation Considerations

- 0 new SonarCloud issues
- No unused imports (Husky enforces this)
- `'use client'` on InviteFlierTemplate (uses refs and browser APIs at capture time)
- `html-to-image` requires the element to be in the DOM; the flier is always rendered (in the open dialog) when download/share is triggered
- Check mobile layout: on small screens, the dialog `maxWidth="sm"` should be respected; use responsive `flexDirection: { xs: 'column', sm: 'row' }` in the Folleto tab layout

---

## Open Questions

- _(none — all requirements are well-defined by the mockup and acceptance criteria)_
