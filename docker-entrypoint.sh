#!/bin/bash
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run migrations in development
if [ "$NODE_ENV" = "development" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
fi

# Start the application
echo "Starting NestJS application..."
if [ "$NODE_ENV" = "development" ]; then
  exec npm run start:dev
else
  exec npm run start:prod
fi 