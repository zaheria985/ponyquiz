# Deployment Guide

## Production Deployment (Docker)

### Initial Setup
```bash
# 1. Clone repo and configure environment
cp .env.example .env
nano .env  # Set POSTGRES_PASSWORD, NEXTAUTH_SECRET, etc.

# 2. Build and start services
docker compose up --build -d

# 3. Migrations run automatically on app startup.
#    Optional manual/diagnostic run:
docker exec -it ponyquiz-app-1 node db/migrate.js

# 4. Seed default badges and unlockables (first time only)
docker exec -it ponyquiz-app-1 npx tsx db/seed.ts

# 5. Create admin account: register at /register, then promote
docker exec -it ponyquiz-db-1 psql -U ponyquiz -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

### Regular Updates
```bash
# 1. Pull latest changes
git pull origin master

# 2. Rebuild and restart
docker compose down
docker compose up --build -d

# 3. App startup auto-applies new migrations.
#    Optional manual/diagnostic run:
docker exec -it ponyquiz-app-1 node db/migrate.js
```

## Database Operations

### Backup
```bash
docker exec ponyquiz-db-1 pg_dump -U ponyquiz ponyquiz > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
cat backup_20260301.sql | docker exec -i ponyquiz-db-1 psql -U ponyquiz ponyquiz
```

### Manual Migration
```bash
docker exec -it ponyquiz-app-1 node db/migrate.js
```

## Health Checks
```bash
# Check app is running
curl http://localhost:3000

# View logs
docker compose logs -f app
docker compose logs -f db
```

## Rollback Procedure
```bash
# 1. Stop current deployment
docker compose down

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Rebuild and start
docker compose up --build -d

# 4. Restore database if needed (see Backup/Restore above)
```

## Caddy Reverse Proxy

If using Caddy for HTTPS:
```Caddyfile
ponyquiz.yourdomain.com {
    reverse_proxy localhost:3000
}
```

Reload: `sudo systemctl reload caddy`

## Environment Variables Checklist

Before deploying, ensure these are set:
- POSTGRES_PASSWORD
- NEXTAUTH_SECRET (generate with: `openssl rand -base64 32`)
- NEXTAUTH_URL (your public URL, e.g., `https://ponyquiz.yourdomain.com`)
- ANTHROPIC_API_KEY (optional, for AI document import)
- APP_PORT (optional, default 3000)
