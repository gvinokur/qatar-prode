#!/bin/bash

# Configuration
NOTEBOOK_ID="e480031f-4dad-4c8b-ae9e-0d8fe8a1dff3"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMP_DIR="$SCRIPT_DIR/.nlm_temp"
mkdir -p "$TEMP_DIR"

# 1. Define the "Important Files" find function
# Focusing on documentation, plans (EXCLUDED for notebook), and core logic.
get_important_files() {
    {
        # Documentation (Excluding historical/audit files)
        find ./docs -type f -name "*.md" \
            -not -path "./docs/ux-audit-report.md" \
            -not -path "./docs/ux-improvement-backlog.md" \
            -not -path "./docs/visual-audit/*" \
            -not -path "./docs/workflow-optimization-investigation.md" \
            -not -path "./docs/friend-groups-social-enhancements.md" 2>/dev/null
        
        # Core Application Logic
        find ./app/actions ./app/db ./app/utils ./i18n ./types ./database_pg_ddl -type f \( -name "*.ts" -o -name "*.sql" \) 2>/dev/null
        
        # High-level UI structure (only layouts and pages)
        find ./app -type f \( -name "layout.tsx" -o -name "page.tsx" -o -name "template.tsx" -o -name "transition.tsx" -o -name "route.ts" \) 2>/dev/null
        
        # Core Config
        find . -maxdepth 1 -type f \( -name "package.json" -o -name "next.config.*" -o -name "tsconfig.json" -o -name "middleware.ts" -o -name "auth.ts" -o -name "README.md" -o -name "CODE-STRUCTURE.md" -o -name ".env.example" \) 2>/dev/null
    } | grep -v "__tests__" | grep -v "mocks" | sort -u
}

echo "🔍 Scanning for important files..."
important_files=$(get_important_files)
total=$(echo "$important_files" | wc -l)

# 2. Get current notebook sources for pruning
echo "📥 Fetching current notebook sources..."
# Format: ID TITLE
nlm source list "$NOTEBOOK_ID" | grep -oE '"id": "[^"]+"|"title": "[^"]+"' | paste -d' ' - - | sed 's/"id": "//;s/", "title": "/ /;s/"//g' > "$TEMP_DIR/current_mapping.txt"

# 3. Create a list of titles we ARE syncing to identify what to prune
echo "" > "$TEMP_DIR/sync_titles.txt"

# 4. Sync files
echo "🚀 Syncing $total files to NotebookLM..."
current=0
while read -r file; do
    if [ -z "$file" ]; then continue; fi
    ((current++))
    
    # Create display title
    display_title=$(echo "$file" | sed 's|^\./||;s|/|_|g')
    echo "$display_title" >> "$TEMP_DIR/sync_titles.txt"
    
    # Check if it already exists
    existing_id=$(grep -F " $display_title" "$TEMP_DIR/current_mapping.txt" | awk '{print $1}')
    
    if [ -n "$existing_id" ]; then
        # For simplicity in this script, we refresh if it exists
        # In a real scenario, we could skip if unchanged
        echo "[$current/$total] Updating: $file"
        nlm source delete "$existing_id" --confirm > /dev/null 2>&1
    else
        echo "[$current/$total] Adding: $file"
    fi
    
    # Upload
    if [[ "$file" == *.md || "$file" == *.pdf ]]; then
        nlm source add "$NOTEBOOK_ID" --file "$file" --title "$display_title" > /dev/null 2>&1
    else
        content=$(cat "$file")
        nlm source add "$NOTEBOOK_ID" --text "$content" --title "$display_title" > /dev/null 2>&1
    fi
done <<< "$important_files"

# 5. Prune sources that are no longer "important"
echo "🧹 Pruning old sources from notebook..."
while read -r line; do
    id=$(echo "$line" | awk '{print $1}')
    title=$(echo "$line" | cut -d' ' -f2-)
    
    if ! grep -qXF "$title" "$TEMP_DIR/sync_titles.txt"; then
        echo "   Removing obsolete source: $title"
        nlm source delete "$id" --confirm > /dev/null 2>&1
    fi
done < "$TEMP_DIR/current_mapping.txt"

echo "✅ Sync complete!"
rm -rf "$TEMP_DIR"
