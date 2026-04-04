#!/bin/bash
set -e

# Lambda Packaging Script
# Usage: bash scripts/package-lambdas.sh
# Creates ZIP files for each Lambda service in infra/lambda-packages/

SERVICES=(health auth profile uploads discovery interests chat subscriptions safety)
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
OUTPUT_DIR="$ROOT_DIR/infra/lambda-packages"
TEMP_DIR="/tmp/lambda-build-$$"

echo "=== Lambda Packaging Script ==="
echo ""

# Step 1: Build backend TypeScript
echo "[1/4] Building backend..."
cd "$BACKEND_DIR"
npx tsc -b
echo "  Done."

# Step 2: Install production dependencies
echo "[2/4] Installing production dependencies..."
PROD_MODULES="$TEMP_DIR/node_modules_prod"
mkdir -p "$PROD_MODULES"
cp "$BACKEND_DIR/package.json" "$TEMP_DIR/package.json"

# Use a temp pnpm install with --prod to get only production deps
cd "$TEMP_DIR"
pnpm install --prod --ignore-scripts --no-frozen-lockfile 2>/dev/null || npm install --omit=dev 2>/dev/null
cd "$ROOT_DIR"
echo "  Done."

# Step 3: Create output directory
echo "[3/4] Packaging ${#SERVICES[@]} Lambda functions..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

for SERVICE in "${SERVICES[@]}"; do
  STAGE_DIR="$TEMP_DIR/stage-$SERVICE"
  rm -rf "$STAGE_DIR"
  mkdir -p "$STAGE_DIR"

  # Copy compiled service code
  if [ -d "$BACKEND_DIR/dist/services/$SERVICE" ]; then
    cp -r "$BACKEND_DIR/dist/services/$SERVICE" "$STAGE_DIR/services/$SERVICE"
  fi

  # Copy shared code (middleware, repositories, utils)
  if [ -d "$BACKEND_DIR/dist/services/shared" ]; then
    cp -r "$BACKEND_DIR/dist/services/shared" "$STAGE_DIR/services/shared"
  fi

  # Copy packages (shared-types, shared-schemas, shared-config)
  if [ -d "$BACKEND_DIR/dist/packages" ]; then
    cp -r "$BACKEND_DIR/dist/packages" "$STAGE_DIR/packages"
  fi

  # Copy production node_modules
  if [ -d "$TEMP_DIR/node_modules" ]; then
    cp -r "$TEMP_DIR/node_modules" "$STAGE_DIR/node_modules"
  fi

  # Create ZIP
  cd "$STAGE_DIR"
  zip -rq "$OUTPUT_DIR/$SERVICE.zip" . 2>/dev/null
  cd "$ROOT_DIR"

  SIZE=$(du -sh "$OUTPUT_DIR/$SERVICE.zip" | cut -f1)
  echo "  $SERVICE.zip ($SIZE)"
done

# Step 4: Cleanup
echo "[4/4] Cleaning up..."
rm -rf "$TEMP_DIR"

echo ""
echo "=== Done! ${#SERVICES[@]} packages created in infra/lambda-packages/ ==="
echo ""
ls -lh "$OUTPUT_DIR"/*.zip
