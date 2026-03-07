# Implementation Plan: [Social] Export & Share System (WhatsApp) #259

## Story Context

Users want to share their standings, comparisons, and rank changes with friends via WhatsApp. Currently, the Head-to-Head dialog has basic text-based WhatsApp sharing (`wa.me/?text=...`), but there's no image-based sharing. This story adds WhatsApp-optimized image generation for three share types: Leaderboard Snapshots, Head-to-Head Cards, and Personal Highlights.

## Acceptance Criteria

- Users can generate and share a leaderboard snapshot image showing top standings
- Users can generate and share a head-to-head comparison image from the H2H dialog
- Users can generate and share a personal highlight image when their rank improves
- Sharing uses Web Share API on mobile (native sheet), falls back to download + "Open WhatsApp" on desktop
- All share templates are visually polished and mobile-optimized (540px wide)

## Technical Approach

### Library Choice

- **`html-to-image`**: Renders a React DOM element to a PNG/blob client-side. Templates use hardcoded hex colors (not MUI CSS variables) due to html-to-image's known incompatibility with CSS custom properties in MUI v7.
- **`qrcode.react`**: Renders a QR code SVG for the leaderboard join link.

### MUI CSS Variable Compatibility

html-to-image cannot reliably capture MUI v7 CSS variable-based theme colors. All template components use hardcoded hex values (not `theme.palette.*`). A `themeColor` prop (hex string, default `#1976d2`) is used for accent colors.

### Share Flow

```
User clicks "Share" button
    ↓
Join URL pre-resolved (passed as prop string)
    ↓
SharePreviewModal opens → off-screen template captured via html-to-image
    ↓
Preview shown as <img src={dataUrl}>
    ↓
User chooses:
  MOBILE:   "Share" → navigator.share({ files: [pngFile] })  [when canShare({ files }) = true]
  DESKTOP:  "Download Image" → downloads PNG
            "Open WhatsApp" → wa.me/?text= with companion text
            Toast: "Download the image, then attach it in WhatsApp"
```

### Off-Screen Template Rendering

Templates are rendered as React portals to `document.body` with `position: fixed; left: -9999px; visibility: hidden`. Portal (not a hidden div inside dialog) prevents layout contamination. Image capture happens when the modal opens.

### Join URL Resolution

Pre-computed in the Server Component / page, passed as a resolved `joinUrl: string` prop. Format: `${NEXT_PUBLIC_APP_URL}/${locale}/friend-groups/join/${groupId}` (or tournament-scoped variant, matching existing invite-friends-dialog pattern).

When `joinUrl` is undefined or empty, the QR code section in `LeaderboardTemplate` is simply omitted (graceful omission, not an error state).

### Shared Avatar Utilities

`getAvatarColor()` and `getUserInitials()` are currently duplicated across `HeadToHeadDialog.tsx` and `LeaderboardCard.tsx`. This story extracts them to `app/utils/avatar-utils.ts` and updates all existing references (removes duplication, fixes existing SonarCloud issue).

## Visual Prototypes

### 1. Leaderboard Snapshot Template (540px wide)

```
+------------------------------------------+
|  [accent color header bar]               |
|  La Maquina                              |
|  FIFA World Cup 2026                     |
+------------------------------------------+
|  #1  🥇  Maria             1,250 pts    |
|  #2  🥈  Pedro             1,180 pts    |
|  #3  ⭐  YOU               1,120 pts    |  <- highlighted row
|  #4      John              1,050 pts    |
|  #5      Ana                 980 pts    |
+------------------------------------------+
|  130 pts from the lead                  |
+------------------------------------------+
|  [QR Code 80x80]  |  qatar-prode.app   |  <- omitted if no joinUrl
+------------------------------------------+
```

Notes:
- Current user row has light accent background
- 🥇🥈🥉 medals for top 3, ⭐ for current user outside top 3
- "X pts from lead" hidden when user is #1
- QR code section omitted if `joinUrl` is undefined

### 2. Head-to-Head Template (540px wide)

```
+------------------------------------------+
|  [accent]  Head to Head                  |
|  La Maquina – FIFA World Cup 2026        |
+------------------------------------------+
|  [JG]  YOU #3      vs     PEDRO #2  [PP] |
+------------------------------------------+
|  1,120     Total Points         1,180    |
|    650     Group Stage            700    |
|    470     Knockout               480    |
|     78%    Accuracy               82%   |
+------------------------------------------+
|  Pedro leads by 60 pts – I'm coming!    |
+------------------------------------------+
|               qatar-prode.app            |
+------------------------------------------+
```

Notes:
- Avatar circles use `getAvatarColor(userId)` from avatar-utils (hardcoded palette)
- Winning value in bold green (#2e7d32), losing value normal weight
- Summary message matches existing HeadToHeadDialog win/loss/tie logic

### 3. Personal Highlight Template (540px wide)

```
+------------------------------------------+
|  [accent]  Moving Up!                    |
|  La Maquina – FIFA World Cup 2026        |
+------------------------------------------+
|              [Avatar 72px]               |
|               Your Name                  |
|          ▲ MOVED UP 3 PLACES            |
|             #6  →  #3                   |
|             1,120 pts                   |
+------------------------------------------+
|  Can you catch me?   qatar-prode.app    |
+------------------------------------------+
```

Notes:
- Share button added to `LeaderboardCards.tsx` (not `LeaderboardCard.tsx`) — managed at the cards level where all data is available
- Triggered by an `onShareHighlight` callback on `LeaderboardCardProps`; callback is set when `isCurrentUser && rankChange > 0`
- `LeaderboardCards` manages `highlightShareOpen` state and renders the `PersonalHighlightTemplate` portal

## Shared Components

### ShareTemplateBase

Shared wrapper to prevent SonarCloud duplication:
```tsx
function ShareTemplateBase({ accentColor, title, subtitle, children, footerText }) {
  return (
    <Box sx={{ width: 540, fontFamily: 'Arial, sans-serif', bgcolor: '#fff' }}>
      <Box sx={{ bgcolor: accentColor, px: 2, py: 1.5 }}>
        <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{title}</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{subtitle}</Typography>
      </Box>
      {children}
      <Box sx={{ borderTop: '1px solid #eee', px: 2, py: 1 }}>
        <Typography sx={{ color: '#999', fontSize: 11 }}>{footerText}</Typography>
      </Box>
    </Box>
  )
}
```

## Complete Prop Threading

The full data flow for new props:

```
friends-group-table.tsx
  receives: groupId (existing), group.name, group.theme?.primaryColor
  computes: joinUrl = `${NEXT_PUBLIC_APP_URL}/${locale}/friend-groups/join/${groupId}`
  passes: groupName, joinUrl, themeColor → LeaderboardView

LeaderboardView.tsx
  new props in LeaderboardViewProps (types.ts): groupName?, joinUrl?, themeColor?
  passes all through → LeaderboardCards

LeaderboardCards.tsx
  new props in LeaderboardCardsProps (types.ts): groupName?, joinUrl?, themeColor?
  - "Share Standings" button: uses groupName, joinUrl, themeColor → LeaderboardTemplate
  - HeadToHeadDialog: passes groupName (existing) + joinUrl (new) → dialog renders HeadToHeadTemplate
  - Personal Highlight: onShareHighlight callback on LeaderboardCard when isCurrentUser && rankChange > 0
    → highlightShareOpen state → PersonalHighlightTemplate portal

HeadToHeadDialog.tsx
  new prop: joinUrl?: string (added to HeadToHeadDialogProps)
  renders HeadToHeadTemplate portal (inside dialog component, portal to document.body)

LeaderboardCard.tsx
  new prop: onShareHighlight?: () => void (added to LeaderboardCardProps)
  renders share IconButton when isCurrentUser && onShareHighlight defined && rankChange > 0
  (no additional data props needed — all data stays in LeaderboardCards)
```

**types.ts updates needed:**
- `LeaderboardViewProps`: add `groupName?: string`, `joinUrl?: string`, `themeColor?: string`
- `LeaderboardCardsProps`: add `groupName?: string`, `joinUrl?: string`, `themeColor?: string`
- `LeaderboardCardProps`: add `onShareHighlight?: () => void`

## Files to Create

| File | Description |
|------|-------------|
| `app/utils/avatar-utils.ts` | Extract `getAvatarColor()` and `getUserInitials()` (removes existing duplication) |
| `app/utils/share-utils.ts` | `captureElement()`, `shareImage()`, `downloadBlob()`, `openWhatsApp()` |
| `app/components/friend-groups/sharing/SharePreviewModal.tsx` | Preview modal with Share / Download / Open WhatsApp buttons |
| `app/components/friend-groups/sharing/ShareTemplateBase.tsx` | Shared header/footer/layout wrapper |
| `app/components/friend-groups/sharing/LeaderboardTemplate.tsx` | Off-screen leaderboard image template |
| `app/components/friend-groups/sharing/HeadToHeadTemplate.tsx` | Off-screen H2H comparison image template |
| `app/components/friend-groups/sharing/PersonalHighlightTemplate.tsx` | Off-screen rank change image template |

## Files to Modify

| File | Change |
|------|--------|
| `app/components/leaderboard/types.ts` | Add optional props to `LeaderboardViewProps`, `LeaderboardCardsProps`, `LeaderboardCardProps` |
| `app/components/leaderboard/LeaderboardCard.tsx` | Import from avatar-utils; add `onShareHighlight?` prop; render share IconButton when applicable |
| `app/components/leaderboard/LeaderboardCards.tsx` | Add new props; add "Share Standings" button; manage highlight share state; render LeaderboardTemplate and PersonalHighlightTemplate portals; pass joinUrl to HeadToHeadDialog |
| `app/components/leaderboard/LeaderboardView.tsx` | Add new props; pass through to LeaderboardCards |
| `app/components/leaderboard/HeadToHeadDialog.tsx` | Import from avatar-utils; add `joinUrl?` prop; render HeadToHeadTemplate portal; enhance share button with image capture |
| `app/components/friend-groups/friends-group-table.tsx` | Compute and pass `groupName`, `joinUrl`, `themeColor` to LeaderboardView |
| `locales/en/groups.json` | Add `sharing` section |
| `locales/es/groups.json` | Add Spanish `sharing` section |
| `package.json` | Add `html-to-image` and `qrcode.react` |

## Implementation Steps

### Step 1: Install Dependencies & Extract Avatar Utils

```bash
npm install html-to-image qrcode.react
```

Create `app/utils/avatar-utils.ts`:
```typescript
export function getAvatarColor(userId: string): string { /* existing implementation */ }
export function getUserInitials(name: string): string { /* existing implementation */ }
```

Update `HeadToHeadDialog.tsx` and `LeaderboardCard.tsx` to import from `avatar-utils`.

### Step 2: Create `share-utils.ts`

```typescript
import { toPng } from 'html-to-image'

export async function captureElement(el: HTMLElement): Promise<Blob>
// toPng(el) → dataURL → fetch(dataURL) → blob, or use canvas.toBlob

export async function shareImage(blob: Blob, text: string, filename: string): Promise<void>
// if navigator.canShare?.({ files: [file] }) → navigator.share({ files, text })
// else → downloadBlob(blob, filename) + openWhatsApp(text)

export function downloadBlob(blob: Blob, filename: string): void

export function openWhatsApp(text: string): void
// window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
```

### Step 3: Create Templates

Create `ShareTemplateBase.tsx`, then three template components. Each:
- Uses `React.forwardRef` to expose root `div` ref
- Fixed width 540px, hardcoded hex colors
- Accepts `themeColor?: string` (default `#1976d2`)
- `LeaderboardTemplate` omits QR section when `joinUrl` is falsy

### Step 4: Create `SharePreviewModal`

```typescript
interface SharePreviewModalProps {
  open: boolean
  onClose: () => void
  templateRef: RefObject<HTMLElement | null>
  shareText: string
  filename: string
}
```

On open:
1. Call `captureElement(templateRef.current)` → store `dataUrl`
2. Show `<CircularProgress>` while loading
3. Show `<img src={dataUrl}>` preview
4. Buttons: Share (mobile) / Download + Open WhatsApp (desktop)

### Step 5: Update types.ts & Thread Props

Update `LeaderboardViewProps`, `LeaderboardCardsProps`, `LeaderboardCardProps` in `types.ts`. Update `friends-group-table.tsx` to compute and pass `joinUrl`, `groupName`, `themeColor`.

### Step 6: Integrate Leaderboard Sharing in LeaderboardCards

- Add "Share Standings" `Button` (hidden when `leaderboardUsers.length === 0`)
- Render `LeaderboardTemplate` portal
- State: `leaderboardShareOpen: boolean`
- Top-5 users + current user always included

### Step 7: Enhance HeadToHeadDialog

- Add `joinUrl?` prop
- Render `HeadToHeadTemplate` portal to `document.body`
- Replace text-only share with image capture → `SharePreviewModal`

### Step 8: Add Personal Highlight in LeaderboardCards

- Pass `onShareHighlight={() => setHighlightShareOpen(true)}` to current user's `LeaderboardCard` when `rankChange > 0`
- Render `PersonalHighlightTemplate` portal
- State: `highlightShareOpen: boolean`

### Step 9: i18n Translations

Add `sharing` section to both locale files:
```json
"sharing": {
  "shareStandings": "Share Standings",
  "shareHighlight": "Share Highlight",
  "previewTitle": "Share Preview",
  "download": "Download Image",
  "shareButton": "Share",
  "openWhatsApp": "Open WhatsApp",
  "cancel": "Cancel",
  "generatingImage": "Generating image...",
  "desktopHint": "Download the image, then attach it in WhatsApp",
  "pointsFromLead": "{points} pts from the lead",
  "movedUp": "Moved up {count} places",
  "appTagline": "Play at qatar-prode.app",
  "catchMe": "Can you catch me?",
  "leaderboardShareText": "Check out the standings in {groupName}! Join us: {url}",
  "highlightShareText": "I moved up {count} places in {groupName}! {url}",
  "h2hShareText": "Head to Head in {groupName}: Me {myPts}pts vs {name} {theirPts}pts"
}
```

## Testing Strategy

**`__tests__/utils/avatar-utils.test.ts`**
- Consistent color for same userId, different colors for different IDs
- Initials: single name, multi-word, edge cases

**`__tests__/utils/share-utils.test.ts`**
- `shareImage` uses `navigator.share` when `canShare` returns true
- `shareImage` falls back to download + WhatsApp when file sharing unsupported
- `downloadBlob` creates anchor and triggers click
- `openWhatsApp` opens correct URL

**`__tests__/components/friend-groups/sharing/LeaderboardTemplate.test.tsx`**
- Renders group name and tournament
- Shows top 5 users
- Highlights current user row
- Medal emojis for top 3
- Points-from-lead message shown/hidden correctly
- QR section absent when `joinUrl` is falsy
- Mock qrcode.react: `vi.mock('qrcode.react', () => ({ QRCodeSVG: () => <svg data-testid="qr-code" /> }))`

**`__tests__/components/friend-groups/sharing/HeadToHeadTemplate.test.tsx`**
- Renders both users with names and ranks
- All 4 stat rows rendered
- Winning values rendered with correct styling indicator (test via aria or data-testid)
- Win/loss/tie summary messages

**`__tests__/components/friend-groups/sharing/PersonalHighlightTemplate.test.tsx`**
- Renders user name and initials
- Shows previous rank and current rank
- Shows correct "moved up N places" text
- Shows current points

**`__tests__/components/friend-groups/sharing/SharePreviewModal.test.tsx`**
- Loading state initially shown
- Preview image shown after capture
- Share button triggers `shareImage` (mock share-utils module)
- Download button triggers `downloadBlob`
- WhatsApp button triggers `openWhatsApp` (when canShare returns false)
- Cancel closes modal
- Mock: `vi.mock('html-to-image', () => ({ toPng: vi.fn().mockResolvedValue('data:image/png;base64,abc') }))`

## Validation Considerations

- **SonarCloud**: 0 new issues — `ShareTemplateBase` prevents duplication; avatar-utils removes existing duplication
- **No server actions**: All image generation is client-side
- **No database changes**: No migrations needed
- **TypeScript strict**: All props typed; `RefObject<HTMLElement | null>` for refs
- **Bundle size**: html-to-image (~35KB gzip) + qrcode.react (~15KB gzip) are acceptable
