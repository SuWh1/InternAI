#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run database migrations
alembic upgrade head

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 