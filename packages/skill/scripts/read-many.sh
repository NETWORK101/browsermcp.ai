#!/bin/bash
# Read multiple URLs efficiently — discover links, then read selectively
# Usage: read-many.sh <base-url> [--filter pattern] [--budget N]

set -e

BASE_URL="${1:?Usage: read-many.sh <base-url> [--filter pattern]}"
FILTER="${2:---filter /}"
BUDGET="${3:-2000}"

echo "## Discovering links on $BASE_URL..."
LINKS=$(headlessdev links "$BASE_URL" $FILTER --json 2>/dev/null)
COUNT=$(echo "$LINKS" | grep -c '"href"' || echo 0)
echo "Found $COUNT links."

echo "$LINKS" | grep '"href"' | sed 's/.*"href": "//;s/".*//' | head -10 | while read -r url; do
  echo "## Reading: $url"
  headlessdev browse "$url" --budget "$BUDGET" --out "/tmp/hdv-$(echo "$url" | md5sum | cut -c1-8).md" 2>/dev/null
  echo "  → saved to /tmp/hdv-*.md"
done

echo "Done. Read the files in /tmp/hdv-*.md"
