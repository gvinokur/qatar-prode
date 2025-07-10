#!/bin/bash

# SonarCloud issue checker script
# Usage: ./scripts/sonar-check.sh [TOKEN]

TOKEN=${1:-"4812592e553ddcc25bcbec3ed200dc75b59a549e"}
PROJECT_KEY="gvinokur_qatar-prode"

echo "🔍 Fetching SonarCloud issues for $PROJECT_KEY..."

# Get open issues
curl -s -u "$TOKEN:" \
  "https://sonarcloud.io/api/issues/search?componentKeys=$PROJECT_KEY&ps=100&statuses=OPEN" \
  | jq -r '
    .issues[] | 
    "[\(.severity)] \(.component | split(":")[1]) line \(.line // "?"):
     Rule: \(.rule)
     Message: \(.message)
     Type: \(.type)
     Tags: \(.tags | join(", "))
     ---"
  ' 2>/dev/null || echo "jq not available - install jq for formatted output"

echo -e "\n📊 Summary:"
curl -s -u "$TOKEN:" \
  "https://sonarcloud.io/api/issues/search?componentKeys=$PROJECT_KEY&ps=1&facets=severities,types" \
  | jq -r '.facets[] | select(.property == "severities" or .property == "types") | "  \(.property): " + (.values[] | "\(.val): \(.count)") ' 2>/dev/null

echo -e "\n📈 Code Coverage Metrics (New Code):"
curl -s -u "$TOKEN:" \
  "https://sonarcloud.io/api/measures/component?component=$PROJECT_KEY&metricKeys=new_uncovered_lines,new_lines_to_cover,new_coverage" \
  | jq -r '.component.measures[] | "  \(.metric): \(.value // "N/A")"' 2>/dev/null || echo "New code coverage data not available"

echo -e "\n📊 Overall Code Coverage Metrics:"
curl -s -u "$TOKEN:" \
  "https://sonarcloud.io/api/measures/component?component=$PROJECT_KEY&metricKeys=coverage,uncovered_lines,lines_to_cover,line_coverage" \
  | jq -r '.component.measures[] | "  \(.metric): \(.value // "N/A")"' 2>/dev/null || echo "Overall coverage data not available"

echo -e "\n✅ Run this script anytime to check current issues"
