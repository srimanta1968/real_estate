#!/bin/bash
# Build script for DealEval Chrome Extension
# Creates a production-ready zip file for Chrome Web Store submission
#
# Usage: bash build-extension.sh
# Output: dealeval-extension-v{VERSION}.zip

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Read version from manifest.json
VERSION=$(grep -o '"version": *"[^"]*"' manifest.json | grep -o '[0-9.]*')
OUTPUT_FILE="dealeval-extension-v${VERSION}.zip"
BUILD_DIR=".build-temp"

echo "========================================="
echo " DealEval Extension Build"
echo " Version: ${VERSION}"
echo "========================================="

# Clean previous build
rm -rf "$BUILD_DIR" "$OUTPUT_FILE"
mkdir -p "$BUILD_DIR"

echo "[1/5] Copying extension files..."

# Copy all required files
cp manifest.json "$BUILD_DIR/"
cp PRIVACY_POLICY.md "$BUILD_DIR/"
cp -r icons "$BUILD_DIR/"
cp -r src "$BUILD_DIR/"

echo "[2/5] Removing development artifacts..."

# Remove any dev-only files that might have crept in
find "$BUILD_DIR" -name "*.test.js" -delete 2>/dev/null || true
find "$BUILD_DIR" -name "*.spec.js" -delete 2>/dev/null || true
find "$BUILD_DIR" -name "*.map" -delete 2>/dev/null || true
find "$BUILD_DIR" -name ".DS_Store" -delete 2>/dev/null || true
find "$BUILD_DIR" -name "Thumbs.db" -delete 2>/dev/null || true
rm -f "$BUILD_DIR/README.md" 2>/dev/null || true

echo "[3/5] Validating manifest references..."

# Verify all files referenced in manifest.json exist
ERRORS=0

# Check service worker
SW=$(grep -o '"service_worker": *"[^"]*"' "$BUILD_DIR/manifest.json" | grep -o '"[^"]*"$' | tr -d '"')
if [ ! -f "$BUILD_DIR/$SW" ]; then
  echo "  ERROR: Missing service worker: $SW"
  ERRORS=$((ERRORS + 1))
fi

# Check all content script JS files
grep -o '"js": *\[[^]]*\]' "$BUILD_DIR/manifest.json" | grep -o '"src/[^"]*"' | tr -d '"' | while read JS_FILE; do
  if [ ! -f "$BUILD_DIR/$JS_FILE" ]; then
    echo "  ERROR: Missing content script: $JS_FILE"
  fi
done

# Check icons
for SIZE in 16 48 128; do
  if [ ! -f "$BUILD_DIR/icons/icon${SIZE}.png" ]; then
    echo "  ERROR: Missing icon: icons/icon${SIZE}.png"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check popup
POPUP=$(grep -o '"default_popup": *"[^"]*"' "$BUILD_DIR/manifest.json" | grep -o '"[^"]*"$' | tr -d '"')
if [ ! -f "$BUILD_DIR/$POPUP" ]; then
  echo "  ERROR: Missing popup: $POPUP"
  ERRORS=$((ERRORS + 1))
fi

# Check options page
OPTIONS=$(grep -o '"options_page": *"[^"]*"' "$BUILD_DIR/manifest.json" | grep -o '"[^"]*"$' | tr -d '"')
if [ -n "$OPTIONS" ] && [ ! -f "$BUILD_DIR/$OPTIONS" ]; then
  echo "  ERROR: Missing options page: $OPTIONS"
  ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -gt 0 ]; then
  echo "  FAILED: $ERRORS missing files. Fix before submitting."
  rm -rf "$BUILD_DIR"
  exit 1
fi
echo "  All manifest references verified."

echo "[4/5] Creating zip archive..."

cd "$BUILD_DIR"
zip -r "../$OUTPUT_FILE" . -x ".*" > /dev/null
cd ..

echo "[5/5] Cleaning up..."
rm -rf "$BUILD_DIR"

# Show results
SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
FILE_COUNT=$(unzip -l "$OUTPUT_FILE" | tail -1 | awk '{print $2}')

echo ""
echo "========================================="
echo " BUILD SUCCESSFUL"
echo "========================================="
echo " Output:  $OUTPUT_FILE"
echo " Size:    $SIZE"
echo " Files:   $FILE_COUNT"
echo ""
echo " Next: Upload to Chrome Web Store"
echo " https://chrome.google.com/webstore/devconsole"
echo "========================================="
