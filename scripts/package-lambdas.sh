#!/bin/bash
set -e

SERVICES=(health auth profile uploads discovery interests chat subscriptions safety)
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
OUTPUT_DIR="$ROOT_DIR/infra/lambda-packages"
S3_BUCKET="${1:-thamizhakal-matrimony-tfstate}"
S3_PREFIX="lambda-packages"

echo "=== Lambda Packaging Script ==="
echo ""

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "[1/2] Bundling ${#SERVICES[@]} Lambda functions with esbuild..."

for SERVICE in "${SERVICES[@]}"; do
  ENTRY="$BACKEND_DIR/services/$SERVICE/index.ts"
  OUT_DIR="$OUTPUT_DIR/bundle-$SERVICE"

  mkdir -p "$OUT_DIR"

  cd "$BACKEND_DIR"
  npx esbuild "$ENTRY" \
    --bundle \
    --platform=node \
    --target=node20 \
    --outfile="$OUT_DIR/index.js" \
    --minify

  cd "$OUT_DIR"
  if command -v 7z.exe &>/dev/null; then
    7z.exe a -tzip "$OUTPUT_DIR/$SERVICE.zip" . -r > /dev/null 2>&1
  else
    zip -rq "$OUTPUT_DIR/$SERVICE.zip" .
  fi
  cd "$ROOT_DIR"

  SIZE=$(du -sh "$OUTPUT_DIR/$SERVICE.zip" 2>/dev/null | cut -f1)
  echo "  $SERVICE.zip ($SIZE)"
done

rm -rf "$OUTPUT_DIR"/bundle-*

echo ""
echo "[2/2] Uploading to S3 (s3://$S3_BUCKET/$S3_PREFIX/)..."

if command -v aws &>/dev/null; then
  aws s3 sync "$OUTPUT_DIR/" "s3://$S3_BUCKET/$S3_PREFIX/" --exclude "*" --include "*.zip"
  echo "  Uploaded all ZIPs to S3."
else
  echo "  WARNING: AWS CLI not found. Upload manually:"
  echo "  aws s3 sync $OUTPUT_DIR/ s3://$S3_BUCKET/$S3_PREFIX/ --exclude '*' --include '*.zip'"
fi

echo ""
echo "=== Done! ${#SERVICES[@]} packages created and uploaded ==="
ls -lh "$OUTPUT_DIR"/*.zip
