#!/bin/bash

# Script to fix project field values that were incorrectly set as labels
# This script reads labels and sets the proper Priority, Effort, and Category fields

set -e

PROJECT_NUMBER=1
OWNER="gvinokur"
REPO="qatar-prode"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Fetching project information...${NC}\n"

# Get project ID and field IDs
PROJECT_DATA=$(gh api graphql -f query='
  query($owner: String!, $number: Int!) {
    user(login: $owner) {
      projectV2(number: $number) {
        id
        fields(first: 20) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }
' -f owner="$OWNER" -F number="$PROJECT_NUMBER")

PROJECT_ID=$(echo "$PROJECT_DATA" | jq -r '.data.user.projectV2.id')
echo -e "Project ID: ${GREEN}$PROJECT_ID${NC}"

# Extract field IDs and option mappings
PRIORITY_FIELD_ID=$(echo "$PROJECT_DATA" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name == "Priority") | .id')
EFFORT_FIELD_ID=$(echo "$PROJECT_DATA" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name == "Effort") | .id')
CATEGORY_FIELD_ID=$(echo "$PROJECT_DATA" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name == "Category") | .id')

echo -e "Priority Field ID: ${GREEN}$PRIORITY_FIELD_ID${NC}"
echo -e "Effort Field ID: ${GREEN}$EFFORT_FIELD_ID${NC}"
echo -e "Category Field ID: ${GREEN}$CATEGORY_FIELD_ID${NC}\n"

# Create option ID lookup functions
get_option_id() {
  local field_name="$1"
  local option_name="$2"
  echo "$PROJECT_DATA" | jq -r --arg field "$field_name" --arg option "$option_name" \
    '.data.user.projectV2.fields.nodes[] | select(.name == $field) | .options[] | select(.name == $option) | .id'
}

# Map label values to field values
map_priority() {
  case "$1" in
    "critical") echo "Critical" ;;
    "high") echo "High" ;;
    "medium") echo "Medium" ;;
    "low") echo "Low" ;;
    *) echo "" ;;
  esac
}

map_effort() {
  case "$1" in
    "high") echo "High 5d-10d" ;;
    "medium") echo "Medium 3d-5d" ;;
    "low") echo "Low 1d-2s" ;;
    *) echo "" ;;
  esac
}

map_category() {
  case "$1" in
    "onboarding") echo "Onboarding" ;;
    "prediction-entry") echo "Prediction" ;;
    "mobile") echo "Mobile" ;;
    "scoring") echo "Scoring" ;;
    "visualization") echo "Visualization" ;;
    "aesthetics") echo "Aesthetics" ;;
    "technical-ux") echo "Technical UX" ;;
    *) echo "" ;;
  esac
}

# Update a project item field
update_field() {
  local item_id="$1"
  local field_id="$2"
  local option_id="$3"

  gh api graphql -f query='
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId: $itemId
        fieldId: $fieldId
        value: {
          singleSelectOptionId: $optionId
        }
      }) {
        projectV2Item {
          id
        }
      }
    }
  ' -f projectId="$PROJECT_ID" -f itemId="$item_id" -f fieldId="$field_id" \
    -f optionId="$option_id" >/dev/null 2>&1
}

echo -e "${BLUE}Fetching stories with missing field values...${NC}\n"

# Get stories without priority
gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit 100 | \
  jq -r '.items[] | select(.priority == null or .priority == "" or .priority == " ") |
    @json' | while IFS= read -r item_json; do

  item_id=$(echo "$item_json" | jq -r '.id')
  issue_number=$(echo "$item_json" | jq -r '.content.number')
  title=$(echo "$item_json" | jq -r '.content.title')
  labels=$(echo "$item_json" | jq -r '.labels // [] | join(",")')

  echo -e "${YELLOW}#$issue_number: $title${NC}"

  updated=false

  # Process priority label
  if echo "$labels" | grep -q "priority/"; then
    priority_label=$(echo "$labels" | grep -o 'priority/[^,]*' | sed 's/priority\///')
    priority_value=$(map_priority "$priority_label")
    if [ -n "$priority_value" ]; then
      priority_option_id=$(get_option_id "Priority" "$priority_value")
      if [ -n "$priority_option_id" ]; then
        echo -e "  ${GREEN}✓ Setting Priority: $priority_value${NC}"
        update_field "$item_id" "$PRIORITY_FIELD_ID" "$priority_option_id"
        updated=true
      fi
    fi
  fi

  # Process effort label
  if echo "$labels" | grep -q "effort/"; then
    effort_label=$(echo "$labels" | grep -o 'effort/[^,]*' | sed 's/effort\///')
    effort_value=$(map_effort "$effort_label")
    if [ -n "$effort_value" ]; then
      effort_option_id=$(get_option_id "Effort" "$effort_value")
      if [ -n "$effort_option_id" ]; then
        echo -e "  ${GREEN}✓ Setting Effort: $effort_value${NC}"
        update_field "$item_id" "$EFFORT_FIELD_ID" "$effort_option_id"
        updated=true
      fi
    fi
  fi

  # Process category label
  if echo "$labels" | grep -q "category/"; then
    category_label=$(echo "$labels" | grep -o 'category/[^,]*' | sed 's/category\///')
    category_value=$(map_category "$category_label")
    if [ -n "$category_value" ]; then
      category_option_id=$(get_option_id "Category" "$category_value")
      if [ -n "$category_option_id" ]; then
        echo -e "  ${GREEN}✓ Setting Category: $category_value${NC}"
        update_field "$item_id" "$CATEGORY_FIELD_ID" "$category_option_id"
        updated=true
      fi
    fi
  fi

  if [ "$updated" = false ]; then
    echo -e "  ${YELLOW}⚠ No field values found in labels${NC}"
  fi

  echo ""

  # Small delay to avoid rate limiting
  sleep 0.5
done

echo -e "${GREEN}✓ Done!${NC}"
echo -e "\n${BLUE}Tip: Run './scripts/github-projects-helper projects stats 1' to verify the changes${NC}"
