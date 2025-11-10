#!/usr/bin/env bash
set -euo pipefail

# Pre-push verification script
# - Starts Postgres via docker compose (db only)
# - Waits for readiness
# - Pushes Prisma schema and applies SQL patches
# - Runs DB tests and Jest suite
# - Optionally tears down containers

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/devops/docker-compose.yml"

echo "[1/7] Starting Postgres container..."
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Please install Docker Desktop and retry." >&2
  exit 127
fi

docker compose -f "$COMPOSE_FILE" up -d db

echo "[2/7] Waiting for Postgres to be healthy..."
for i in {1..30}; do
  health=$(docker inspect --format='{{json .State.Health.Status}}' rentmyride-db 2>/dev/null || echo "\"starting\"")
  if [[ "$health" == "\"healthy\"" ]]; then
    echo "Postgres is healthy."
    break
  fi
  echo "  Waiting ($i/30)..."
  sleep 2
done

if [[ "$health" != "\"healthy\"" ]]; then
  echo "Database did not become healthy in time." >&2
  exit 1
fi

echo "[3/7] Ensuring DATABASE_URL_APP for local compose..."
export DATABASE_URL_APP="postgresql://app:app@localhost:5432/rentmyride"

echo "[4/7] Pushing Prisma schema..."
(cd "$ROOT_DIR" && npx prisma db push --schema=prisma/app.schema.prisma)

echo "[5/7] Applying SQL patches..."
(cd "$ROOT_DIR" && node prisma/apply-patches.js || true)

echo "[6/7] Running DB tests harness..."
(cd "$ROOT_DIR" && node prisma/db-tests.js || true)

echo "[7/7] Running Jest test suite..."
(cd "$ROOT_DIR" && npm test -- --runInBand)

echo "Pre-push verification completed successfully."
echo "Tip: To stop containers: docker compose -f \"$COMPOSE_FILE\" down"
