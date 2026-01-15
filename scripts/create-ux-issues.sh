#!/bin/bash

# Script to create GitHub issues for UX Audit improvements
# Repository: qatar-prode

set -e

REPO="gvinokur/qatar-prode"

echo "🚀 Creating UX Audit structure in GitHub..."
echo ""

# Step 1: Create Labels
echo "📋 Creating labels..."

# Priority labels
gh label create "priority/critical" --description "Must-fix issues, highest ROI" --color "d73a4a" --repo $REPO 2>/dev/null || echo "  ✓ priority/critical already exists"
gh label create "priority/high" --description "Significant impact, prioritize after critical" --color "ff9800" --repo $REPO 2>/dev/null || echo "  ✓ priority/high already exists"
gh label create "priority/medium" --description "Important but can be phased" --color "ffc107" --repo $REPO 2>/dev/null || echo "  ✓ priority/medium already exists"
gh label create "priority/low" --description "Nice-to-have improvements" --color "8bc34a" --repo $REPO 2>/dev/null || echo "  ✓ priority/low already exists"

# Category labels
gh label create "category/onboarding" --description "User onboarding and first-time experience" --color "0075ca" --repo $REPO 2>/dev/null || echo "  ✓ category/onboarding already exists"
gh label create "category/prediction-entry" --description "Prediction submission and tracking" --color "0075ca" --repo $REPO 2>/dev/null || echo "  ✓ category/prediction-entry already exists"
gh label create "category/mobile" --description "Mobile-specific optimizations" --color "0075ca" --repo $REPO 2>/dev/null || echo "  ✓ category/mobile already exists"
gh label create "category/scoring" --description "Scoring clarity and feedback" --color "0075ca" --repo $REPO 2>/dev/null || echo "  ✓ category/scoring already exists"
gh label create "category/visualization" --description "Results and standings display" --color "0075ca" --repo $REPO 2>/dev/null || echo "  ✓ category/visualization already exists"
gh label create "category/aesthetics" --description "Visual design and polish" --color "0075ca" --repo $REPO 2>/dev/null || echo "  ✓ category/aesthetics already exists"
gh label create "category/technical-ux" --description "Performance and technical UX" --color "0075ca" --repo $REPO 2>/dev/null || echo "  ✓ category/technical-ux already exists"

# Effort labels
gh label create "effort/low" --description "1-2 days" --color "c2e0c6" --repo $REPO 2>/dev/null || echo "  ✓ effort/low already exists"
gh label create "effort/medium" --description "3-5 days" --color "f9d0c4" --repo $REPO 2>/dev/null || echo "  ✓ effort/medium already exists"
gh label create "effort/high" --description "5-10 days" --color "f87168" --repo $REPO 2>/dev/null || echo "  ✓ effort/high already exists"

# Type label
gh label create "type/ux-improvement" --description "UX/UI improvement" --color "a2eeef" --repo $REPO 2>/dev/null || echo "  ✓ type/ux-improvement already exists"

echo ""
echo "✅ Labels created!"
echo ""

# Step 2: Create Milestones
echo "🎯 Creating milestones..."

gh api repos/$REPO/milestones -f title="Sprint 1-2: Critical Fixes" -f description="Address critical UX issues: onboarding, prediction tracking, countdown timers" -f due_on="2026-02-15T00:00:00Z" --silent 2>/dev/null || echo "  ✓ Sprint 1-2 milestone exists"

gh api repos/$REPO/milestones -f title="Sprint 3-4: Prediction Experience" -f description="Improve prediction efficiency: quick prediction mode, boost strategy" -f due_on="2026-03-15T00:00:00Z" --silent 2>/dev/null || echo "  ✓ Sprint 3-4 milestone exists"

gh api repos/$REPO/milestones -f title="Sprint 5-6: Mobile Optimization" -f description="Transform mobile experience: bottom nav, gestures, FAB" -f due_on="2026-04-15T00:00:00Z" --silent 2>/dev/null || echo "  ✓ Sprint 5-6 milestone exists"

gh api repos/$REPO/milestones -f title="Sprint 7-9: Engagement & Gamification" -f description="Increase retention: achievements, enhanced stats, animations" -f due_on="2026-06-01T00:00:00Z" --silent 2>/dev/null || echo "  ✓ Sprint 7-9 milestone exists"

gh api repos/$REPO/milestones -f title="Sprint 10-12: Advanced Features" -f description="Drive real-time engagement: live scores, push notifications, bracket view" -f due_on="2026-07-15T00:00:00Z" --silent 2>/dev/null || echo "  ✓ Sprint 10-12 milestone exists"

gh api repos/$REPO/milestones -f title="Sprint 13+: Polish & Refinements" -f description="Professional polish: illustrations, custom icons, typography" -f due_on="2026-09-01T00:00:00Z" --silent 2>/dev/null || echo "  ✓ Sprint 13+ milestone exists"

echo ""
echo "✅ Milestones created!"
echo ""

# Step 3: Create Project
echo "📊 Creating GitHub Project..."
echo "  Note: Project creation requires manual setup in GitHub UI"
echo "  Go to: https://github.com/$REPO/projects/new"
echo "  - Name: 'UX Audit 2026'"
echo "  - Description: 'Comprehensive UX improvements based on January 2026 audit'"
echo "  - Template: 'Board' or 'Table'"
echo ""

echo "✅ Setup complete! Ready to create issues."
echo ""
echo "Next step: Run the issue creation script to create all 24 issues"
