#!/bin/sh
set -e

# Ensure upload subdirectories exist and are writable by nextjs.
# Volume mounts override build-time directories, so this must run at startup as root.
mkdir -p /app/public/uploads/diagrams /app/public/uploads/photos /app/public/uploads/references
chown -R nextjs:nodejs /app/public/uploads

# Drop to nextjs user and start the app
exec su -s /bin/sh nextjs -c "node db/bootstrap.js && node db/migrate.js && node server.js"
