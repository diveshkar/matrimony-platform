#!/bin/bash
set -e

echo "=== Matrimony Platform - Local Setup ==="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required. Install v20+."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required. Run: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required."; exit 1; }

# Copy env file if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Update values as needed."
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Start Docker services
echo "Starting DynamoDB Local..."
docker compose up -d dynamodb-local dynamodb-admin

# Wait for DynamoDB to be ready
echo "Waiting for DynamoDB Local..."
sleep 3

# Seed tables
echo "Creating DynamoDB tables..."
npx tsx scripts/seed-tables.ts

echo ""
echo "=== Setup Complete ==="
echo "  Frontend:       pnpm dev:web        (http://localhost:3000)"
echo "  DynamoDB Admin: http://localhost:8001"
echo "  DynamoDB Local: http://localhost:8000"
echo ""
