#!/bin/bash
# Automatic database initialization script
# Runs inside the db-init container

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Database Initialization Check ==="

# Wait for PostgreSQL to be fully ready
until pg_isready -h postgres -U char_archive -d char_archive; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "PostgreSQL is ready."

# Check if database has tables (specifically chub_character_def as indicator)
TABLE_EXISTS=$(psql -h postgres -U char_archive -d char_archive -tAc \
    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chub_character_def');")

if [ "$TABLE_EXISTS" = "t" ]; then
    echo "Database already has data. Skipping import."
else
    echo ""
    echo "Database is empty. Starting import..."
    echo "This will take several minutes (11GB dump). Please wait."
    echo ""

    # Import the database
    pg_restore \
        --host=postgres \
        --username=char_archive \
        --dbname=char_archive \
        --no-owner \
        --no-privileges \
        --verbose \
        /dump/database.dump

    echo ""
    echo "=== Database import completed! ==="
fi

# Run migrations
echo ""
echo "=== Checking migrations ==="

# Set environment for migrations script
export DATABASE_HOST=postgres
export DATABASE_PORT=5432
export DATABASE_NAME=char_archive
export DATABASE_USER=char_archive
export DATABASE_PASSWORD="$PGPASSWORD"

# Run migrations if script exists
if [ -f "/scripts/run-migrations.sh" ]; then
    bash /scripts/run-migrations.sh
else
    echo "No migrations script found, skipping."
fi

echo ""
echo "=== Initialization complete! ==="
