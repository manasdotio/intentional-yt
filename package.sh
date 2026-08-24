#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${1:-"$SCRIPT_DIR/intentional-yt-firefox.zip"}"

PACKAGE_ITEMS=(
  "manifest.json"
  "background"
  "content"
  "icons"
  "styles"
  "ui"
  "utils"
)

for item in "${PACKAGE_ITEMS[@]}"; do
  if [ ! -e "$SCRIPT_DIR/$item" ]; then
    echo "Error: Missing package item '$item'" >&2
    exit 1
  fi
done

# Remove existing output file if present
rm -f "$OUTPUT_FILE"

# Create zip archive from the root directory
(
  cd "$SCRIPT_DIR"
  if command -v zip >/dev/null 2>&1; then
    zip -r -q -9 "$OUTPUT_FILE" "${PACKAGE_ITEMS[@]}"
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c "
import zipfile, os
items = '''${PACKAGE_ITEMS[*]}'''.split()
out = '$OUTPUT_FILE'
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for item in items:
        if os.path.isdir(item):
            for root, _, files in os.walk(item):
                for f in files:
                    fp = os.path.join(root, f)
                    zf.write(fp, fp)
        else:
            zf.write(item, item)
"
  else
    echo "Error: Neither 'zip' nor 'python3' is installed to package the extension." >&2
    exit 1
  fi
)

echo "Created package: $OUTPUT_FILE"
