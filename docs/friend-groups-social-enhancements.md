# Friend Groups: Social Enhancements Project

**Date:** March 5, 2026
**Status:** Planning Phase
**Focus:** Shareability + Comparison (Phase 1)

---

## Executive Summary

This document outlines enhancements to the friend-groups page focused on adding "niceties" - delightful features that increase engagement without overwhelming users. The core theme is **making friend-groups more social** through easy sharing (especially WhatsApp) and head-to-head comparisons that enable friendly banter.

**Phase 1 Scope:** 3-4 days of implementation
**Expected Impact:** Increased social sharing, deeper engagement, organic growth through shared content

---

## Current State Analysis

### What We Have Now

**Friend-Groups Page (`/tournaments/[id]/friend-groups/[group_id]`):**
- ✅ Group header with logo, name, privacy indicator
- ✅ Leaderboard table with detailed scoring breakdown
- ✅ Admin tabs (join requests, settings, betting configuration)
- ✅ Multi-tournament support via tabs
- ✅ **Rank change animations** (+3/-1 indicators with colors) ✨

**Strengths:**
- Clean, functional interface
- Comprehensive scoring display
- Strong admin capabilities
- Responsive design

**Gaps:**
- Limited social interaction beyond viewing standings
- No easy way to share achievements or comparisons
- No comparative analysis (you vs specific friend)
- Static feel (only updates when you refresh)
- Missed opportunities for banter and friendly competition

---

## Brainstorming Results

### All Ideas Evaluated

We evaluated 25+ potential enhancements across categories:
- 🗣️ Social Interaction & Engagement
- 📊 Visualization & Comparison
- 🏆 Group Milestones & Recognition
- 🎨 Customization & Personality
- ⚙️ Quality of Life
- 🎮 Mini-Gamification

### Scoring Framework

Each idea scored on:
- **Value**: Impact on user experience (1-5)
- **Effort**: Implementation complexity (1-5, lower = easier)
- **"Nicety" Fit**: Delightful addition vs overwhelming feature (1-5)
- **Priority Score**: Value × Nicety Fit ÷ Effort

### Top-Ranked Ideas

| Rank | Feature | Priority Score | Category |
|------|---------|---------------|----------|
| 1 | QR Code Invite | 20.0 | QoL |
| 2 | ~~Visual Rank Indicators~~ | ~~15.0~~ | ✅ **DONE** |
| 3 | Performance Badges | 13.3 | Visualization |
| 4 | Export/Share Leaderboard | 8.0 | Social |
| 5 | Prediction Consensus | 8.0 | Social |
| 6 | Head-to-Head Comparison | 6.7 | Comparison |
| 7 | Category Leaders | 6.0 | Recognition |
| 8 | Quick Stats Card | 6.0 | Visualization |
| 9 | Rank History Graph | 5.3 | Visualization |
| 10 | Activity Feed | 5.0 | Social |

### Rejected Stories

**Story #24 (Achievement System):**
- ❌ Too large for "nicety" scope (7-10 days)
- ❌ Risk of overwhelming the page
- ❌ Better as standalone profile feature
- **Status:** Closed as "won't do"

**Story #25 (Enhanced Statistics Dashboard):**
- ❌ Leans toward major feature (4-5 days)
- ❌ More about personal performance than social/comparative
- ❌ Not aligned with shareability/banter theme
- **Status:** Closed as "won't do"

---

## Phase 1: Banter Starter Pack

### Overview

**Goal:** Enable social sharing and friend comparisons to drive engagement and friendly competition.

**Duration:** 3-4 days
**Core Features:** 3
**Theme:** Shareability + Comparison

---

## Phase 1 Features

### Feature 1: Head-to-Head Comparison View

**Description:**
Click any member in the leaderboard to see a detailed comparison between you and them.

**User Flow:**
1. User clicks any member name in leaderboard
2. Modal/page opens with head-to-head comparison
3. Shows:
   - Total points (you vs them)
   - Accuracy percentage
   - Category breakdown (Group Stage, Playoffs, etc.)
   - Advantages highlighted ("You're ahead in Playoffs +45 pts")
   - Their advantages ("They're ahead in Group Stage +12 pts")
4. Share button generates WhatsApp-optimized image

**UI Mockup:**
```
┌─────────────────────────────────────────┐
│  🥊 HEAD TO HEAD                        │
├─────────────────────────────────────────┤
│                                         │
│       YOU              MARIA            │
│   ┌─────────┐      ┌─────────┐        │
│   │  1,250  │      │  1,180  │  Points│
│   └─────────┘      └─────────┘        │
│                                         │
│       68%              64%      Accuracy│
│                                         │
│  ┌───────────────────────────────┐     │
│  │ ✅ YOUR ADVANTAGES:           │     │
│  │                               │     │
│  │  Playoffs:      +45 pts       │     │
│  │  Accuracy:      +4%           │     │
│  │  Boost Usage:   Better timing │     │
│  └───────────────────────────────┘     │
│                                         │
│  ┌───────────────────────────────┐     │
│  │ ⚠️  THEIR ADVANTAGES:          │     │
│  │                               │     │
│  │  Group Stage:   +12 pts       │     │
│  └───────────────────────────────┘     │
│                                         │
│  [📤 Share Comparison]  [Close]        │
└─────────────────────────────────────────┘
```

**Banter-Friendly Copy Options:**
- "I'm crushing it! 🔥"
- "Catching up... 👀"
- "The gap is closing! 😅"
- "Still ahead! 💪"
- Custom message input

**Technical Notes:**
- New component: `HeadToHeadComparison.tsx`
- Use existing `UserScore` data from `getUserScoresForTournament`
- Calculate category-by-category differences
- Share function generates image (see Feature 2)

**Effort:** 2 days

---

### Feature 2: Export & Share System

**Description:**
Generate WhatsApp-optimized images for easy sharing of leaderboards, comparisons, and achievements.

**Share Types:**

#### 2a. Leaderboard Snapshot
- Current standings with user's rank highlighted
- Top 5 members shown (or all if small group)
- User's position always visible
- QR code for joining group

**Image Format:**
```
╔══════════════════════════════════════╗
║   🏆 La Maquina - FIFA World Cup     ║
║                                      ║
║   1. 👑 Maria        1,250 pts       ║
║   2. 🥈 Pedro        1,180 pts       ║
║   3. 🥉 YOU          1,120 pts    ⭐ ║
║   4.    John         1,050 pts       ║
║   5.    Ana            980 pts       ║
║                                      ║
║   📈 You're 130 points from #1!      ║
║                                      ║
║   Join our group: [QR Code]          ║
║   qatar-prode.app/join/xyz           ║
╚══════════════════════════════════════╝
```

#### 2b. Head-to-Head Card
- Comparison summary (from Feature 1)
- Key stats highlighted
- Link to join group

**Image Format:**
```
╔══════════════════════════════════════╗
║   🥊 HEAD TO HEAD                    ║
║                                      ║
║   YOU (1,120)  vs  MARIA (1,250)     ║
║                                      ║
║   🎯 Accuracy:    68%  <  72%        ║
║   ⚡ Playoffs:   +45  >  +32         ║
║   🏆 Rank:         #3  <  #1         ║
║                                      ║
║   💬 "The gap is closing!"           ║
║                                      ║
║   Play with us: qatar-prode.app/...  ║
╚══════════════════════════════════════╝
```

#### 2c. Personal Highlight
- "I moved up 3 places!" celebration
- Before/after rank
- Points gained

**Implementation Options:**

**Option A: Canvas-based image generation (Recommended)**
- Use HTML Canvas API
- Render styled cards server-side or client-side
- Export as PNG
- Pros: Full control, no external dependencies
- Cons: More implementation work

**Option B: html-to-image library**
- Use libraries like `html-to-image` or `dom-to-image`
- Render React component → capture as image
- Pros: Easier to style with existing components
- Cons: Library dependency

**Option C: Server-side image generation**
- Use Puppeteer/Playwright on server
- Generate OG-style images
- Pros: Consistent rendering
- Cons: Server resources, slower

**Recommendation:** Start with Option B (html-to-image), consider Option A if needed.

**WhatsApp Integration:**
```typescript
// Share via Web Share API (mobile) or copy link (desktop)
const shareToWhatsApp = async (imageBlob: Blob, text: string) => {
  if (navigator.share && navigator.canShare({ files: [imageBlob] })) {
    // Native share (mobile)
    await navigator.share({
      files: [new File([imageBlob], 'leaderboard.png', { type: 'image/png' })],
      text: text,
    });
  } else {
    // Fallback: Download image + copy text
    downloadImage(imageBlob);
    copyToClipboard(text);
    showToast('Image downloaded! Text copied to clipboard.');
  }
};
```

**Technical Notes:**
- New utility: `app/utils/share-utils.ts`
- New component: `ShareButton.tsx` (reusable)
- Image generation functions per type
- Analytics tracking for shares

**Effort:** 1.5 days

---

### Feature 3: Quick Share Actions

**Description:**
Add share buttons throughout the UI for easy access to sharing functionality.

**Share Button Placements:**

1. **Leaderboard Card Header**
   - "📤 Share Standings" button
   - Opens share modal with options

2. **After Rank Change**
   - Toast notification: "You moved up 2 places! Share?"
   - Quick share action

3. **On Member Row (Desktop)**
   - Hover action: "Compare" button
   - Opens head-to-head view

4. **Group Header**
   - "Share Group" button
   - Generates invite with QR code

**Share Modal:**
```
┌─────────────────────────────────────┐
│  Share Leaderboard                  │
├─────────────────────────────────────┤
│                                     │
│  What do you want to share?         │
│                                     │
│  ○ Current Standings                │
│  ○ My Rank Change (+2 places!)      │
│  ○ Group Invite                     │
│                                     │
│  [Preview Image]                    │
│                                     │
│  Message (optional):                │
│  ┌─────────────────────────────┐   │
│  │ Check out our group! 🏆     │   │
│  └─────────────────────────────┘   │
│                                     │
│  [📤 Share to WhatsApp]  [Cancel]  │
└─────────────────────────────────────┘
```

**Technical Notes:**
- Update `friends-group-table.tsx` to add share button
- Add share action to rank change animations
- New component: `ShareModal.tsx`

**Effort:** 0.5 days

---

## Phase 1 Implementation Plan

### Total Effort: 4 days

| Task | Duration | Dependencies |
|------|----------|--------------|
| 1. Head-to-Head Comparison UI | 1.5 days | None |
| 2. Image generation system | 1 day | None |
| 3. WhatsApp share integration | 0.5 days | Task 2 |
| 4. Share buttons in UI | 0.5 days | Task 2 |
| 5. Testing & refinement | 0.5 days | All above |

### Story Creation

Create the following GitHub issues:

1. **Story: Head-to-Head Comparison View**
   - Labels: `type/ux-improvement`, `priority/high`
   - Effort: 2 days
   - Category: Social

2. **Story: Export & Share System (WhatsApp)**
   - Labels: `type/ux-improvement`, `priority/high`
   - Effort: 1.5 days
   - Category: Social

3. **Story: Quick Share Actions**
   - Labels: `type/ux-improvement`, `priority/medium`
   - Effort: 0.5 days
   - Category: UX Polish
   - Depends on: Story 2

---

## Success Metrics

### Primary Metrics
- **Share Actions**: Track number of shares per week
- **WhatsApp Shares**: Specific tracking for WhatsApp vs other channels
- **Head-to-Head Views**: How many comparisons are viewed
- **Invite Conversions**: New members from shared invites

### Secondary Metrics
- Time spent on friend-groups page (+20% expected)
- Return visits to group page (+25% expected)
- Group activity/engagement (predictions, interactions)

### Analytics Implementation
```typescript
// Track share events
trackEvent('friend_group_share', {
  share_type: 'leaderboard' | 'head_to_head' | 'invite',
  channel: 'whatsapp' | 'other' | 'download',
  group_id: string,
  tournament_id: string,
});

// Track comparison views
trackEvent('head_to_head_view', {
  group_id: string,
  compared_user_id: string,
});
```

---

## Future Phases

### Phase 2: Score History + Badge System
*Replaces original Phase 2. Stories A and B can be worked in parallel; Story C depends on A.*

---

#### Story A: Score History Infrastructure + Rank Graph UI (~3 days)

**Why first:** Current system only stores a single "yesterday" snapshot. Full score history is foundational for time-dimension badges (Story C) and the rank graph UI.

**Infrastructure:**
- New `tournament_score_history` table: one row per user per tournament per day (`user_id`, `tournament_id`, `date`, `total_points`, `rank`)
- Daily snapshot mechanism — on each score recalculation, write to history if no row exists for today (same guard pattern as existing `last_score_update_date`)
- **Cold-start note:** No backfill possible for Copa America. FIFA 2026 will have full history from day 1.

**UI:**
- Rank history line chart in the leaderboard (inside expanded card or dedicated tab)
- Shows rank trajectory across tournament days
- Complements existing rank change animations

---

#### Story B: Badge System Foundation + Core Badges (~2-3 days)
*Can be worked in parallel with Story A — no dependency.*

**Infrastructure:**
- Badge calculation engine: pure TypeScript functions, computed on-the-fly from existing `tournament_guesses` columns (no new DB table needed initially)
- Badge display component in leaderboard cards: icons with tooltip explaining criteria
- i18n support for badge names and descriptions (EN + ES)

**Core badges — all derivable from existing data:**

| Badge | Emoji | Criteria | Est. % earners |
|---|---|---|---|
| Crystal Ball | 👑 | Correctly predicted the champion | ~15–25% |
| Podium Prophet | 🏆 | Correct champion + runner-up | ~5–10% |
| Award Scout | ⭐ | 3+ correct individual awards | ~10–20% |
| Qualifier Expert | 📋 | >70% correct qualified teams | ~20–30% |
| Boost Master | ⚡ | Used all available boosts | ~40–60% |
| Top Dog | 🥇 | Currently #1 in group | 1 per group |
| Podium | 🎖️ | Currently top 3 in group | 3 per group |
| Rocket | 📈 | Biggest rank jump today in group | 1 per group |
| Sharp | 🎯 | Top 25% exact score rate within group (relative, not absolute) | always ~25% of group |
| Lantern Rouge | 🔴 | Currently last in group | 1 per group |
| Wooden Spoon | 🥄 | Lowest qualifier prediction accuracy in group | 1 per group |

**Design note on negative badges:** Not every positive badge has a negative counterpart — just a few fun ones that lean into banter culture. Lantern Rouge and Wooden Spoon are self-aware and playful, not punishing.

**Design note on exact scores:** Exact score thresholds are intentionally avoided for absolute criteria (e.g. ">50% exact") because empirically ~5% of guesses are exact. Relative ranking within the group (Sharp) is used instead.

---

#### Story C: Time-Dimension Badges (~1-2 days)
*Depends on Story A — requires score history data to be rolling.*

All badges below require the `tournament_score_history` table from Story A:

| Badge | Emoji | Criteria | Type |
|---|---|---|---|
| On Fire | 🔥 | Improved rank 3+ consecutive days | Positive |
| Trending Up | 📊 | Net positive rank movement over last 5 days | Positive |
| Slow Burn | 🐢 | Started bottom half, now top 3 | Positive |
| Comeback Kid | 🎢 | Was last place at some point, ended top 3 | Positive |
| Ice Cold | 🧊 | Dropped rank 3+ consecutive days | Negative |
| Free Fall | ⬇️ | Biggest rank drop today in group | Negative |

**Note:** Meaningful data for these badges accumulates progressively through the tournament. Badges will start appearing after day 3 at the earliest.

---

### Phase 3: Social Layer (4-5 days)
- **Activity Feed**: Recent predictions, rank changes, badge awards
- **Member of the Week**: Spotlight top performer
- **Weekly Group Digest**: Auto-generated summary (shareable)

### Phase 4: Advanced Features (5-7 days)
- **Prediction Consensus View**: "80% of group picked Argentina"
- **Category Leaders**: "Best at Playoffs: Maria"
- **Group Milestones**: Celebrate 100 predictions, 10 members, etc.
- **Member Profiles**: Click to see detailed stats/history

---

## Design Guidelines

### Visual Style
- Maintain Material-UI consistency
- Use existing color palette (red primary, theme colors)
- Animations should be subtle and performant
- Mobile-first responsive design

### Copy Tone
- Friendly and playful (match existing app tone)
- Encourage banter without being aggressive
- Celebrate achievements
- Use emojis sparingly but effectively

### Accessibility
- All share images should have alt text
- Keyboard navigation for comparison modal
- ARIA labels for share buttons
- Color contrast compliance

---

## Technical Architecture

### New Components
```
app/components/friend-groups/
  ├── head-to-head/
  │   ├── HeadToHeadComparison.tsx
  │   ├── HeadToHeadModal.tsx
  │   └── ComparisonCard.tsx
  ├── sharing/
  │   ├── ShareButton.tsx
  │   ├── ShareModal.tsx
  │   └── ImageGenerator.tsx
  └── ...existing components
```

### New Utilities
```
app/utils/
  ├── share-utils.ts        # Share functions, image generation
  ├── comparison-utils.ts   # Calculate head-to-head stats
  └── analytics-events.ts   # Event tracking
```

### New Server Actions (if needed)
```
app/actions/
  └── friend-group-sharing-actions.ts  # Generate share links, track shares
```

---

## Testing Plan

### Unit Tests
- Comparison calculation logic
- Image generation utilities
- Share button interactions

### Integration Tests
- Head-to-head modal flow
- Share modal flow
- WhatsApp share (mocked)

### Manual Testing
- Test on multiple devices (iOS, Android, Desktop)
- Test WhatsApp sharing on mobile
- Verify image quality across devices
- Test with various group sizes (small, medium, large)
- Test edge cases (tied ranks, new members, etc.)

---

## Rollout Strategy

### Phase 1 Launch
1. Deploy to staging
2. Internal testing (1 day)
3. Soft launch to subset of groups
4. Monitor metrics for 3-5 days
5. Full rollout if metrics positive

### Communication
- In-app announcement: "New! Compare with friends and share results"
- Tutorial tooltip on first visit: "Click any member to compare!"
- Share success toast: "Shared! Your friends can join here: [link]"

---

## Open Questions / Decisions Needed

1. **Image Generation Approach**: Option A (Canvas) or Option B (html-to-image)?
   - **Recommendation**: Start with Option B for speed, migrate to A if needed

2. **Share Modal vs Direct Share**: Show modal every time or direct share with smart defaults?
   - **Recommendation**: Direct share with smart defaults, "More options" for modal

3. **Comparison Access**: Modal, new page, or slide-in panel?
   - **Recommendation**: Modal for desktop, full page for mobile

4. **Analytics Provider**: Which system to use for tracking shares?
   - **Recommendation**: Use existing analytics setup (Google Analytics / Plausible)

5. **QR Code Generation**: Client-side or server-side?
   - **Recommendation**: Client-side with qrcode.react library

---

## Appendix: Brainstorming Archive

### All Ideas Considered (Full List)

| # | Idea | Value | Effort | Nicety Fit | Priority Score | Status |
|---|------|-------|--------|------------|----------------|--------|
| 1 | QR Code Invite | 4 | 1 | 5 | 20.0 | 💡 Future |
| 2 | Visual Rank Indicators | 3 | 1 | 5 | 15.0 | ✅ Done |
| 3 | Performance Badges | 4 | 1.5 | 5 | 13.3 | 💡 Phase 2B+2C |
| 4 | Export Leaderboard | 3 | 1.5 | 4 | 8.0 | ✅ Phase 1 |
| 5 | Prediction Consensus | 4 | 2 | 4 | 8.0 | 💡 Phase 2 |
| 6 | Head-to-Head View | 5 | 3 | 4 | 6.7 | ✅ Phase 1 |
| 7 | Category Leaders | 3 | 2 | 4 | 6.0 | 💡 Phase 2 |
| 8 | Quick Stats Card | 3 | 2 | 4 | 6.0 | 💡 Future |
| 9 | Rank History Graph | 4 | 3 | 4 | 5.3 | 💡 Phase 2A |
| 10 | Activity Feed | 5 | 3 | 3 | 5.0 | 💡 Phase 3 |
| 11 | Filter/Sort Members | 3 | 2 | 3 | 4.5 | 💡 Future |
| 12 | Member Avatars | 2 | 2 | 4 | 4.0 | 💡 Future |
| 13 | Member Profiles | 4 | 3 | 3 | 4.0 | 💡 Phase 4 |
| 14 | Weekly Digest | 3 | 3 | 3 | 3.0 | 💡 Phase 3 |
| 15 | Group Announcements | 3 | 2 | 3 | 4.5 | 💡 Future |
| — | Achievement System (#24) | 5 | 5 | 2 | 2.0 | ❌ Won't Do |
| — | Enhanced Stats (#25) | 5 | 4 | 3 | 3.75 | ❌ Won't Do |

### Rejected Ideas
- **Group Chat**: Too complex, high overwhelm risk
- **Side Bets**: Feature creep, legal concerns
- **Group Challenges**: Overlaps with potential achievement system

---

**Document Version:** 1.1
**Last Updated:** March 9, 2026
**Changelog:**
- v1.1: Refactored Phase 2 into three stories (A: Score History + Graph, B: Core Badges, C: Time-Dimension Badges). Promoted Rank History Graph from Phase 4 to Phase 2A as foundational infrastructure. Moved Prediction Consensus and Category Leaders to Phase 4. Added negative badges (Lantern Rouge, Wooden Spoon, Ice Cold, Free Fall). Documented cold-start limitation and exact-score rarity constraint.
- v1.0: Initial planning document (Phase 1 scope)
