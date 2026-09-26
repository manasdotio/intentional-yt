#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${1:-"$SCRIPT_DIR/intentional-yt.zip"}"

PACKAGE_ITEMS=(
  "manifest.json"
  "_locales"
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

# Output files
CHROME_OUT="$SCRIPT_DIR/intentional-yt.zip"
EDGE_OUT="$SCRIPT_DIR/intentional-yt-edge.zip"
FIREFOX_OUT="$SCRIPT_DIR/intentional-yt-firefox.zip"

# Prefer cross-platform Node packager if available
if command -v node >/dev/null 2>&1; then
  node "$SCRIPT_DIR/scripts/package.cjs"
  exit 0
fi

python3 -c "
import json, zipfile, os

script_dir = '$SCRIPT_DIR'
items = ['_locales', 'background', 'content', 'icons', 'styles', 'ui', 'utils']
edge_items = ['background', 'content', 'icons', 'styles', 'ui', 'utils']

manifest_path = os.path.join(script_dir, 'manifest.json')
with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest_data = json.load(f)

# Chromium base manifest (service_worker only, no background.scripts)
chrome_manifest = json.loads(json.dumps(manifest_data))
if 'background' in chrome_manifest and 'scripts' in chrome_manifest['background']:
    del chrome_manifest['background']['scripts']

# 1. Chrome Web Store Package (All 26 locales)
with zipfile.ZipFile('$CHROME_OUT', 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('manifest.json', json.dumps(chrome_manifest, indent=2))
    for item in items:
        item_path = os.path.join(script_dir, item)
        if os.path.isdir(item_path):
            for root, _, files in os.walk(item_path):
                for f in sorted(files):
                    fp = os.path.join(root, f)
                    arcname = os.path.relpath(fp, script_dir)
                    zf.write(fp, arcname)
        elif os.path.isfile(item_path):
            zf.write(item_path, item)

# 2. Microsoft Edge Add-ons Package (English-only _locales to bypass Partner Center multi-language mandate)
with zipfile.ZipFile('$EDGE_OUT', 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('manifest.json', json.dumps(chrome_manifest, indent=2))
    # Write ONLY _locales/en
    en_msg = os.path.join(script_dir, '_locales', 'en', 'messages.json')
    zf.write(en_msg, os.path.join('_locales', 'en', 'messages.json'))
    for item in edge_items:
        item_path = os.path.join(script_dir, item)
        if os.path.isdir(item_path):
            for root, _, files in os.walk(item_path):
                for f in sorted(files):
                    fp = os.path.join(root, f)
                    arcname = os.path.relpath(fp, script_dir)
                    zf.write(fp, arcname)
        elif os.path.isfile(item_path):
            zf.write(item_path, item)

# 3. Firefox AMO Package (Retains background.scripts fallback and Gecko settings)
with zipfile.ZipFile('$FIREFOX_OUT', 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('manifest.json', json.dumps(manifest_data, indent=2))
    for item in items:
        item_path = os.path.join(script_dir, item)
        if os.path.isdir(item_path):
            for root, _, files in os.walk(item_path):
                for f in sorted(files):
                    fp = os.path.join(root, f)
                    arcname = os.path.relpath(fp, script_dir)
                    zf.write(fp, arcname)
        elif os.path.isfile(item_path):
            zf.write(item_path, item)
"

echo "=================================================="
echo "✔ Packages created successfully:"
echo "  • Chrome Web Store        : $CHROME_OUT"
echo "  • Microsoft Edge Add-ons  : $EDGE_OUT (EN-only listing)"
echo "  • Mozilla Firefox (AMO)   : $FIREFOX_OUT"
echo "=================================================="
