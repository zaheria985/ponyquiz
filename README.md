# PonyQuiz

An educational quiz app for young horse riders. Features flashcards with spaced repetition, practice quizzes with immediate feedback, graded quizzes with scoring, and gamification (badges, unlockables, leaderboard).

## Features

- **Flashcard Mode** — Study with flip cards, track progress (got it / still learning)
- **Practice Mode** — Answer quiz questions with immediate feedback and explanations
- **Graded Quiz Mode** — Timed assessment with score summary and per-question breakdown
- **Gamification** — Earn badges, unlock avatars/themes/titles, compete on the leaderboard
- **AI Import** — Upload PDFs or Word docs to auto-generate questions via Claude API
- **Admin Panel** — Manage topics, questions, images, students, badges, and unlockables
- **Dark/Light Theme** — Toggle between themes

## Tech Stack

- Next.js 14 (App Router)
- PostgreSQL 16
- NextAuth (JWT)
- Tailwind CSS
- Docker Compose

## Setup

### Docker (recommended)

```bash
cp .env.example .env
# Edit .env with your values

docker compose up -d
```

### Development

```bash
cp .env.example .env
# Edit .env — point DATABASE_URL to a local PostgreSQL instance

npm install
npm run dev
```

### Database Setup

The app automatically runs `db/bootstrap.js` (creates tables) and `db/migrate.js` (runs migrations) on startup.

To seed default badges and unlockables:

```bash
npx tsx db/seed.ts
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Random secret for JWT signing | Yes |
| `NEXTAUTH_URL` | App URL (e.g., `http://localhost:3000`) | Yes |
| `ANTHROPIC_API_KEY` | Claude API key for AI import | No |
| `POSTGRES_PASSWORD` | Database password (Docker) | For Docker |
| `APP_PORT` | Host port mapping (default: 3000) | No |

## Creating an Admin Account

Register a new account at `/register`, then update the role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```
