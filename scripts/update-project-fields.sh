#!/bin/bash

# Script to update GitHub Project custom fields for all UX issues
# Maps issues to their Priority, Effort, and Category values

set -e

PROJECT_ID="PVT_kwHOACX4Hs4BMsVn"

# Field IDs
PRIORITY_FIELD="PVTSSF_lAHOACX4Hs4BMsVnzg7503k"
EFFORT_FIELD="PVTSSF_lAHOACX4Hs4BMsVnzg751FY"
CATEGORY_FIELD="PVTSSF_lAHOACX4Hs4BMsVnzg751Kk"

# Priority option IDs
PRIORITY_CRITICAL="45bd9eee"
PRIORITY_HIGH="2778d12c"
PRIORITY_MEDIUM="e201616b"
PRIORITY_LOW="9bb3d04b"

# Effort option IDs
EFFORT_HIGH="8a99bf72"
EFFORT_MEDIUM="ff9d60be"
EFFORT_LOW="804b5b7b"

# Category option IDs
CATEGORY_ONBOARDING="1f0503b0"
CATEGORY_PREDICTION="d72af96b"
CATEGORY_MOBILE="4502b36b"
CATEGORY_SCORING="4608005c"
CATEGORY_VISUALIZATION="0d63ebd4"
CATEGORY_AESTHETICS="76f3c00f"
CATEGORY_TECHNICAL_UX="dd47a60f"

echo "🚀 Updating project fields for all UX issues..."
echo ""

# Function to update project item fields
update_item() {
    local item_id="$1"
    local priority_id="$2"
    local effort_id="$3"
    local category_id="$4"
    local issue_num="$5"

    echo "  Updating issue #$issue_num..."

    # Update Priority
    gh api graphql -f query="
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: \"$PROJECT_ID\"
        itemId: \"$item_id\"
        fieldId: \"$PRIORITY_FIELD\"
        value: {singleSelectOptionId: \"$priority_id\"}
      }) {
        projectV2Item {
          id
        }
      }
    }" --silent

    # Update Effort
    gh api graphql -f query="
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: \"$PROJECT_ID\"
        itemId: \"$item_id\"
        fieldId: \"$EFFORT_FIELD\"
        value: {singleSelectOptionId: \"$effort_id\"}
      }) {
        projectV2Item {
          id
        }
      }
    }" --silent

    # Update Category
    gh api graphql -f query="
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: \"$PROJECT_ID\"
        itemId: \"$item_id\"
        fieldId: \"$CATEGORY_FIELD\"
        value: {singleSelectOptionId: \"$category_id\"}
      }) {
        projectV2Item {
          id
        }
      }
    }" --silent

    echo "    ✓ Updated #$issue_num"
}

# Get all project items with their issue numbers
echo "📋 Fetching project items..."
ITEMS=$(gh api graphql -f query='
query {
  node(id: "PVT_kwHOACX4Hs4BMsVn") {
    ... on ProjectV2 {
      items(first: 30) {
        nodes {
          id
          content {
            ... on Issue {
              number
            }
          }
        }
      }
    }
  }
}')

echo ""
echo "🔄 Updating fields..."
echo ""

# Parse and update each item
echo "$ITEMS" | jq -r '.data.node.items.nodes[] | "\(.id)|\(.content.number)"' | while IFS='|' read -r item_id issue_num; do
    case $issue_num in
        # SPRINT 1-2: CRITICAL FIXES
        11) update_item "$item_id" "$PRIORITY_CRITICAL" "$EFFORT_MEDIUM" "$CATEGORY_ONBOARDING" "$issue_num" ;;
        12) update_item "$item_id" "$PRIORITY_CRITICAL" "$EFFORT_LOW" "$CATEGORY_PREDICTION" "$issue_num" ;;
        13) update_item "$item_id" "$PRIORITY_CRITICAL" "$EFFORT_LOW" "$CATEGORY_PREDICTION" "$issue_num" ;;
        14) update_item "$item_id" "$PRIORITY_CRITICAL" "$EFFORT_LOW" "$CATEGORY_SCORING" "$issue_num" ;;
        15) update_item "$item_id" "$PRIORITY_CRITICAL" "$EFFORT_LOW" "$CATEGORY_PREDICTION" "$issue_num" ;;

        # SPRINT 3-4: PREDICTION EXPERIENCE
        16) update_item "$item_id" "$PRIORITY_HIGH" "$EFFORT_MEDIUM" "$CATEGORY_PREDICTION" "$issue_num" ;;
        17) update_item "$item_id" "$PRIORITY_HIGH" "$EFFORT_MEDIUM" "$CATEGORY_PREDICTION" "$issue_num" ;;
        18) update_item "$item_id" "$PRIORITY_MEDIUM" "$EFFORT_LOW" "$CATEGORY_TECHNICAL_UX" "$issue_num" ;;
        19) update_item "$item_id" "$PRIORITY_MEDIUM" "$EFFORT_LOW" "$CATEGORY_AESTHETICS" "$issue_num" ;;

        # SPRINT 5-6: MOBILE OPTIMIZATION
        20) update_item "$item_id" "$PRIORITY_HIGH" "$EFFORT_HIGH" "$CATEGORY_MOBILE" "$issue_num" ;;
        21) update_item "$item_id" "$PRIORITY_MEDIUM" "$EFFORT_MEDIUM" "$CATEGORY_MOBILE" "$issue_num" ;;
        22) update_item "$item_id" "$PRIORITY_MEDIUM" "$EFFORT_LOW" "$CATEGORY_MOBILE" "$issue_num" ;;
        23) update_item "$item_id" "$PRIORITY_MEDIUM" "$EFFORT_MEDIUM" "$CATEGORY_MOBILE" "$issue_num" ;;

        # SPRINT 7-9: ENGAGEMENT & GAMIFICATION
        24) update_item "$item_id" "$PRIORITY_HIGH" "$EFFORT_HIGH" "$CATEGORY_SCORING" "$issue_num" ;;
        25) update_item "$item_id" "$PRIORITY_MEDIUM" "$EFFORT_MEDIUM" "$CATEGORY_SCORING" "$issue_num" ;;
        26) update_item "$item_id" "$PRIORITY_MEDIUM" "$EFFORT_LOW" "$CATEGORY_VISUALIZATION" "$issue_num" ;;
        27) update_item "$item_id" "$PRIORITY_MEDIUM" "$EFFORT_MEDIUM" "$CATEGORY_AESTHETICS" "$issue_num" ;;

        # SPRINT 10-12: ADVANCED FEATURES
        28) update_item "$item_id" "$PRIORITY_MEDIUM" "$EFFORT_HIGH" "$CATEGORY_VISUALIZATION" "$issue_num" ;;
        29) update_item "$item_id" "$PRIORITY_MEDIUM" "$EFFORT_HIGH" "$CATEGORY_VISUALIZATION" "$issue_num" ;;
        30) update_item "$item_id" "$PRIORITY_MEDIUM" "$EFFORT_HIGH" "$CATEGORY_TECHNICAL_UX" "$issue_num" ;;

        # SPRINT 13+: POLISH & REFINEMENTS
        31) update_item "$item_id" "$PRIORITY_LOW" "$EFFORT_LOW" "$CATEGORY_TECHNICAL_UX" "$issue_num" ;;
        32) update_item "$item_id" "$PRIORITY_LOW" "$EFFORT_LOW" "$CATEGORY_AESTHETICS" "$issue_num" ;;
        33) update_item "$item_id" "$PRIORITY_LOW" "$EFFORT_MEDIUM" "$CATEGORY_AESTHETICS" "$issue_num" ;;
        34) update_item "$item_id" "$PRIORITY_LOW" "$EFFORT_MEDIUM" "$CATEGORY_AESTHETICS" "$issue_num" ;;
    esac
done

echo ""
echo "✅ All 24 issues updated successfully!"
echo ""
echo "📊 Summary:"
echo "  - Priority: Set for all issues (Critical/High/Medium/Low)"
echo "  - Effort: Set for all issues (Low/Medium/High)"
echo "  - Category: Set for all issues (7 categories)"
echo ""
echo "View your updated project:"
echo "https://github.com/users/gvinokur/projects/1"
