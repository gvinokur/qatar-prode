#!/bin/bash

# Script to remove redundant labels from UX issues
# Removes: priority/*, category/*, effort/*
# Keeps: type/ux-improvement

set -e

REPO="gvinokur/qatar-prode"

echo "🧹 Cleaning up redundant labels from UX issues..."
echo ""

# Labels to remove
LABELS_TO_REMOVE=(
    "priority/critical"
    "priority/high"
    "priority/medium"
    "priority/low"
    "category/onboarding"
    "category/prediction-entry"
    "category/mobile"
    "category/scoring"
    "category/visualization"
    "category/aesthetics"
    "category/technical-ux"
    "effort/low"
    "effort/medium"
    "effort/high"
)

# Function to remove label from issue
remove_label() {
    local issue_num="$1"
    local label="$2"

    gh api -X DELETE "repos/$REPO/issues/$issue_num/labels/$label" 2>/dev/null || true
}

# Process all UX issues (11-34)
for issue_num in {11..34}; do
    echo "  Cleaning issue #$issue_num..."

    for label in "${LABELS_TO_REMOVE[@]}"; do
        # URL encode the label (replace / with %2F)
        encoded_label=$(echo "$label" | sed 's/\//%2F/g')
        remove_label "$issue_num" "$encoded_label"
    done

    echo "    ✓ Cleaned #$issue_num"
done

echo ""
echo "✅ All redundant labels removed!"
echo ""
echo "📋 Remaining labels:"
echo "  - type/ux-improvement (kept for filtering)"
echo ""
echo "🗑️  Removed labels:"
echo "  - priority/* (now using project Priority field)"
echo "  - category/* (now using project Category field)"
echo "  - effort/* (now using project Effort field)"
