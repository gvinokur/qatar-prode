# Implementation Plan: Story #238 - Enhanced Empty States for Friend Groups

## Story Context

**Problem**: The current friend groups feature has very basic empty states that don't educate users about the feature's capabilities or the request/approval workflow. This leads to:
- Low friend group adoption
- Confusion about how to create/join groups
- Users not understanding the private vs. public group distinction
- Unclear approval process

**Solution**: Replace bare-bones empty states with comprehensive, educational empty states that:
- Explain the value proposition of friend groups
- Clearly outline the mechanics (how to create, join private, join public)
- Emphasize the request/approval workflow (all groups require admin approval)
- Provide progressive disclosure (sidebar card → full landing page)

**User Story**: As a user, I want to understand how friend groups work and how to join/create them, so that I can start competing with friends without confusion.

## Acceptance Criteria

### Sidebar Card Empty State
- ✅ Replace basic empty state in sidebar with rich, compact design
- ✅ Show trophy icon, value-focused headline ("Compete with Friends!")
- ✅ Brief description of private vs. public groups
- ✅ 3 checkmarked benefits (leaderboards, bragging rights, progress tracking)
- ✅ Two CTAs: "Create Group" (primary) and "Discover Public Groups" (secondary)
- ✅ "Learn more about groups →" link to landing page

### Landing Page Empty State
- ✅ Hero section with icon, headline, subtitle, and CTAs
- ✅ Features section with 6 feature cards (Private Groups, Public Competitions, Live Leaderboards, Group Chat, Custom Prizes, Detailed Stats)
- ✅ **How It Works section** (tabbed interface with 3 scenarios):
  - Tab 1: Create a Group (4 steps)
  - Tab 2: Join a Private Group (4 steps)
  - Tab 3: Join a Public Group (4 steps)
- ✅ Use Cases section (4 scenarios: Family & Friends, Office Competitions, Bar & Fan Clubs, College Dorms)
- ✅ Final CTA section

### Critical Requirements
- ✅ All copy is i18n-compatible (English + Spanish)
- ✅ Follows Material-UI design system and dark mode theme
- ✅ **Emphasizes request/approval flow** (no auto-join for any group type)
- ✅ Admin responsibility is clearly communicated
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Maintains existing functionality (create/discover dialogs still work)

## Technical Approach

### 1. Component Architecture

**New Components to Create:**

1. **`FriendGroupsSidebarEmptyState.tsx`** (Client Component)
   - Location: `app/components/friend-groups/`
   - Replaces the empty CardActions in `FriendGroupsList`
   - Props: `onCreateGroup`, `onDiscoverGroups`, `onLearnMore`
   - Compact design matching mockup sidebar card

2. **`FriendGroupsLandingEmptyState.tsx`** (Client Component)
   - Location: `app/components/friend-groups/`
   - Replaces `EmptyGroupsState` in `TournamentGroupsList`
   - Props: `onCreateGroup`, `onDiscoverGroups`, `tournamentId`
   - Comprehensive design with all sections

3. **Sub-components for Landing Page:**
   - `HowItWorksTabs.tsx` - Tabbed interface for 3 scenarios
   - `FeatureCards.tsx` - Grid of 6 feature cards
   - `UseCases.tsx` - 4 use case scenarios
   - Location: `app/components/friend-groups/empty-state/`

### 2. Modifications to Existing Components

**`app/components/tournament-page/friend-groups-list.tsx`** (Sidebar):
- Modify `CardActions` section (lines 172-209)
- When no groups exist, render `<FriendGroupsSidebarEmptyState />` instead of basic buttons
- Pass `onLearnMore` handler to navigate to landing page

**`app/components/tournament-page/tournament-groups-list.tsx`** (Landing):
- Replace `<EmptyGroupsState />` (line 83) with `<FriendGroupsLandingEmptyState />`
- Keep existing dialog logic (create group dialog)

**`app/components/tournament-page/empty-groups-state.tsx`**:
- Mark as deprecated (add comment)
- Keep file for now (may be used elsewhere)
- Or delete if only used in one place (verify with Grep)

### 3. i18n Structure

**New Translation Keys** (add to `locales/en/groups.json` and `locales/es/groups.json`):

```json
{
  "emptyState": {
    "sidebar": {
      "headline": "Compete with Friends!",
      "description": "Create private groups or join public competitions to track your predictions against others.",
      "benefits": {
        "privateLeaderboards": "Private leaderboards",
        "braggingRights": "Compete for bragging rights",
        "trackProgress": "Track progress together"
      },
      "learnMore": "Learn more about groups"
    },
    "landing": {
      "hero": {
        "headline": "Predictions Are Better with Friends",
        "subtitle": "Create private groups for your crew or discover public competitions. Track predictions, climb leaderboards, and earn bragging rights.",
        "createButton": "Create Your First Group",
        "discoverButton": "Discover Public Groups"
      },
      "features": {
        "headline": "Why Join or Create a Group?",
        "subtitle": "Everything you need to compete and connect",
        "privateGroups": {
          "title": "Private Groups",
          "description": "Create invite-only groups for family, friends, or coworkers. Control who joins and keep it exclusive."
        },
        "publicCompetitions": {
          "title": "Public Competitions",
          "description": "Join open groups to compete with the global community. Prove your prediction skills on a bigger stage."
        },
        "liveLeaderboards": {
          "title": "Live Leaderboards",
          "description": "Track rankings in real-time. See who's on top and where you stand after every match."
        },
        "groupChat": {
          "title": "Group Chat",
          "description": "Trash talk, celebrate wins, and discuss predictions with your group members."
        },
        "customPrizes": {
          "title": "Custom Prizes",
          "description": "Set your own stakes. Winner buys pizza? Loser does dishes? You decide what's on the line."
        },
        "detailedStats": {
          "title": "Detailed Stats",
          "description": "Compare prediction accuracy, see trends, and analyze who's the real prediction champion."
        }
      },
      "howItWorks": {
        "headline": "How It Works",
        "subtitle": "Choose your path and get started in minutes",
        "tabs": {
          "create": "Create a Group",
          "joinPrivate": "Join a Private Group",
          "joinPublic": "Join a Public Group"
        },
        "createGroup": {
          "step1": {
            "title": "Create Your Group",
            "description": "Click "Create Group", give it a name, and choose whether it's private or public.",
            "tip": "Private groups require an invite link. Public groups appear in the directory for anyone to join."
          },
          "step2": {
            "title": "Share the Invite Link",
            "description": "Share your unique invite link via text, email, or social media. Friends click it to request to join.",
            "tip": "For private groups: Only people with the link can request access. You can revoke the link anytime."
          },
          "step3": {
            "title": "Approve Members",
            "description": "You'll receive notifications when people request to join. Review and approve members to add them to the group.",
            "tip": "As admin, you're responsible for managing the approval queue. Members can't join until you approve them."
          },
          "step4": {
            "title": "Start Competing",
            "description": "Once members are approved, everyone makes predictions and the leaderboard updates automatically. Let the games begin!",
            "tip": "Continue managing members, customize settings, and set group prizes."
          }
        },
        "joinPrivate": {
          "step1": {
            "title": "Get an Invite Link",
            "description": "Ask the group admin to send you the invite link. They can find it in their group settings.",
            "tip": "Private groups don't appear in public searches. You must have the invite link to request access."
          },
          "step2": {
            "title": "Request to Join",
            "description": "Click the invite link, review the group details, and submit your request to join.",
            "tip": "You'll see the group name, member count, and description before requesting."
          },
          "step3": {
            "title": "Wait for Approval",
            "description": "The group admin will review your request. You'll get notified when they approve or deny it.",
            "tip": "Approval times vary by admin. Check back or wait for the notification!"
          },
          "step4": {
            "title": "You're In!",
            "description": "Once approved, you're part of the group. Make predictions and see how you stack up on the leaderboard!",
            "tip": "Your existing predictions count toward the group leaderboard immediately."
          }
        },
        "joinPublic": {
          "step1": {
            "title": "Browse Public Groups",
            "description": "Click "Discover Public Groups" to see all open groups. Filter by size, activity, or tournament.",
            "tip": "Public groups appear in the directory—no invite link needed! See member counts and descriptions."
          },
          "step2": {
            "title": "Request to Join",
            "description": "Click any group to see details and description. When you find one you like, submit your request to join.",
            "tip": "You can request to join as many groups as you want—private or public!"
          },
          "step3": {
            "title": "Wait for Approval",
            "description": "The group admin will review your request. You'll get notified when they approve you.",
            "tip": "Even public groups require approval to maintain group quality and prevent spam."
          },
          "step4": {
            "title": "Start Competing!",
            "description": "Once approved, you're in! Your predictions count toward the leaderboard and you can see how you rank.",
            "tip": "Your existing predictions are immediately included in the group standings."
          }
        }
      },
      "useCases": {
        "headline": "Popular Ways to Use Groups",
        "familyFriends": {
          "title": "Family & Friends",
          "description": "Keep in touch across distances. Make every match a shared experience with your loved ones."
        },
        "officeCompetitions": {
          "title": "Office Competitions",
          "description": "Boost team morale with friendly workplace rivalries. Winner gets the parking spot!"
        },
        "barFanClubs": {
          "title": "Bar & Fan Clubs",
          "description": "Unite your local supporters. Perfect for sports bars or fan club meetups."
        },
        "collegeDorms": {
          "title": "College Dorms",
          "description": "Rally your floor or fraternity. Tournament season just got more interesting."
        }
      },
      "finalCta": {
        "headline": "Ready to Get Started?",
        "createButton": "Create a Private Group",
        "discoverButton": "Browse Public Groups"
      }
    }
  }
}
```

### 4. Material-UI Components Used

- `Box`, `Typography`, `Button`, `Stack`, `Grid` - Layout
- `Card`, `CardContent` - Feature cards
- `Tabs`, `Tab`, `TabPanel` - How It Works section (custom implementation)
- Icons from `@mui/icons-material`: `EmojiEvents` (trophy), `Lock`, `Public`, `BarChart`, `Chat`, `EmojiEvents`, `TrendingUp`
- Theme colors: `primary.main`, `secondary.main`, `text.primary`, `text.secondary`, `background.paper`

### 5. Styling Approach

- Use `sx` prop for component-level styles
- Follow existing patterns from `empty-groups-state.tsx`
- Responsive breakpoints: `xs`, `sm`, `md`
- Dark mode compatible (no hardcoded colors)
- Hover effects on cards
- Smooth transitions

### 6. State Management

**Sidebar Component:**
- No internal state needed
- Props: `onCreateGroup`, `onDiscoverGroups`, `onLearnMore`

**Landing Component:**
- Tab selection state: `const [activeTab, setActiveTab] = useState('create')`
- All other state handled by parent (`TournamentGroupsList`)

## Visual Prototypes

### Sidebar Card Empty State (Compact)

```
┌────────────────────────────────────────┐
│ Friend Groups                    ▼    │
├────────────────────────────────────────┤
│                                        │
│              🏆                        │
│                                        │
│        Compete with Friends!           │
│                                        │
│   Create private groups or join        │
│   public competitions to track your    │
│   predictions against others.          │
│                                        │
│   ✓ Private leaderboards               │
│   ✓ Compete for bragging rights        │
│   ✓ Track progress together            │
│                                        │
│   [    Create Group     ]              │
│   [  Discover Public Groups  ]         │
│                                        │
│   Learn more about groups →            │
│                                        │
└────────────────────────────────────────┘
```

**Key Elements:**
- Trophy emoji (not icon) for simplicity
- Value-first headline (not "No groups yet")
- Brief but compelling description
- 3 benefits with checkmarks
- Two CTAs with clear visual hierarchy
- "Learn more" link to landing page

**Responsive Behavior:**
- Mobile: Full width, buttons stack vertically
- Desktop: Maintain compact sidebar width (320px max)

### Landing Page Empty State (Full)

**Hero Section:**
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                      🏆                                │
│                                                        │
│          Predictions Are Better with Friends           │
│                                                        │
│  Create private groups for your crew or discover       │
│  public competitions. Track predictions, climb         │
│  leaderboards, and earn bragging rights.               │
│                                                        │
│  [ Create Your First Group ]  [ 🔍 Discover Public ] │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Features Section (6 cards in responsive grid):**
```
┌─────────────┬─────────────┬─────────────┐
│     🔒     │     🌍     │     📊     │
│   Private  │   Public   │    Live    │
│   Groups   │ Competitions│Leaderboards│
│             │             │             │
│ [description]│[description]│[description]│
└─────────────┴─────────────┴─────────────┘
┌─────────────┬─────────────┬─────────────┐
│     💬     │     🎯     │     📈     │
│   Group    │   Custom   │  Detailed  │
│    Chat    │   Prizes   │   Stats    │
│             │             │             │
│ [description]│[description]│[description]│
└─────────────┴─────────────┴─────────────┘
```

**How It Works (Tabbed Interface):**
```
┌────────────────────────────────────────────────────────┐
│               How It Works                             │
│   Choose your path and get started in minutes          │
│                                                        │
│  [ Create a Group ]  [ Join Private ]  [ Join Public ]│
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  │    1     │  │    2     │  │    3     │  │    4     │
│  │   ✏️     │  │   📤     │  │   ✅     │  │   🏆     │
│  │          │  │          │  │          │  │          │
│  │ Create   │  │  Share   │  │ Approve  │  │  Start   │
│  │  Your    │  │  Invite  │  │ Members  │  │Competing │
│  │  Group   │  │   Link   │  │          │  │          │
│  │          │  │          │  │          │  │          │
│  │[descrip] │  │[descrip] │  │[descrip] │  │[descrip] │
│  │          │  │          │  │          │  │          │
│  │ 💡 Tip:  │  │ 💡 Tip:  │  │ ⚠️ Imp:  │  │ 💡 Tip:  │
│  │ [tip]    │  │ [tip]    │  │ [tip]    │  │ [tip]    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Key Aspects of Tabbed Interface:**
- 3 tabs: Create, Join Private, Join Public
- Each tab shows 4 steps in a grid
- Steps include: step number badge, emoji, title, description, tip note
- Tab state managed with React state
- Smooth fade transitions between tabs

**Use Cases Section:**
```
┌────────────────────────────────────────────────────────┐
│           Popular Ways to Use Groups                   │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │ 👨‍👩‍👧‍👦 Family│  │ 💼 Office   │                  │
│  │  & Friends   │  │ Competitions │                  │
│  │              │  │              │                  │
│  │ [description]│  │ [description]│                  │
│  └──────────────┘  └──────────────┘                  │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │ 🍺 Bar &    │  │ 🏫 College  │                  │
│  │  Fan Clubs   │  │    Dorms     │                  │
│  │              │  │              │                  │
│  │ [description]│  │ [description]│                  │
│  └──────────────┘  └──────────────┘                  │
└────────────────────────────────────────────────────────┘
```

**Final CTA:**
```
┌────────────────────────────────────────────────────────┐
│ ╔════════════════════════════════════════════════════╗ │
│ ║         Ready to Get Started?                      ║ │
│ ║                                                    ║ │
│ ║  [ Create a Private Group ]  [ Browse Public ]    ║ │
│ ╚════════════════════════════════════════════════════╝ │
└────────────────────────────────────────────────────────┘
```

**Responsive Behavior:**
- **Mobile (xs)**: All grids collapse to single column, tabs stack
- **Tablet (sm/md)**: 2 columns for features/steps, horizontal tabs
- **Desktop (lg)**: 3 columns for features, 4 columns for steps, horizontal tabs

## Pre-Implementation Checklist

**Complete these verification steps BEFORE starting Phase 1:**

1. **Verify directory structure:**
   ```bash
   # Check if directory exists
   ls -la /Users/gvinokur/Personal/qatar-prode-story-238/app/components/friend-groups/

   # If not exists, create it
   mkdir -p /Users/gvinokur/Personal/qatar-prode-story-238/app/components/friend-groups/empty-state/
   ```

2. **Verify old component usage:**
   ```bash
   # Search for empty-groups-state.tsx usage
   grep -r "empty-groups-state" /Users/gvinokur/Personal/qatar-prode-story-238/app --include="*.tsx" --include="*.ts"
   grep -r "EmptyGroupsState" /Users/gvinokur/Personal/qatar-prode-story-238/app --include="*.tsx" --include="*.ts"
   ```
   - If ONLY used in `tournament-groups-list.tsx`, safe to replace
   - If used elsewhere, deprecate with comment instead of deleting

3. **Verify landing page route:**
   - Confirm route `/{locale}/tournaments/{tournamentId}/friend-groups` exists
   - Check: `/app/[locale]/tournaments/[id]/friend-groups/page.tsx`
   - This is the landing page where `TournamentGroupsList` renders

4. **Confirm theme colors:**
   - Mockup uses `#f48fb1` (pink) and `#90caf9` (blue)
   - Verify these map to Material-UI theme colors
   - Use `theme.palette.primary.main` and `theme.palette.secondary.main` instead of hardcoding

5. **Icon strategy decision:**
   - **Decision: Use Material-UI icons** (not emojis from mockup)
   - Ensures consistency with existing codebase
   - Maps: 🔒→Lock, 🌍→Public, 📊→BarChart, 💬→Chat, 🎯→EmojiEvents, 📈→TrendingUp
   - Keep trophy emoji (🏆) for hero sections only

6. **Spanish translation approach:**
   - **Decision: Create English keys first, then AI-translate to Spanish**
   - Mark Spanish translations with comment: `// AI-translated, needs review`
   - User will review Spanish in Vercel Preview before merge

## Implementation Steps

### Phase 0: Pre-Implementation (Required First)

**Complete Pre-Implementation Checklist above before proceeding.**

### Phase 1: Foundation (Files & i18n)

1. **Create directory structure:**
   ```bash
   mkdir -p app/components/friend-groups/empty-state/
   ```
   Creates:
   ```
   app/components/friend-groups/
   ├── empty-state/
   │   ├── StepCard.tsx
   │   ├── HowItWorksTabs.tsx
   │   ├── FeatureCards.tsx
   │   └── UseCases.tsx
   ├── FriendGroupsSidebarEmptyState.tsx
   └── FriendGroupsLandingEmptyState.tsx
   ```

2. **Add i18n translations:**
   - Add `emptyState` section to `locales/en/groups.json` (English - complete)
   - Add `emptyState` section to `locales/es/groups.json` (Spanish - AI-translated with review comment)
   - Mark Spanish keys with `// AI-translated, needs review` in commit message

### Phase 2: Sub-Components (Bottom-Up)

3. **Create `StepCard.tsx`:** (reusable component to avoid duplication)
   - Location: `app/components/friend-groups/empty-state/`
   - Single step display: number badge, icon, title, description, tip
   - Props: `stepNumber`, `icon`, `title`, `description`, `tip`
   - Used by HowItWorksTabs to avoid 3x duplication across tabs

4. **Create `FeatureCards.tsx`:**
   - 6 feature cards in responsive grid
   - Props: none (uses translations directly)
   - Use Material-UI icons: `Lock`, `Public`, `BarChart`, `Chat`, `EmojiEvents`, `TrendingUp`
   - Hover effects

5. **Create `HowItWorksTabs.tsx`:**
   - Tabbed interface with 3 scenarios
   - 4 steps per scenario (uses StepCard component)
   - Tab state management
   - Props: none (uses translations directly)
   - Keep under 300 lines by using StepCard sub-component

6. **Create `UseCases.tsx`:**
   - 4 use case cards
   - Simple grid layout
   - Props: none (uses translations directly)

### Phase 3: Main Components

6. **Create `FriendGroupsLandingEmptyState.tsx`:**
   - Compose: Hero + FeatureCards + HowItWorksTabs + UseCases + Final CTA
   - Props: `onCreateGroup`, `onDiscoverGroups`, `tournamentId`
   - Use translations from `groups.emptyState.landing`

7. **Create `FriendGroupsSidebarEmptyState.tsx`:**
   - Compact design with icon, headline, benefits, CTAs, learn more link
   - Props: `onCreateGroup`, `onDiscoverGroups`, `onLearnMore`
   - Use translations from `groups.emptyState.sidebar`

### Phase 4: Integration

8. **Modify `friend-groups-list.tsx` (Sidebar):**
   - Import `FriendGroupsSidebarEmptyState`
   - Replace basic buttons in `CardActions` with new component when no groups
   - Add `onLearnMore` handler to navigate to landing page (`/{locale}/tournaments/${tournamentId}/friend-groups`)
   - Keep existing dialogs and functionality

9. **Modify `tournament-groups-list.tsx` (Landing):**
   - Import `FriendGroupsLandingEmptyState`
   - Replace `<EmptyGroupsState />` with new component
   - Keep existing dialog logic

10. **Deprecate `empty-groups-state.tsx`:**
    - Add deprecation comment
    - Verify not used elsewhere (grep search)
    - If only used in one place, can delete

### Phase 5: Responsive & Polish

11. **Test responsive behavior at specific breakpoints:**
    - **xs (<600px - Mobile):**
      - All grids collapse to single column
      - Buttons stack vertically
      - Tabs remain horizontal (Material-UI default)
      - Feature cards: 1 per row
      - Step cards: 1 per row
    - **sm (600-900px - Tablet):**
      - Feature cards: 2 per row
      - Step cards: 2 per row
      - Buttons: horizontal if space allows
    - **md (900-1200px - Desktop):**
      - Feature cards: 3 per row
      - Step cards: 2-4 per row depending on content
    - **lg (1200px+ - Large Desktop):**
      - Feature cards: 3 per row
      - Step cards: 4 per row (full 4-step flow visible)
    - Use browser DevTools responsive mode to test each breakpoint
    - Verify no horizontal scroll at any breakpoint

12. **Add transitions & hover effects:**
    - Card hover effects: `transform: translateY(-4px)` + shadow
    - Tab switching: 300ms fade with `theme.transitions.duration.standard`
    - Button hover states: use Material-UI default hover (lighten/darken)
    - Feature cards: border color change on hover (primary.main)

## Testing Strategy

### Unit Tests

**Test files to create:**

1. **`__tests__/components/friend-groups/FriendGroupsSidebarEmptyState.test.tsx`:**
   - Renders all text content
   - Renders trophy icon
   - Renders benefits list (3 items)
   - Renders CTAs
   - Renders "learn more" link
   - Calls `onCreateGroup` when button clicked
   - Calls `onDiscoverGroups` when button clicked
   - Calls `onLearnMore` when link clicked
   - Responsive layout (snapshot tests)

2. **`__tests__/components/friend-groups/FriendGroupsLandingEmptyState.test.tsx`:**
   - Renders hero section
   - Renders all sub-components (FeatureCards, HowItWorksTabs, UseCases)
   - Renders final CTA
   - Calls `onCreateGroup` from hero and final CTA
   - Calls `onDiscoverGroups` from hero and final CTA
   - Integration: all sections visible on initial render

3. **`__tests__/components/friend-groups/empty-state/HowItWorksTabs.test.tsx`:**
   - Renders all 3 tabs
   - Default tab is "Create a Group" (active)
   - Shows correct 4 steps for each tab
   - Tab switching works (click tab, content changes)
   - Renders step number badges (1-4)
   - Renders step icons, titles, descriptions, tips

4. **`__tests__/components/friend-groups/empty-state/StepCard.test.tsx`:**
   - Renders step number badge
   - Renders icon, title, description
   - Renders tip note (if provided)
   - Props validation

5. **`__tests__/components/friend-groups/empty-state/FeatureCards.test.tsx`:**
   - Renders all 6 feature cards
   - Each card has icon, title, description
   - Responsive grid layout

6. **`__tests__/components/friend-groups/empty-state/UseCases.test.tsx`:**
   - Renders all 4 use case cards
   - Each card has emoji, title, description

**Test utilities to use:**
- `renderWithTheme()` from `@/__tests__/utils/test-utils` (MANDATORY)
- `screen` queries from `@testing-library/react`
- `userEvent` from `@testing-library/user-event` for interactions
- `vi.fn()` for mocking callbacks

**Important Testing Notes:**
- **Next.js Link mocking:** If tests use Link component, mock it like existing tests:
  ```typescript
  vi.mock('next/link', () => ({
    default: ({ children, href }: any) => <a href={href}>{children}</a>
  }))
  ```
- **Tab switching tests:** Verify both:
  - Active tab content is visible (`expect(screen.getByText(...)).toBeVisible()`)
  - Inactive tab content is NOT in document (`expect(screen.queryByText(...)).not.toBeInTheDocument()`)
- **Translation testing:** Focus on verifying text content renders, not testing `useTranslations()` calls

**Coverage Requirements:**
- 80% coverage on all new code (SonarCloud enforces this)
- Focus on user interactions (button clicks, tab switches)
- Test i18n key usage (verify translations are called)

### Integration Tests

**Modified components need updated tests:**

1. **Update `__tests__/components/tournament-page/friend-groups-list.test.tsx`:**
   - Add test: "renders sidebar empty state when no groups"
   - Verify new empty state component is rendered
   - Verify "learn more" link navigates to landing page

2. **Update `__tests__/components/tournament-page/tournament-groups-list.test.tsx`:**
   - Update test: "shows empty state when no groups"
   - Verify new landing empty state component is rendered (not old one)

### Manual Testing Checklist

After implementation:
- [ ] Sidebar card displays correctly in collapsed state
- [ ] Sidebar card displays correctly in expanded state
- [ ] "Learn more" link navigates to landing page
- [ ] Landing page displays all sections (hero, features, how it works, use cases, final CTA)
- [ ] Tab switching works smoothly
- [ ] All 3 scenarios show correct 4 steps
- [ ] "Create Group" button opens dialog (both locations)
- [ ] "Discover Groups" button navigates correctly
- [ ] Mobile responsive (all elements stack)
- [ ] Dark mode colors look correct
- [ ] i18n works for both English and Spanish

## Validation Considerations

### SonarCloud Quality Gates

1. **Code Coverage:**
   - Target: ≥80% on new code
   - All new components need comprehensive unit tests
   - Use test utilities (MANDATORY)

2. **Code Quality:**
   - 0 new issues of any severity
   - No code duplication (use shared sub-components)
   - Proper TypeScript types (no `any` types)
   - Component props clearly defined

3. **Maintainability:**
   - Keep components focused and small (<300 lines)
   - Separate concerns (sub-components)
   - Clear naming conventions

4. **Security:**
   - No hardcoded strings (use i18n)
   - Proper prop validation
   - No XSS vulnerabilities (use React's built-in escaping)

### Pre-Commit Checklist

Before committing:
- [ ] All tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] i18n keys are properly defined for both locales
- [ ] No console errors in browser
- [ ] Visual review matches mockup intent

## Files to Create

1. `app/components/friend-groups/FriendGroupsSidebarEmptyState.tsx` - New
2. `app/components/friend-groups/FriendGroupsLandingEmptyState.tsx` - New
3. `app/components/friend-groups/empty-state/StepCard.tsx` - New (reusable component)
4. `app/components/friend-groups/empty-state/HowItWorksTabs.tsx` - New
5. `app/components/friend-groups/empty-state/FeatureCards.tsx` - New
6. `app/components/friend-groups/empty-state/UseCases.tsx` - New
7. `__tests__/components/friend-groups/FriendGroupsSidebarEmptyState.test.tsx` - New
8. `__tests__/components/friend-groups/FriendGroupsLandingEmptyState.test.tsx` - New
9. `__tests__/components/friend-groups/empty-state/StepCard.test.tsx` - New
10. `__tests__/components/friend-groups/empty-state/HowItWorksTabs.test.tsx` - New
11. `__tests__/components/friend-groups/empty-state/FeatureCards.test.tsx` - New
12. `__tests__/components/friend-groups/empty-state/UseCases.test.tsx` - New

## Files to Modify

1. `app/components/tournament-page/friend-groups-list.tsx` - Integrate sidebar empty state
2. `app/components/tournament-page/tournament-groups-list.tsx` - Integrate landing empty state
3. `locales/en/groups.json` - Add `emptyState` section
4. `locales/es/groups.json` - Add `emptyState` section
5. `__tests__/components/tournament-page/friend-groups-list.test.tsx` - Update tests
6. `__tests__/components/tournament-page/tournament-groups-list.test.tsx` - Update tests

## Files to Deprecate/Consider

1. `app/components/tournament-page/empty-groups-state.tsx` - Mark as deprecated (add comment) or delete if only used in one place

## Decisions Made (Resolved Questions)

1. **Spanish translations:** ✅ **RESOLVED**
   - **Decision:** Create English keys first, then AI-translate to Spanish
   - Mark Spanish translations in commit message: "AI-translated, needs review"
   - User will review Spanish translations during Vercel Preview testing

2. **Navigation for "Learn More" link:** ✅ **RESOLVED**
   - **Decision:** Same tab navigation to `/{locale}/tournaments/{tournamentId}/friend-groups`
   - Consistent with existing navigation patterns
   - `onLearnMore` handler will use Next.js router to navigate

3. **Icons vs. Emojis:** ✅ **RESOLVED**
   - **Decision:** Use Material-UI icons for consistency with existing codebase
   - Import from `@mui/icons-material`: `Lock`, `Public`, `BarChart`, `Chat`, `EmojiEvents`, `TrendingUp`
   - **Exception:** Keep trophy emoji (🏆) for hero sections (simpler, more playful)
   - Mockup emojis → Material-UI icon mapping complete

4. **Empty state in sidebar when collapsed:** ✅ **RESOLVED**
   - **Decision:** No, only show when expanded (existing behavior)
   - Empty state appears in `<Collapse in={expanded}>` section

5. **Animation duration for tab switching:** ✅ **RESOLVED**
   - **Decision:** 300ms fade transition (standard Material-UI duration)
   - Use `theme.transitions.duration.standard`

6. **Step card duplication:** ✅ **RESOLVED** (from reviewer feedback)
   - **Decision:** Create reusable `StepCard.tsx` component
   - Avoids 3x duplication across Create/Join Private/Join Public tabs
   - Keeps HowItWorksTabs.tsx under 300 lines (SonarCloud maintainability)

## Risk Assessment

### Low Risk
- Component structure is straightforward
- No complex state management
- No API changes
- No database changes
- i18n infrastructure already exists

### Medium Risk
- Comprehensive i18n (many translation keys to manage)
- Responsive design requires careful testing
- Integration with existing components (need to verify no regressions)

### Mitigation Strategies
- Start with sub-components (easier to test in isolation)
- Use existing patterns from codebase
- Extensive unit test coverage
- Manual testing on multiple screen sizes
- Review Spanish translations with user

## Success Metrics

After deployment, monitor:
- Friend group creation rate (should increase)
- "Discover Groups" button clicks (measure engagement)
- Time spent on friend groups landing page (measure education)
- Join request submission rate (measure conversion)
- User feedback on clarity of approval process

## Out of Scope

- Modifying main onboarding flow
- Showing public group leaderboards before joining
- Additional friend group features beyond discovery
- Backend changes to approval workflow
- Group chat implementation (mentioned in feature cards but not yet implemented)
- Custom prizes functionality (mentioned in feature cards but not yet implemented)

These features are referenced in the copy for aspirational/marketing purposes but are not part of this implementation.

## Notes

- The mockup uses pink/red colors for demonstration. Implementation should use app's existing primary color theme (red) from Material-UI theme.
- Admin responsibility and approval workflow are critical messaging points - ensure they're prominent in the UI.
- Progressive disclosure strategy: Sidebar → Landing page helps avoid overwhelming users while still providing comprehensive information.
