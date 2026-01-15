#!/bin/bash
# Run database migrations
# Can be run inside the db-init container or standalone

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="${SCRIPT_DIR}/migrations"

# Database connection (use env vars or defaults)
DB_HOST="${DATABASE_HOST:-postgres}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-char_archive}"
DB_USER="${DATABASE_USER:-char_archive}"

export PGPASSWORD="${DATABASE_PASSWORD:-char_archive_local}"

echo "=== Running Database Migrations ==="
echo "Host: $DB_HOST"
echo ""

# Check if migrations table exists, create if not
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
" 2>/dev/null || true

# Run each migration file in order
for migration in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration" ]; then
        filename=$(basename "$migration")
        version="${filename%.sql}"

        # Check if already applied
        applied=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT 1 FROM schema_migrations WHERE version = '$version'" 2>/dev/null || echo "")

        if [ "$applied" = "1" ]; then
            echo "SKIP: $filename (already applied)"
        else
            echo "APPLYING: $filename"
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration"; then
                psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
                    "INSERT INTO schema_migrations (version) VALUES ('$version')"
                echo "DONE: $filename"
            else
                echo "FAILED: $filename"
                exit 1
            fi
        fi
        echo ""
    fi
done

echo "=== Migrations Complete ==="
