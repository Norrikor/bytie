#!/usr/bin/env sh
set -eu

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting Next.js..."
npm run start

