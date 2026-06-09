#!/bin/sh
set -e

# SQLite database migration
echo "Running database migrations..."
pnpm exec prisma db push

# Start Next.js server
echo "Starting Next.js application..."
pnpm start
