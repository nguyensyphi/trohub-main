#!/bin/sh
set -e
echo "Running database migrations..."
npm run migrate
exec node index.js
