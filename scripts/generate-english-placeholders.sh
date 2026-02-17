#!/bin/bash
# Generates English placeholder files from Spanish baseline

echo "Generating English placeholder files from Spanish baseline..."
echo ""

for es_file in locales/es/*.json; do
  filename=$(basename "$es_file")
  en_file="locales/en/$filename"

  echo "Generating $en_file from $es_file"

  # Use jq to transform Spanish values to EnOf() format
  jq 'walk(if type == "string" then "EnOf(\(.))" else . end)' "$es_file" > "$en_file"
done

echo ""
echo "English placeholder files generated successfully!"
echo "All string values now wrapped in EnOf() format for easy translation."
