#!/bin/bash

# Script to add new options to project single-select fields (Priority, Effort, Category)

set -e

# Usage message
usage() {
  echo "Usage: $0 <field-name> <option-name> [--color COLOR]"
  echo ""
  echo "Examples:"
  echo "  $0 Category \"Data Management\""
  echo "  $0 Category \"Performance\" --color BLUE"
  echo "  $0 Priority \"Urgent\" --color RED"
  echo ""
  echo "Available colors (case-insensitive):"
  echo "  GRAY, BLUE, GREEN, YELLOW, ORANGE, RED, PINK, PURPLE"
  echo ""
  echo "Current project fields:"
  echo "  - Priority (Critical, High, Medium, Low)"
  echo "  - Effort (High 5d-10d, Medium 3d-5d, Low 1d-2s)"
  echo "  - Category (Onboarding, Prediction, Mobile, Scoring, Visualization, Aesthetics, Technical UX)"
  exit 1
}

if [ $# -lt 2 ]; then
  usage
fi

FIELD_NAME="$1"
OPTION_NAME="$2"
COLOR="GRAY"  # Default color

# Parse optional color argument
shift 2
while [ $# -gt 0 ]; do
  case "$1" in
    --color)
      COLOR=$(echo "$2" | tr '[:lower:]' '[:upper:]')
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

PROJECT_NUMBER=1
OWNER="gvinokur"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Fetching project information...${NC}"

# Get project ID and field data
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
                color
              }
            }
          }
        }
      }
    }
  }
' -f owner="$OWNER" -F number="$PROJECT_NUMBER")

PROJECT_ID=$(echo "$PROJECT_DATA" | jq -r '.data.user.projectV2.id')
FIELD_ID=$(echo "$PROJECT_DATA" | jq -r --arg field "$FIELD_NAME" \
  '.data.user.projectV2.fields.nodes[] | select(.name == $field) | .id')

if [ -z "$FIELD_ID" ] || [ "$FIELD_ID" == "null" ]; then
  echo -e "${RED}Error: Field '$FIELD_NAME' not found${NC}"
  echo -e "${YELLOW}Available fields:${NC}"
  echo "$PROJECT_DATA" | jq -r '.data.user.projectV2.fields.nodes[] | "  - \(.name)"'
  exit 1
fi

echo -e "${GREEN}✓ Project ID: $PROJECT_ID${NC}"
echo -e "${GREEN}✓ Field ID: $FIELD_ID${NC}"

# Check if option already exists
EXISTING_OPTION=$(echo "$PROJECT_DATA" | jq -r --arg field "$FIELD_NAME" --arg option "$OPTION_NAME" \
  '.data.user.projectV2.fields.nodes[] | select(.name == $field) | .options[] | select(.name == $option) | .name')

if [ -n "$EXISTING_OPTION" ] && [ "$EXISTING_OPTION" != "null" ]; then
  echo -e "${YELLOW}⚠ Option '$OPTION_NAME' already exists in field '$FIELD_NAME'${NC}"
  exit 0
fi

# Get existing options
EXISTING_OPTIONS=$(echo "$PROJECT_DATA" | jq -c --arg field "$FIELD_NAME" \
  '[.data.user.projectV2.fields.nodes[] | select(.name == $field) | .options[] | {name: .name, color: .color}]')

echo -e "${BLUE}Current options:${NC}"
echo "$EXISTING_OPTIONS" | jq -r '.[] | "  - \(.name) (\(.color))"'

# Add new option to the list
NEW_OPTIONS=$(echo "$EXISTING_OPTIONS" | jq -c --arg name "$OPTION_NAME" --arg color "$COLOR" \
  '. + [{name: $name, color: $color}]')

echo -e "\n${BLUE}Adding option '$OPTION_NAME' with color '$COLOR'...${NC}"

# Prepare the GraphQL input
# GitHub requires name, color, and description (cannot be null)
OPTIONS_INPUT=$(echo "$NEW_OPTIONS" | jq -c 'map({name: .name, color: .color, description: ""})')

# Update the field with all options (existing + new)
RESULT=$(gh api graphql -f query='
  mutation($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
    updateProjectV2Field(input: {
      fieldId: $fieldId
      singleSelectOptions: $options
    }) {
      projectV2Field {
        ... on ProjectV2SingleSelectField {
          id
          name
          options {
            id
            name
            color
          }
        }
      }
    }
  }
' -f fieldId="$FIELD_ID" -f options="$OPTIONS_INPUT" 2>&1)

# Check if the mutation was successful
if echo "$RESULT" | jq -e '.data.updateProjectV2Field.projectV2Field' >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Successfully added option '$OPTION_NAME' to field '$FIELD_NAME'${NC}"
  echo -e "\n${BLUE}Updated options:${NC}"
  echo "$RESULT" | jq -r '.data.updateProjectV2Field.projectV2Field.options[] | "  - \(.name) (\(.color))"'
else
  echo -e "${RED}✗ Failed to add option${NC}"
  echo -e "${YELLOW}Response:${NC}"
  echo "$RESULT"
  exit 1
fi
