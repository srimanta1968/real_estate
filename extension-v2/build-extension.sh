#!/bin/bash
# Build the DealEval Pro (v2) extension into a zip for Chrome Web Store.
# Usage: bash build-extension.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
VERSION=$(grep -o '"version": *"[^"]*"' manifest.json | grep -o '[0-9.]*')
OUTPUT_FILE="dealeval-pro-v${VERSION}.zip"
BUILD_DIR=".build-temp"

echo "========================================="
echo " DealEval Pro Extension Build"
echo " Version: ${VERSION}"
echo "========================================="

rm -rf "$BUILD_DIR" "$OUTPUT_FILE"
mkdir -p "$BUILD_DIR"

echo "[1/4] Copying extension files..."
cp manifest.json "$BUILD_DIR/"
cp PRIVACY_POLICY.md "$BUILD_DIR/"
cp -r icons "$BUILD_DIR/"
cp -r src "$BUILD_DIR/"

echo "[2/4] Removing dev artifacts..."
find "$BUILD_DIR" -name "*.test.js" -delete 2>/dev/null || true
find "$BUILD_DIR" -name "*.spec.js" -delete 2>/dev/null || true
find "$BUILD_DIR" -name "*.map" -delete 2>/dev/null || true

echo "[3/4] Creating zip archive..."
(cd "$BUILD_DIR" && zip -qr "../$OUTPUT_FILE" .)

echo "[4/4] Cleaning up..."
rm -rf "$BUILD_DIR"

SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
FILES=$(unzip -l "$OUTPUT_FILE" | tail -1 | awk '{print $2}')
echo ""
echo "========================================="
echo " BUILD SUCCESSFUL"
echo "========================================="
echo " Output:  ${OUTPUT_FILE}"
echo " Size:    ${SIZE}"
echo " Files:   ${FILES}"
echo ""
echo " Next: Load unpacked from this folder or upload the zip"
echo "       to https://chrome.google.com/webstore/devconsole"
echo "========================================="
