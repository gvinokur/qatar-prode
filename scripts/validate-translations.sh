#!/bin/bash
# Translation Validation Script
# Validates all translation files for completeness and correctness
#
# Usage: ./scripts/validate-translations.sh
# Exit codes: 0 = success, 1 = errors found

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Validating translation files...${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Check if we're in the project root
if [ ! -d "locales" ]; then
  echo -e "${RED}❌ ERROR: Must run from project root (locales/ directory not found)${NC}"
  exit 1
fi

# ============================================================================
# CHECK 1: Verify no placeholders remain in EITHER locale
# ============================================================================
echo -e "${BLUE}1️⃣  Checking for EnOf/EsOf placeholders...${NC}"

PLACEHOLDER_FOUND=0

for file in locales/en/*.json locales/es/*.json; do
  if [ -f "$file" ]; then
    # Check for EnOf or EsOf markers
    if grep -q "EnOf\|EsOf" "$file"; then
      echo -e "${RED}❌ ERROR: Placeholders found in $file${NC}"
      # Show first 5 occurrences with line numbers
      grep -n "EnOf\|EsOf" "$file" | head -5 | while read -r line; do
        echo -e "   ${YELLOW}$line${NC}"
      done
      PLACEHOLDER_FOUND=1
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

if [ $PLACEHOLDER_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ No placeholders found${NC}"
fi
echo ""

# ============================================================================
# CHECK 2: Validate JSON syntax
# ============================================================================
echo -e "${BLUE}2️⃣  Validating JSON syntax...${NC}"

JSON_ERRORS=0

for file in locales/en/*.json locales/es/*.json; do
  if [ -f "$file" ]; then
    if ! jq empty "$file" 2>/dev/null; then
      echo -e "${RED}❌ ERROR: Invalid JSON in $file${NC}"
      # Show the jq error
      jq empty "$file" 2>&1 | head -3
      JSON_ERRORS=1
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

if [ $JSON_ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All JSON files have valid syntax${NC}"
fi
echo ""

# ============================================================================
# CHECK 3: Check structure consistency between locales
# ============================================================================
echo -e "${BLUE}3️⃣  Checking structure consistency...${NC}"

STRUCTURE_ERRORS=0

for es_file in locales/es/*.json; do
  if [ -f "$es_file" ]; then
    filename=$(basename "$es_file")
    en_file="locales/en/$filename"

    if [ ! -f "$en_file" ]; then
      echo -e "${RED}❌ ERROR: English file missing for $filename${NC}"
      STRUCTURE_ERRORS=1
      ERRORS=$((ERRORS + 1))
      continue
    fi

    # Extract all JSON paths (keys) from both files
    es_keys=$(jq -r 'paths(scalars) as $p | $p | join(".")' "$es_file" 2>/dev/null | sort)
    en_keys=$(jq -r 'paths(scalars) as $p | $p | join(".")' "$en_file" 2>/dev/null | sort)

    # Check if structures match
    if ! diff <(echo "$es_keys") <(echo "$en_keys") > /dev/null 2>&1; then
      echo -e "${RED}❌ ERROR: Structure mismatch in $filename${NC}"

      # Show keys in ES but not in EN
      es_only=$(comm -23 <(echo "$es_keys") <(echo "$en_keys") | head -3)
      if [ -n "$es_only" ]; then
        echo -e "   ${YELLOW}Keys in Spanish but not English (showing first 3):${NC}"
        echo "$es_only" | while read -r key; do
          echo -e "     - $key"
        done
      fi

      # Show keys in EN but not in ES
      en_only=$(comm -13 <(echo "$es_keys") <(echo "$en_keys") | head -3)
      if [ -n "$en_only" ]; then
        echo -e "   ${YELLOW}Keys in English but not Spanish (showing first 3):${NC}"
        echo "$en_only" | while read -r key; do
          echo -e "     - $key"
        done
      fi

      STRUCTURE_ERRORS=1
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

if [ $STRUCTURE_ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Structure matches across all locales${NC}"
fi
echo ""

# ============================================================================
# CHECK 4: Validate interpolation variables preserved
# ============================================================================
echo -e "${BLUE}4️⃣  Validating interpolation variables...${NC}"

INTERPOLATION_WARNINGS=0

for es_file in locales/es/*.json; do
  if [ -f "$es_file" ]; then
    filename=$(basename "$es_file")
    en_file="locales/en/$filename"

    if [ ! -f "$en_file" ]; then
      continue  # Skip if English file missing (already reported in check 3)
    fi

    # Extract all {variable} patterns from both files
    es_vars=$(jq -r '.. | strings' "$es_file" 2>/dev/null | grep -o '{[^}]*}' | sort -u || true)
    en_vars=$(jq -r '.. | strings' "$en_file" 2>/dev/null | grep -o '{[^}]*}' | sort -u || true)

    # Check if variable sets match
    if [ "$es_vars" != "$en_vars" ]; then
      # Only warn if one has variables and the other doesn't, or if they're different
      if [ -n "$es_vars" ] || [ -n "$en_vars" ]; then
        echo -e "${YELLOW}⚠️  WARNING: Interpolation variables differ in $filename${NC}"

        if [ -n "$es_vars" ]; then
          echo -e "   Spanish variables: ${YELLOW}$(echo $es_vars | tr '\n' ' ')${NC}"
        else
          echo -e "   Spanish variables: ${YELLOW}(none)${NC}"
        fi

        if [ -n "$en_vars" ]; then
          echo -e "   English variables: ${YELLOW}$(echo $en_vars | tr '\n' ' ')${NC}"
        else
          echo -e "   English variables: ${YELLOW}(none)${NC}"
        fi

        INTERPOLATION_WARNINGS=1
        WARNINGS=$((WARNINGS + 1))
      fi
    fi
  fi
done

if [ $INTERPOLATION_WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ Interpolation variables consistent${NC}"
fi
echo ""

# ============================================================================
# CHECK 5: Verify all expected files exist
# ============================================================================
echo -e "${BLUE}5️⃣  Checking for expected translation files...${NC}"

EXPECTED_FILES=(
  "auth.json"
  "awards.json"
  "backoffice.json"
  "common.json"
  "emails.json"
  "errors.json"
  "games.json"
  "groups.json"
  "navigation.json"
  "onboarding.json"
  "predictions.json"
  "qualified-teams.json"
  "rules.json"
  "stats.json"
  "tables.json"
  "tournaments.json"
  "validation.json"
)

MISSING_FILES=0

for file in "${EXPECTED_FILES[@]}"; do
  if [ ! -f "locales/es/$file" ]; then
    echo -e "${RED}❌ ERROR: Missing Spanish file: locales/es/$file${NC}"
    MISSING_FILES=1
    ERRORS=$((ERRORS + 1))
  fi

  if [ ! -f "locales/en/$file" ]; then
    echo -e "${RED}❌ ERROR: Missing English file: locales/en/$file${NC}"
    MISSING_FILES=1
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $MISSING_FILES -eq 0 ]; then
  echo -e "${GREEN}✅ All expected files present${NC}"
fi
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ ✅ ✅ All validation checks passed!${NC}"
  echo ""
  echo "Translation files are ready for deployment."
  exit 0
elif [ $ERRORS -eq 0 ] && [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Validation passed with $WARNINGS warning(s).${NC}"
  echo ""
  echo "Please review warnings above. These are non-blocking but should be checked."
  exit 0
else
  echo -e "${RED}❌ ❌ ❌ Found $ERRORS error(s) and $WARNINGS warning(s).${NC}"
  echo ""
  echo "Please fix the errors above before proceeding."
  exit 1
fi
