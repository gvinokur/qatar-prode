#!/bin/bash

# SonarCloud PR issue checker script
# Usage: ./scripts/sonar-pr-check.sh [PR_NUMBER] [TOKEN]

PR_NUMBER=${1:-"5"}
TOKEN=${2:-"4812592e553ddcc25bcbec3ed200dc75b59a549e"}
PROJECT_KEY="gvinokur_qatar-prode"

echo "🔍 Fetching SonarCloud issues for PR #$PR_NUMBER in $PROJECT_KEY..."

# Get open issues for the PR
echo "📝 Open Issues in PR #$PR_NUMBER:"
curl -s -u "$TOKEN:" \
  "https://sonarcloud.io/api/issues/search?componentKeys=$PROJECT_KEY&pullRequest=$PR_NUMBER&ps=100&statuses=OPEN" \
  | jq -r '
    if .issues | length > 0 then
      .issues[] | 
      "[\(.severity)] \(.component | split(":")[1]) line \(.line // "?"):
       Rule: \(.rule)
       Message: \(.message)
       Type: \(.type)
       Tags: \(.tags | join(", "))
       ---"
    else
      "✅ No open issues found in this PR"
    end
  ' 2>/dev/null || echo "jq not available - install jq for formatted output"

echo -e "\n📊 Issue Summary for PR #$PR_NUMBER:"
curl -s -u "$TOKEN:" \
  "https://sonarcloud.io/api/issues/search?componentKeys=$PROJECT_KEY&pullRequest=$PR_NUMBER&ps=1&facets=severities,types" \
  | jq -r '
    if .total > 0 then
      .facets[] | select(.property == "severities" or .property == "types") | "  \(.property): " + (.values[] | "\(.val): \(.count)")
    else
      "✅ No issues found in this PR"
    end
  ' 2>/dev/null

echo -e "\n📈 Code Coverage Metrics for PR #$PR_NUMBER (New Code):"
curl -s -u "$TOKEN:" \
  "https://sonarcloud.io/api/measures/component?component=$PROJECT_KEY&pullRequest=$PR_NUMBER&metricKeys=new_uncovered_lines,new_lines_to_cover,new_coverage,new_duplicated_lines_density" \
  | jq -r '
    if .component.measures | length > 0 then
      .component.measures[] | "  \(.metric): \(.value // "N/A")"
    else
      "📊 New code coverage data not available for this PR"
    end
  ' 2>/dev/null || echo "New code coverage data not available"

echo -e "\n🔄 Quality Gate Status for PR #$PR_NUMBER:"
curl -s -u "$TOKEN:" \
  "https://sonarcloud.io/api/qualitygates/project_status?projectKey=$PROJECT_KEY&pullRequest=$PR_NUMBER" \
  | jq -r '
    if .projectStatus then
      "  Status: \(.projectStatus.status)
       Conditions:"
      + (if .projectStatus.conditions then
           (.projectStatus.conditions[] | "    \(.metricKey): \(.status) (actual: \(.actualValue // "N/A"}, threshold: \(.errorThreshold // "N/A"))")
         else
           "    No conditions found"
         end)
    else
      "❌ Quality gate status not available"
    end
  ' 2>/dev/null

echo -e "\n📊 Additional PR Metrics:"
curl -s -u "$TOKEN:" \
  "https://sonarcloud.io/api/measures/component?component=$PROJECT_KEY&pullRequest=$PR_NUMBER&metricKeys=new_bugs,new_vulnerabilities,new_security_hotspots,new_code_smells,new_technical_debt" \
  | jq -r '
    if .component.measures | length > 0 then
      .component.measures[] | "  \(.metric): \(.value // "N/A")"
    else
      "📊 Additional metrics not available for this PR"
    end
  ' 2>/dev/null || echo "Additional metrics not available"

echo -e "\n🌐 View full analysis at: https://sonarcloud.io/summary/new_code?id=$PROJECT_KEY&pullRequest=$PR_NUMBER"
echo -e "✅ Run this script anytime to check PR-specific issues"
