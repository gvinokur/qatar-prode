#!/bin/bash

# Script to create all 24 UX improvement issues
# Repository: qatar-prode

set -e

REPO="gvinokur/qatar-prode"
DOCS_URL="https://github.com/$REPO/blob/main/docs"

echo "🚀 Creating 24 UX improvement issues..."
echo ""

# Function to create issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local milestone="$4"

    gh issue create \
        --repo "$REPO" \
        --title "$title" \
        --body "$body" \
        --label "$labels" \
        --milestone "$milestone"
}

# =============================================================================
# SPRINT 1-2: CRITICAL FIXES
# =============================================================================

echo "📌 Creating Sprint 1-2 issues (Critical Fixes)..."

# UXI-001
create_issue \
"[UXI-001] Progressive Onboarding Flow" \
"## Problem
- 60% of new users never make their first prediction
- No tutorial or guided tour
- Users overwhelmed by full dashboard immediately
- Rules buried in collapsible sidebar

## Solution
Implement 5-step interactive onboarding:
1. Welcome screen
2. Sample prediction (interactive)
3. Scoring explanation
4. Boost introduction
5. Getting Started checklist

## Success Metrics
- First prediction completion: 60% → 85%
- Time to first prediction: 3 min → 1 min
- Day 7 retention: +20%

## Implementation Details
- Store onboarding completion in \`user_preferences\` table
- Allow skip at any step
- Show tooltips until dismissed
- Checklist accessible from profile menu

## Priority Score
10/10 (High Impact, Medium Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#71-onboarding-experience)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-001-progressive-onboarding-flow)

## Dependencies
None

## Estimated Effort
3-5 days" \
"priority/critical,category/onboarding,effort/medium,type/ux-improvement" \
"Sprint 1-2: Critical Fixes"

# UXI-002
create_issue \
"[UXI-002] Prediction Tracking Dashboard" \
"## Problem
- Users spend 2-3 minutes scanning to find unpredicted games
- No visual indication of prediction completion (32/48)
- Can't filter by prediction status

## Solution
Add status bar with:
- Progress indicator: \"32/48 games predicted (67%)\"
- Filter buttons: All / Unpredicted / Boosted / Closing Soon
- Boost summary: \"🥈 3/5 Silver  🥇 1/2 Golden\"

## Success Metrics
- Time to find unpredicted: 2-3 min → 10 sec
- Prediction completion rate: +25%
- User satisfaction: +30%

## Implementation Details
- Calculate prediction completion: \`(predicted / total) * 100\`
- Filter buttons with badge counts
- Filter state updates game grid display
- Persist filter preference in localStorage

## Priority Score
10/10 (High Impact, Low Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#72-prediction-entry--tracking)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-002-prediction-tracking-dashboard)

## Dependencies
None

## Estimated Effort
1-2 days" \
"priority/critical,category/prediction-entry,effort/low,type/ux-improvement" \
"Sprint 1-2: Critical Fixes"

# UXI-003
create_issue \
"[UXI-003] Countdown Timers for Deadlines" \
"## Problem
- Timestamps require mental calculation (\"Jan 18, 15:00\")
- Users miss deadlines due to timezone confusion
- No sense of urgency

## Solution
Replace timestamps with relative countdowns:
- \"Closes in 3 hours 45 minutes\"
- Color-coded urgency: Green (>24h), Yellow (1-24h), Red (<1h)
- Progress bar visual
- Pulsing animation when < 1 hour

## Success Metrics
- Deadline calculation time: 5-10 sec → 0 sec
- Late submissions: -40%
- Urgency awareness: +60%

## Implementation Details
\`\`\`typescript
function getTimeRemaining(gameDate: Date): string {
  const now = Date.now()
  const deadline = gameDate.getTime() - ONE_HOUR
  const diff = deadline - now

  if (diff < 0) return \"Closed\"

  const hours = Math.floor(diff / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return \`Closes in \${days} \${days === 1 ? 'day' : 'days'}\`
  }

  return \`Closes in \${hours}h \${minutes}m\`
}
\`\`\`

## Priority Score
9/10 (High Impact, Low Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#72-prediction-entry--tracking)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-003-countdown-timers-for-deadlines)

## Dependencies
None

## Estimated Effort
1-2 days" \
"priority/critical,category/prediction-entry,effort/low,type/ux-improvement" \
"Sprint 1-2: Critical Fixes"

# UXI-005
create_issue \
"[UXI-005] Point Value Display on Game Cards" \
"## Problem
- Users don't know how many points they earned
- Must navigate to stats page to see breakdown
- No celebration for correct predictions
- Boost impact unclear

## Solution
Add point value overlay on game cards after results:
- \"+2 points! (Exact score)\" with animation
- \"+6 points! (2 pts x3 boost)\" for boosted games
- Confetti animation
- Clickable for breakdown

## Success Metrics
- User understanding of scoring: +50%
- Emotional engagement: +40%
- Boost feature awareness: +30%

## Implementation Details
- Point value overlays on game cards
- Counter animation (0 → 6)
- Confetti animation for correct predictions
- Breakdown tooltip on click
- Trophy icon bounce animation

## Priority Score
9/10 (High Impact, Low Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#73-scoring--performance-understanding)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-005-point-value-display-on-game-cards)

## Dependencies
None

## Estimated Effort
1 day" \
"priority/critical,category/scoring,effort/low,type/ux-improvement" \
"Sprint 1-2: Critical Fixes"

# UXI-006
create_issue \
"[UXI-006] Unpredicted Games Filter" \
"## Problem
- 40% of users can't quickly find unpredicted games
- Manual scanning is time-consuming
- No way to see which games need attention

## Solution
Add filter toggle:
- \"Show Unpredicted Only\" button with count badge
- Hides all predicted games
- Count updates in real-time
- Remember filter preference

## Success Metrics
- Find unpredicted: 40% success → 90% success
- Time to find: 2 min → 10 sec
- Feature usage: 80% of active users

## Implementation Details
- Filter button in prediction dashboard (part of UXI-002)
- Filters game grid to show only unpredicted
- Badge shows count of unpredicted games
- Store preference in localStorage

## Priority Score
9/10 (High Impact, Low Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#72-prediction-entry--tracking)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-006-unpredicted-games-filter)

## Dependencies
- UXI-002 (Prediction Tracking Dashboard)

## Estimated Effort
1 day" \
"priority/critical,category/prediction-entry,effort/low,type/ux-improvement" \
"Sprint 1-2: Critical Fixes"

echo "  ✅ Sprint 1-2 issues created (5 issues)"
echo ""

# =============================================================================
# SPRINT 3-4: PREDICTION EXPERIENCE
# =============================================================================

echo "📌 Creating Sprint 3-4 issues (Prediction Experience)..."

# UXI-004
create_issue \
"[UXI-004] Quick Prediction Mode (Batch Edit)" \
"## Problem
- Must edit each game individually (dialog per game)
- Takes 5+ minutes to predict 12 games
- Tedious for power users (25+ clicks)

## Solution
Batch edit interface:
- Inline score editors for multiple games
- Single \"Save All\" button
- Keyboard shortcuts (Tab to next, Enter to save)
- Quick actions: \"Predict all home wins\"

## Success Metrics
- Prediction time: 5 min → 90 sec (per 12 games)
- User satisfaction: +30%
- Power user engagement: +40%

## Implementation Details
- New quick prediction mode UI
- Inline score inputs on cards
- Keyboard navigation support
- Batch save functionality
- Quick action buttons

## Priority Score
9/10 (High Impact, Medium Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#72-prediction-entry--tracking)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-004-quick-prediction-mode-batch-edit)

## Dependencies
None

## Estimated Effort
3-4 days" \
"priority/high,category/prediction-entry,effort/medium,type/ux-improvement" \
"Sprint 3-4: Prediction Experience"

# UXI-007
create_issue \
"[UXI-007] Boost Strategy View" \
"## Problem
- Can't see boost allocation overview
- Must open each game to check/change boost
- No strategic guidance
- Can't compare with group

## Solution
Visual boost allocation dashboard:
- Drag-and-drop boost chips onto game cards
- Heat map of boost allocation
- Social comparison: \"80% of your group boosted this game\"
- ROI calculator: Historical boost effectiveness

## Success Metrics
- Boost allocation time: -50%
- Boost feature engagement: +40%
- Strategic boost usage: +35%

## Implementation Details
- New boost strategy dashboard page
- Drag-and-drop interface (react-dnd)
- Boost usage analytics
- Group comparison data
- ROI calculations

## Priority Score
7/10 (Medium-High Impact, Medium Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#72-prediction-entry--tracking)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-007-boost-strategy-view)

## Dependencies
None

## Estimated Effort
3-4 days" \
"priority/high,category/prediction-entry,effort/medium,type/ux-improvement" \
"Sprint 3-4: Prediction Experience"

# UXI-022
create_issue \
"[UXI-022] Skeleton Screens (Loading States)" \
"## Problem
- Generic spinners during loading
- Content \"pops in\" abruptly
- Feels slow even when fast

## Solution
Content-aware skeleton screens:
- Match actual content shape
- Game card skeletons
- Leaderboard skeletons
- Pulse animation
- Replace all spinners

## Success Metrics
- Perceived performance: +30%
- Loading frustration: -40%

## Implementation Details
- Use MUI Skeleton component
- Create skeleton variants for each content type
- Match actual content dimensions
- Pulse animation
- Replace all CircularProgress spinners

## Priority Score
5/10 (Medium Impact, Low Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#81-performance-perception)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-022-skeleton-screens-loading-states)

## Dependencies
None

## Estimated Effort
2 days" \
"priority/medium,category/technical-ux,effort/low,type/ux-improvement" \
"Sprint 3-4: Prediction Experience"

# UXI-019
create_issue \
"[UXI-019] Color Palette Enhancement" \
"## Problem
- Generic color scheme (standard red/blue)
- No visual dynamism
- Could feel more premium

## Solution
Enhanced color palette:
- Primary: Gradient red (#c62828 → #e53935)
- Accent: Gold (#ffc107) for achievements/boosts
- Better dark mode optimization
- Semantic color usage

## Success Metrics
- Perceived quality: +30%
- Brand distinctiveness: +25%

## Implementation Details
- Update theme-provider.tsx
- Define gradient colors
- Add accent color (gold)
- Optimize dark mode colors
- Update all component color references

## Priority Score
5/10 (Medium Impact, Low Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#76-aesthetic-improvements)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-019-color-palette-enhancement)

## Dependencies
None

## Estimated Effort
1 day" \
"priority/medium,category/aesthetics,effort/low,type/ux-improvement" \
"Sprint 3-4: Prediction Experience"

echo "  ✅ Sprint 3-4 issues created (4 issues)"
echo ""

# =============================================================================
# SPRINT 5-6: MOBILE OPTIMIZATION
# =============================================================================

echo "📌 Creating Sprint 5-6 issues (Mobile Optimization)..."

# UXI-008
create_issue \
"[UXI-008] Mobile Bottom Navigation" \
"## Problem
- Top-heavy navigation (hard to reach with thumb)
- No persistent navigation on mobile
- Must use back button or header links
- Poor one-handed usability

## Solution
Bottom tab navigation with 4 tabs:
- 🏠 Home: Dashboard, recent tournaments
- 🏆 Tournaments: All tournaments, quick predict
- 👥 Groups: Your groups, leaderboards
- 👤 Profile: Stats, achievements, settings

## Success Metrics
- Navigation taps: -40%
- One-handed usability: +60%
- Feature discoverability: +35%

## Implementation Details
- Use MUI BottomNavigation component
- 4 tabs with icons and labels
- Persist selected tab in URL
- Badge counts on tabs
- Hide on scroll for more screen space
- Show only on mobile (<900px)

## Priority Score
8/10 (High Impact, High Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#74-mobile-specific-optimizations)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-008-mobile-bottom-navigation)

## Dependencies
None

## Estimated Effort
5-7 days" \
"priority/high,category/mobile,effort/high,type/ux-improvement" \
"Sprint 5-6: Mobile Optimization"

# UXI-012
create_issue \
"[UXI-012] Swipe Gestures (Mobile)" \
"## Problem
- No mobile-specific gestures
- Requires taps for all interactions
- Doesn't feel native
- Slower than gesture-based alternatives

## Solution
Implement common mobile gestures:
- Swipe left on card: Edit prediction
- Swipe right on card: View details
- Long-press card: Quick actions menu
- Swipe between tabs
- Pull-to-refresh on leaderboards

## Success Metrics
- Interaction time: -30%
- Mobile UX satisfaction: +35%
- Native feel: +40%

## Implementation Details
- Use react-swipeable or framer-motion
- Add visual feedback (card slides with finger)
- Haptic feedback on iOS
- Quick actions menu component
- Pull-to-refresh on scrollable lists

## Priority Score
6/10 (Medium Impact, Medium Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#74-mobile-specific-optimizations)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-012-swipe-gestures-mobile)

## Dependencies
None

## Estimated Effort
3-4 days" \
"priority/medium,category/mobile,effort/medium,type/ux-improvement" \
"Sprint 5-6: Mobile Optimization"

# UXI-014
create_issue \
"[UXI-014] Floating Action Button (FAB)" \
"## Problem
- Primary actions not in thumb-friendly zone
- Requires scrolling to find \"Make Prediction\"
- No quick access to common tasks

## Solution
Context-aware FAB:
- Home: Quick Predict
- Tournament: Edit Predictions
- Group: Invite Friends
- Expandable menu with secondary actions
- Bottom-right corner (thumb zone)

## Success Metrics
- Primary action taps: -30%
- Feature usage: +25%
- Mobile usability: +20%

## Implementation Details
- Use MUI Fab component
- Context-aware actions based on current page
- Expandable Speed Dial for secondary actions
- Position in bottom-right (thumb zone)
- Hide on scroll down, show on scroll up

## Priority Score
6/10 (Medium Impact, Low Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#74-mobile-specific-optimizations)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-014-floating-action-button-fab)

## Dependencies
- Works best with UXI-008 (Bottom Navigation)

## Estimated Effort
1-2 days" \
"priority/medium,category/mobile,effort/low,type/ux-improvement" \
"Sprint 5-6: Mobile Optimization"

# UXI-015
create_issue \
"[UXI-015] Card-Based Mobile Leaderboard" \
"## Problem
- Table requires horizontal scroll on mobile
- Information dense and hard to scan
- Poor mobile reading experience

## Solution
Replace table with cards on mobile:
- One card per user
- Rank change indicator (↑2, ↓1)
- Expandable for detailed stats
- Progress bar for accuracy
- Your card highlighted

## Success Metrics
- Mobile leaderboard engagement: +40%
- Horizontal scroll elimination: 100%
- Information clarity: +35%

## Implementation Details
- Use useMediaQuery to detect mobile
- Conditional rendering: Table on desktop, cards on mobile
- Expandable cards for detailed stats
- Highlight current user's card
- Avatar with initials

## Priority Score
6/10 (Medium Impact, Medium Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#75-results--standings-visualization)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-015-card-based-mobile-leaderboard)

## Dependencies
None

## Estimated Effort
2-3 days" \
"priority/medium,category/mobile,effort/medium,type/ux-improvement" \
"Sprint 5-6: Mobile Optimization"

echo "  ✅ Sprint 5-6 issues created (4 issues)"
echo ""

# =============================================================================
# SPRINT 7-9: ENGAGEMENT & GAMIFICATION
# =============================================================================

echo "📌 Creating Sprint 7-9 issues (Engagement & Gamification)..."

# UXI-009
create_issue \
"[UXI-009] Achievement System" \
"## Problem
- No long-term goals or milestones
- No celebration of accomplishments
- Users lack motivation beyond competition
- No shareable achievements

## Solution
Comprehensive achievement system with 45+ badges:
- Prediction accuracy: First Blood, Sharpshooter, Prophet, Perfect Round
- Consistency: 3/7/30-day streaks
- Competition: Comeback Kid, Podium Finish, Group Champion
- Strategy: Boost Master, Risk Taker, Analyst
- Social: Group Founder, Party Starter, Recruiter

## Success Metrics
- User engagement: +35%
- Retention (Day 30): +25%
- Viral sharing: +20%
- Long-term goal pursuit: +40%

## Implementation Details
- New \`user_achievements\` table
- Achievement check conditions after game results
- Celebration modal when earned
- Achievement page with progress
- Social sharing (WhatsApp, Twitter)
- Badge display on profile/leaderboard

## Priority Score
8/10 (High Impact, High Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#73-scoring--performance-understanding)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-009-achievement-system)

## Dependencies
None

## Estimated Effort
7-10 days" \
"priority/high,category/scoring,effort/high,type/ux-improvement" \
"Sprint 7-9: Engagement & Gamification"

# UXI-013
create_issue \
"[UXI-013] Enhanced Statistics Dashboard" \
"## Problem
- Static presentation (just numbers)
- No trends over time
- Can't compare to group average
- No insights or recommendations

## Solution
Add visualizations and insights:
- Points trend chart (line graph over rounds)
- Accuracy ring (visual success rate)
- Comparison panel (you vs group average)
- AI-generated insights: \"Your best category: Playoffs\"

## Success Metrics
- Stats engagement: +50%
- Performance understanding: +40%
- Competitive motivation: +30%

## Implementation Details
- Chart.js or Recharts for visualizations
- Line graph for points over time
- Circular progress for accuracy percentage
- Comparison calculations
- Insight generation based on data patterns

## Priority Score
6/10 (Medium Impact, Medium Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#73-scoring--performance-understanding)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-013-enhanced-statistics-dashboard)

## Dependencies
- Chart library (Chart.js or Recharts)

## Estimated Effort
4-5 days" \
"priority/medium,category/scoring,effort/medium,type/ux-improvement" \
"Sprint 7-9: Engagement & Gamification"

# UXI-016
create_issue \
"[UXI-016] Rank Change Animations" \
"## Problem
- Rank changes feel static
- No celebration for moving up
- Missed opportunity for delight
- Users don't notice small changes

## Solution
Animated rank transitions:
- Slide animation when rank changes
- Green glow + confetti for rank up
- Points counter animation
- Staggered animations (one by one)

## Success Metrics
- User excitement: +30%
- Emotional engagement: +25%
- Rank change awareness: +40%

## Implementation Details
- Framer Motion or React Spring
- Slide animation when rank changes
- Counter animation for points
- Confetti effect for rank improvements
- Staggered animation timing
- Haptic feedback on mobile

## Priority Score
5/10 (Low-Medium Impact, Low Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#75-results--standings-visualization)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-016-rank-change-animations)

## Dependencies
- Animation library (Framer Motion)

## Estimated Effort
1-2 days" \
"priority/medium,category/visualization,effort/low,type/ux-improvement" \
"Sprint 7-9: Engagement & Gamification"

# UXI-021
create_issue \
"[UXI-021] Micro-Animations Library" \
"## Problem
- Interactions feel static
- No delight moments
- Could feel more polished
- Transitions are abrupt

## Solution
Comprehensive animation library:
- Button hovers: Scale, ripple
- Card interactions: Lift, shadow
- Correct predictions: Confetti
- Boost selection: Pulse
- Page transitions: Fade + slide
- Loading: Skeleton screens

## Success Metrics
- Perceived quality: +35%
- User delight: +30%
- Modern feel: +40%

## Implementation Details
- Framer Motion library
- Define animation variants
- Button hover/press animations
- Card lift on hover
- Confetti component
- Pulse animation for boosts
- Page transition wrappers

## Priority Score
5/10 (Medium Impact, Medium Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#76-aesthetic-improvements)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-021-micro-animations-library)

## Dependencies
- Animation library (Framer Motion)

## Estimated Effort
3-4 days" \
"priority/medium,category/aesthetics,effort/medium,type/ux-improvement" \
"Sprint 7-9: Engagement & Gamification"

echo "  ✅ Sprint 7-9 issues created (4 issues)"
echo ""

# =============================================================================
# SPRINT 10-12: ADVANCED FEATURES
# =============================================================================

echo "📌 Creating Sprint 10-12 issues (Advanced Features)..."

# UXI-010
create_issue \
"[UXI-010] Interactive Bracket Visualization" \
"## Problem
- Tabbed rounds hard to visualize as a whole
- Can't see progression through playoff stages
- Difficult to understand bracket structure
- Can't compare predicted vs actual paths

## Solution
Visual bracket interface:
- Single-page bracket view (all rounds visible)
- Zoom/pan on mobile
- Highlight user's predicted winner path
- Toggle: \"Your Predictions\" vs \"Actual Results\"
- Side-by-side comparison mode

## Success Metrics
- Playoff understanding: +50%
- Playoff prediction engagement: +30%
- Confusion reduction: -60%

## Implementation Details
- SVG-based bracket rendering
- react-zoom-pan-pinch library
- Responsive design with mobile optimization
- Toggle between predicted/actual
- Highlight user's path
- Click team for details

## Priority Score
6/10 (Medium-High Impact, High Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#75-results--standings-visualization)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-010-interactive-bracket-visualization)

## Dependencies
None

## Estimated Effort
5-7 days" \
"priority/medium,category/visualization,effort/high,type/ux-improvement" \
"Sprint 10-12: Advanced Features"

# UXI-011
create_issue \
"[UXI-011] Live Score Updates" \
"## Problem
- No real-time updates during games
- Users must refresh manually
- Can't see impact of ongoing games on points/rank
- Missing engagement opportunity

## Solution
Live game experience:
- Real-time score ticker for in-progress games
- Prediction tracking during game
- Impact preview: \"If score holds, you'll gain 2 points\"
- Push notifications for goals
- Projected rank calculator

## Success Metrics
- Engagement during games: +60%
- Real-time app opens: +45%
- Push notification opt-in: 50%+
- User excitement: +40%

## Implementation Details
- WebSocket connection for live updates
- Polling fallback (every 30 sec)
- Live ticker component
- Prediction impact calculator
- Push notification integration
- Projected points/rank display

## Priority Score
6/10 (Medium-High Impact, High Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#75-results--standings-visualization)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-011-live-score-updates)

## Dependencies
- WebSocket infrastructure
- Push notifications setup

## Estimated Effort
7-10 days" \
"priority/medium,category/visualization,effort/high,type/ux-improvement" \
"Sprint 10-12: Advanced Features"

# UXI-018
create_issue \
"[UXI-018] Push Notifications System" \
"## Problem
- No push notifications (infrastructure exists but unused)
- Users miss deadlines
- No re-engagement mechanism
- No game result alerts

## Solution
Comprehensive notification system:
- Deadline reminders (1 hour, 15 min before)
- Game results with points earned
- Rank changes
- Daily digest
- Friend activity (optional)
- Granular preferences in settings

## Success Metrics
- Daily active users: +30%
- Missed predictions: -50%
- Retention: +20%

## Implementation Details
- Firebase Cloud Messaging or OneSignal
- Backend notification service
- Notification preferences in DB
- Opt-in flow UI
- Granular settings page
- Deep linking on notification click
- Respect quiet hours (11 PM - 8 AM)
- Max 5 notifications per day

## Priority Score
5/10 (Medium Impact, High Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#83-push-notifications)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-018-push-notifications-system)

## Dependencies
- Backend notification service
- FCM/OneSignal setup

## Estimated Effort
7-10 days" \
"priority/medium,category/technical-ux,effort/high,type/ux-improvement" \
"Sprint 10-12: Advanced Features"

echo "  ✅ Sprint 10-12 issues created (3 issues)"
echo ""

# =============================================================================
# SPRINT 13+: POLISH & REFINEMENTS
# =============================================================================

echo "📌 Creating Sprint 13+ issues (Polish & Refinements)..."

# UXI-017
create_issue \
"[UXI-017] Custom Install Prompt (PWA)" \
"## Problem
- Browser default install prompt easily dismissed
- Low PWA install rate
- Benefits not communicated

## Solution
Custom install prompt:
- Show after 2nd visit or first prediction
- List benefits: Faster loading, offline access, notifications
- \"Install Now\" / \"Maybe Later\" options
- Don't show again if dismissed 3 times

## Success Metrics
- PWA install rate: +40%
- User awareness: +50%

## Implementation Details
- Detect beforeinstallprompt event
- Custom dialog component
- Store dismissal count in localStorage
- Show after 2nd visit or first prediction success
- List PWA benefits clearly

## Priority Score
5/10 (Low-Medium Impact, Low Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#82-progressive-web-app-experience)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-017-custom-install-prompt-pwa)

## Dependencies
None

## Estimated Effort
1 day" \
"priority/low,category/technical-ux,effort/low,type/ux-improvement" \
"Sprint 13+: Polish & Refinements"

# UXI-020
create_issue \
"[UXI-020] Typography Scale Refinement" \
"## Problem
- Using MUI defaults
- Could be more expressive
- Hierarchy could be clearer

## Solution
Custom typography scale:
- Consider Poppins or Inter font
- Defined scale from hero (32-40px) to caption (12-14px)
- Consistent weight usage
- Better mobile sizes

## Success Metrics
- Readability: +15%
- Visual hierarchy: +20%

## Implementation Details
- Update theme typography configuration
- Consider new font (Poppins, Inter, or keep Roboto)
- Define complete scale
- Update all text components
- Test on mobile devices

## Priority Score
3/10 (Low Impact, Low Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#76-aesthetic-improvements)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-020-typography-scale-refinement)

## Dependencies
None

## Estimated Effort
1 day" \
"priority/low,category/aesthetics,effort/low,type/ux-improvement" \
"Sprint 13+: Polish & Refinements"

# UXI-023
create_issue \
"[UXI-023] Empty State Illustrations" \
"## Problem
- No dedicated empty state designs
- Generic messages only
- Missed opportunity for personality

## Solution
Custom illustrations for:
- No predictions yet: Trophy with question mark
- No groups: Friends with speech bubbles
- No results: Calendar with clock
- Onboarding steps: Character illustrations

## Success Metrics
- Brand personality: +25%
- First-time experience: +15%

## Implementation Details
- Work with designer for illustrations
- SVG format for scalability
- Consistent illustration style
- Integrate into empty state components
- Use in onboarding flow

## Priority Score
3/10 (Low Impact, Medium Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#76-aesthetic-improvements)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-023-empty-state-illustrations)

## Dependencies
- Designer for illustrations

## Estimated Effort
3-4 days (with designer)" \
"priority/low,category/aesthetics,effort/medium,type/ux-improvement" \
"Sprint 13+: Polish & Refinements"

# UXI-024
create_issue \
"[UXI-024] Custom Icon Set" \
"## Problem
- Generic Material Icons
- No brand distinctiveness
- Could be more expressive

## Solution
Custom icons for:
- Trophy icons (different per tournament)
- Animated confetti
- Boost icons with glow effects
- Achievement badges

## Success Metrics
- Brand identity: +20%
- Visual distinctiveness: +25%

## Implementation Details
- Work with designer for icon set
- SVG format
- Consistent style
- Animated variants where appropriate
- Replace Material Icons in key areas

## Priority Score
3/10 (Low Impact, Medium Effort)

## Documentation
- [UX Audit Report]($DOCS_URL/ux-audit-report.md#76-aesthetic-improvements)
- [Improvement Backlog]($DOCS_URL/ux-improvement-backlog.md#uxi-024-custom-icon-set)

## Dependencies
- Designer for icon set

## Estimated Effort
2-3 days (with designer)" \
"priority/low,category/aesthetics,effort/medium,type/ux-improvement" \
"Sprint 13+: Polish & Refinements"

echo "  ✅ Sprint 13+ issues created (4 issues)"
echo ""

echo "🎉 All 24 issues created successfully!"
echo ""
echo "📊 Summary:"
echo "  - Sprint 1-2 (Critical): 5 issues"
echo "  - Sprint 3-4 (Prediction): 4 issues"
echo "  - Sprint 5-6 (Mobile): 4 issues"
echo "  - Sprint 7-9 (Engagement): 4 issues"
echo "  - Sprint 10-12 (Advanced): 3 issues"
echo "  - Sprint 13+ (Polish): 4 issues"
echo "  - Total: 24 issues"
echo ""
echo "Next steps:"
echo "1. Create GitHub Project: https://github.com/$REPO/projects/new"
echo "2. Add all issues to project"
echo "3. Configure project views (by milestone, by priority, etc.)"
echo "4. Start Sprint 1-2!"
