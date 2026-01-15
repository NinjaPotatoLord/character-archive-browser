#!/bin/bash
# Script to import the database dump into PostgreSQL container

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Character Archive Database Import ==="
echo ""

# Check if PostgreSQL container is running
if ! docker compose -f "${PROJECT_DIR}/docker-compose.yml" ps postgres 2>/dev/null | grep -q "running"; then
    echo "Starting PostgreSQL container..."
    docker compose -f "${PROJECT_DIR}/docker-compose.yml" up -d postgres
    echo "Waiting for PostgreSQL to be ready..."
    sleep 15
fi

# Wait for PostgreSQL to be healthy
echo "Checking PostgreSQL health..."
for i in {1..30}; do
    if docker compose -f "${PROJECT_DIR}/docker-compose.yml" exec -T postgres pg_isready -U char_archive -d char_archive >/dev/null 2>&1; then
        echo "PostgreSQL is ready!"
        break
    fi
    echo "Waiting for PostgreSQL... ($i/30)"
    sleep 2
done

echo ""
echo "Importing database... This will take several minutes (11GB dump)."
echo "Progress will be shown below."
echo ""

# Import using pg_restore from the mounted dump file
docker compose -f "${PROJECT_DIR}/docker-compose.yml" exec -T postgres \
    pg_restore \
    --verbose \
    --no-owner \
    --no-privileges \
    --dbname=char_archive \
    --username=char_archive \
    /dump/database.dump

echo ""
echo "=== Import completed! ==="
echo ""
echo "You can now start the full stack with:"
echo "  cd ${PROJECT_DIR} && docker compose up -d"
