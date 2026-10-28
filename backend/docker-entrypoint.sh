#!/bin/sh
set -e

# Wait for PostgreSQL
python wait_for_db.py

# Apply database migrations safely
python manage.py migrate --noinput

# Seed only in development if requested
if [ "$DEBUG" = "True" ] || [ "$DEBUG" = "1" ] || [ "$DEBUG" = "true" ]; then
    if [ "$SEED_ON_STARTUP" = "True" ] || [ "$SEED_ON_STARTUP" = "true" ] || [ "$SEED_ON_STARTUP" = "1" ]; then
        python manage.py seed_algoset || true
    fi
fi

exec "$@"

