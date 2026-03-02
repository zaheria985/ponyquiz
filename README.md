# PonyQuiz

An educational quiz app for young horse riders — featuring flashcards with spaced repetition, practice quizzes with immediate feedback, graded quizzes with scoring, and gamification with badges, unlockable rewards, and leaderboards.

## Features

- **Flashcard Mode** — Study with flip cards, track progress (got it / still learning)
- **Practice Mode** — Answer quiz questions with immediate feedback and explanations
- **Graded Quiz Mode** — Timed assessment with score summary and per-question breakdown
- **Gamification** — Earn badges, unlock avatars/themes/titles, compete on the leaderboard
- **AI Import** — Upload PDFs or Word docs to auto-generate questions via Claude API
- **Admin Panel** — Manage topics, questions, images, students, badges, and unlockables
- **Streaks & Progress** — Daily streak tracking, per-topic mastery, and activity history
- **Dark/Light Theme** — Toggle between themes with system preference detection
- **Self-Hosted** — Docker Compose stack with PostgreSQL, zero external dependencies required

## Tech Stack

- **Framework** — Next.js 14 (App Router, standalone output)
- **Database** — PostgreSQL 16
- **Auth** — NextAuth.js 4 with JWT + bcrypt credentials
- **Styling** — Tailwind CSS with CSS custom properties for theming
- **AI** — Anthropic Claude API (optional, for document import)

## Docker Quick Start (Recommended)

1. Clone and enter the repo:

```bash
git clone https://github.com/zaheria985/ponyquiz.git
cd ponyquiz
```

2. Create your env file:

```bash
cp .env.example .env
```

3. Set at least:
- `POSTGRES_PASSWORD` (choose any password for the database)
- `NEXTAUTH_SECRET` (run `openssl rand -base64 32` to generate one)
- `NEXTAUTH_URL` (for local Docker use `http://localhost:3000`)

4. Start the stack (app + PostgreSQL):

```bash
docker compose pull
docker compose up -d
```

5. Open `http://localhost:3000`

6. Register an account at `/register`, then promote to admin:

```bash
docker exec -it ponyquiz-db-1 psql -U ponyquiz -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

7. Seed default badges and unlockables (first time only):

```bash
docker exec -it ponyquiz-app-1 npx tsx db/seed.ts
```

On first startup the app container automatically:
- Waits for Postgres to be ready
- Applies the full schema if the database is empty
- Runs any pending migrations

## Docker Compose Options

### Option A: App + Database (default)

The default `docker-compose.yml` runs both the app and PostgreSQL:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ponyquiz
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ponyquiz
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ponyquiz -d ponyquiz"]
      interval: 5s
      timeout: 3s
      retries: 20

  app:
    image: ${APP_IMAGE:-ghcr.io/zaheria985/ponyquiz:latest}
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://ponyquiz:${POSTGRES_PASSWORD}@db:5432/ponyquiz
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
    ports:
      - "${APP_PORT:-3000}:3000"
    volumes:
      - uploads:/app/public/uploads

volumes:
  pgdata:
  uploads:
```

Run it:

```bash
docker compose pull
docker compose up -d
```

### Option B: App-only (external PostgreSQL)

If you already have a PostgreSQL server, run just the app:

```yaml
services:
  app:
    image: ${APP_IMAGE:-ghcr.io/zaheria985/ponyquiz:latest}
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://user:pass@your-db-host:5432/ponyquiz
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
    ports:
      - "3000:3000"
    volumes:
      - uploads:/app/public/uploads

volumes:
  uploads:
```

Set `DATABASE_URL` to your external PostgreSQL connection string.

### Option C: Unraid (Compose Manager)

Paste this into the Unraid Docker Compose Manager stack editor:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ponyquiz
      POSTGRES_PASSWORD: ponyquiz
      POSTGRES_DB: ponyquiz
    volumes:
      - /mnt/user/appdata/ponyquiz/db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ponyquiz -d ponyquiz"]
      interval: 5s
      timeout: 3s
      retries: 20

  app:
    image: ghcr.io/zaheria985/ponyquiz:latest
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://ponyquiz:ponyquiz@db:5432/ponyquiz
      NEXTAUTH_SECRET: change-me-to-a-random-string
      NEXTAUTH_URL: http://YOUR_UNRAID_IP:3000
    ports:
      - "3000:3000"
    volumes:
      - /mnt/user/appdata/ponyquiz/uploads:/app/public/uploads
```

Replace `YOUR_UNRAID_IP` with your server's IP address (e.g. `192.168.1.100`).

## Docker Image Publishing

- Image: `ghcr.io/zaheria985/ponyquiz`
- `latest` is published automatically from `master` via `.github/workflows/docker-publish.yml`.
- Every publish also includes a short SHA tag.

If you want to build locally instead of pulling the prebuilt image:

```bash
docker compose up --build -d
```

## Local Dev (Without Docker)

1. Install dependencies:

```bash
npm install
```

2. Copy environment config:

```bash
cp .env.example .env
```

3. Set required values in `.env`:
- `DATABASE_URL` (pointing to a running PostgreSQL instance)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (use `http://localhost:3000` for dev)

4. Start development server:

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `POSTGRES_PASSWORD` | Yes (Docker) | PostgreSQL password for Docker Compose |
| `NEXTAUTH_SECRET` | Yes | Session encryption key (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | App base URL (e.g. `http://localhost:3000`) |
| `ANTHROPIC_API_KEY` | No | Claude API key for AI document import |
| `APP_PORT` | No | Host port mapping (default: `3000`) |

## Database Notes

- PostgreSQL 16 is required.
- Schema source is `db/schema.sql`.
- Migrations are tracked in `db/migrations/` and applied by `db/migrate.js`.
- On first Docker startup, `db/bootstrap.js` auto-applies the schema.

## Troubleshooting

- **Login loop or auth failures:**
  - Verify `NEXTAUTH_URL` matches the URL you open in the browser.
  - Ensure `NEXTAUTH_SECRET` is set and stable across restarts.
- **Database connection errors:**
  - Confirm PostgreSQL is running and healthy.
  - Verify `DATABASE_URL` credentials and host/port.
- **Missing tables or columns:**
  - Restart the Docker container (migrations run automatically on startup).
- **AI import not working:**
  - Check that `ANTHROPIC_API_KEY` is set in your environment.
  - The app works without it — the import feature just won't be available.
