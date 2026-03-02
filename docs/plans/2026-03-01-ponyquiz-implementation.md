# PonyQuiz Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build PonyQuiz — an educational quiz web app for young riders with flashcards, practice quizzes, graded quizzes, and gamification.

**Architecture:** Next.js 14 App Router with raw PostgreSQL (node-postgres), NextAuth JWT auth, Tailwind CSS with CSS variable design tokens. Self-hosted via Docker Compose. Follows the same patterns as harmony-homeschool and high-eq/barnbook — server actions for mutations, `lib/queries/` for reads, `lib/actions/` for writes, Zod validation, parameterized SQL, `force-dynamic` on all DB pages.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, PostgreSQL 16, node-postgres (`pg`), NextAuth 4, bcryptjs, Zod, Claude API (`@anthropic-ai/sdk`), Docker Compose, Beads (issue tracking)

**Conventions (from existing projects):**
- Raw SQL with `$1` parameterized queries — no ORM
- Numbered SQL migrations in `db/migrations/`
- `db/bootstrap.js` + `db/migrate.js` for startup
- `export const dynamic = "force-dynamic"` on all DB-querying pages
- Server actions return `{ success: true, data? }` or `{ error: string }`
- Zod `safeParse()` before all DB writes
- `revalidatePath()` after mutations
- CSS variable design tokens — no hardcoded colors
- Tailwind only — no component libraries
- `"use client"` only when needed (useState, onClick, etc.)
- `@/` alias imports
- Semicolons in all TypeScript
- `lib/db.ts` and `lib/queries/*` never imported from client components
- Docker multi-stage build with `output: "standalone"`
- Beads for issue tracking (`bd` CLI)

---

## Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `.eslintrc.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`

**Step 1: Initialize project**

```bash
cd /home/claude/projects/code/ponyquiz
git init
npm init -y
npm install next@14 react react-dom
npm install -D typescript @types/react @types/node tailwindcss postcss autoprefixer eslint eslint-config-next
npx tailwindcss init -p --ts
```

**Step 2: Configure package.json scripts**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "node --import tsx --test tests/*.test.ts",
    "db:migrate": "node db/migrate.js",
    "db:check": "node db/migrate.js --check",
    "db:seed": "npx tsx db/seed.ts"
  }
}
```

**Step 3: Create next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg"],
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: "/api/uploads/:path*" },
    ];
  },
};

module.exports = nextConfig;
```

**Step 4: Create tsconfig.json with `@/` alias**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 5: Create tailwind.config.ts with CSS variable tokens**

Configure colors to reference CSS variables: `surface`, `interactive`, `text-primary`, etc. Match the token pattern from harmony-homeschool.

**Step 6: Create app/globals.css with design tokens**

Define CSS custom properties for light and dark modes: `--app-bg`, `--surface`, `--text-primary`, `--interactive`, `--success-*`, `--warning-*`, `--error-*`, `--border`, etc. Kid-friendly color palette — bright, engaging, but not garish.

**Step 7: Create app/layout.tsx**

Root layout with html/body, font imports, globals.css import. Add Providers wrapper (placeholder for now).

**Step 8: Create app/page.tsx**

Simple redirect to `/dashboard` or `/login` depending on auth state.

**Step 9: Create .env.example**

```env
DATABASE_URL=postgresql://ponyquiz:changeme@localhost:5432/ponyquiz
POSTGRES_PASSWORD=changeme
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=your-api-key-here
```

**Step 10: Create .gitignore**

Standard Next.js gitignore + `.env`, `node_modules`, `.next`, `public/uploads/*`.

**Step 11: Initialize Beads**

```bash
bd init
```

**Step 12: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind and config"
```

---

## Task 2: Database Schema & Migration Infrastructure

**Files:**
- Create: `db/schema.sql`
- Create: `db/bootstrap.js`
- Create: `db/migrate.js`
- Create: `db/migrations/.gitkeep`
- Create: `lib/db.ts`

**Step 1: Install pg**

```bash
npm install pg
npm install -D @types/pg tsx
```

**Step 2: Create lib/db.ts**

```typescript
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
```

**Step 3: Create db/schema.sql**

Full schema with all tables. UUID primary keys via `gen_random_uuid()`. All enums as VARCHAR with CHECK constraints (not PostgreSQL ENUM types — easier to migrate).

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  avatar VARCHAR(255),
  title VARCHAR(100),
  streak_count INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Topics
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Images
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path VARCHAR(500) NOT NULL,
  alt_text VARCHAR(500),
  type VARCHAR(20) NOT NULL CHECK (type IN ('diagram', 'photo', 'reference')),
  hotspots JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'multiple_choice', 'true_false',
    'flashcard_qa', 'flashcard_term', 'flashcard_image',
    'labeled_diagram', 'photo_id', 'image_text'
  )),
  topic_id UUID REFERENCES topics(id),
  difficulty VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  explanation TEXT,
  options JSONB,
  answer TEXT,
  image_id UUID REFERENCES images(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quiz Attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('practice', 'graded')),
  score INT,
  total_questions INT NOT NULL,
  topic_filter JSONB,
  difficulty VARCHAR(20),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quiz Answers
CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_answer TEXT,
  correct BOOLEAN NOT NULL
);

-- Flashcard Progress
CREATE TABLE flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  status VARCHAR(20) NOT NULL DEFAULT 'still_learning' CHECK (status IN ('got_it', 'still_learning')),
  last_reviewed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  review_count INT NOT NULL DEFAULT 0,
  UNIQUE (user_id, question_id)
);

-- Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student Badges
CREATE TABLE student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

-- Unlockables
CREATE TABLE unlockables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('avatar', 'theme', 'title')),
  criteria JSONB NOT NULL,
  asset_path VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student Unlockables
CREATE TABLE student_unlockables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unlockable_id UUID NOT NULL REFERENCES unlockables(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  equipped BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, unlockable_id)
);

-- Indexes
CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_answers_attempt ON quiz_answers(quiz_attempt_id);
CREATE INDEX idx_flashcard_progress_user ON flashcard_progress(user_id);
CREATE INDEX idx_student_badges_user ON student_badges(user_id);
CREATE INDEX idx_student_unlockables_user ON student_unlockables(user_id);
```

**Step 4: Create db/bootstrap.js**

Match harmony-homeschool pattern: check if schema exists, apply schema.sql if empty, optionally seed admin user.

**Step 5: Create db/migrate.js**

Match harmony-homeschool pattern: read `db/migrations/*.sql`, track applied in `schema_migrations` table, apply pending in order.

**Step 6: Test locally**

```bash
# Start a local PostgreSQL (or use Docker)
docker run -d --name ponyquiz-db -e POSTGRES_PASSWORD=changeme -e POSTGRES_DB=ponyquiz -e POSTGRES_USER=ponyquiz -p 5432:5432 postgres:16-alpine
DATABASE_URL=postgresql://ponyquiz:changeme@localhost:5432/ponyquiz node db/bootstrap.js
```

**Step 7: Commit**

```bash
git add db/ lib/db.ts
git commit -m "feat: add database schema and migration infrastructure"
```

---

## Task 3: Authentication (NextAuth)

**Files:**
- Create: `lib/auth.ts`
- Create: `lib/session.ts`
- Create: `lib/types/index.ts`
- Create: `types/next-auth.d.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `components/Providers.tsx`
- Create: `middleware.ts`
- Create: `app/login/page.tsx`
- Create: `app/register/page.tsx`

**Step 1: Install auth dependencies**

```bash
npm install next-auth@4 bcryptjs zod
npm install -D @types/bcryptjs
```

**Step 2: Create lib/types/index.ts**

```typescript
export type UserRole = "admin" | "student";

export type SessionUser = {
  id?: string;
  role?: UserRole;
  email?: string | null;
  name?: string | null;
};

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { error: string };
```

**Step 3: Create types/next-auth.d.ts**

Augment NextAuth Session and JWT types to include `id` and `role`.

**Step 4: Create lib/auth.ts**

CredentialsProvider with email/password. JWT strategy. Callbacks enrich token with `id` and `role`. Sign-in page: `/login`.

**Step 5: Create lib/session.ts**

Helper: `getCurrentUser()` — wraps `getServerSession(authOptions)` and returns typed user. Helper: `requireAdmin()` — throws if not admin.

**Step 6: Create app/api/auth/[...nextauth]/route.ts**

Standard NextAuth route handler.

**Step 7: Create components/Providers.tsx**

`"use client"` — wraps children in `SessionProvider`.

**Step 8: Update app/layout.tsx**

Wrap content in `<Providers>`.

**Step 9: Create middleware.ts**

Protect all routes except `/login`, `/register`, `/api/auth`, `/_next`, `/favicon.ico`. Admin routes (`/admin/*`) restricted to admin role.

**Step 10: Create app/login/page.tsx**

Client component with email/password form. Uses `signIn("credentials")`.

**Step 11: Create app/register/page.tsx**

Client component. Registration form — creates student account. Admin accounts created via seed or admin panel only.

**Step 12: Create lib/actions/auth.ts**

Server action `registerStudent` — Zod validation, bcrypt hash, INSERT into users.

**Step 13: Commit**

```bash
git add lib/auth.ts lib/session.ts lib/types/ types/ app/api/auth/ components/Providers.tsx middleware.ts app/login/ app/register/ lib/actions/auth.ts
git commit -m "feat: add NextAuth authentication with login and registration"
```

---

## Task 4: Core Layout & Navigation

**Files:**
- Create: `components/Sidebar.tsx`
- Create: `components/BottomTabs.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/PageHeader.tsx`
- Create: `components/ui/Modal.tsx`
- Create: `components/ui/Badge.tsx`
- Create: `components/ui/ProgressBar.tsx`
- Create: `components/ui/EmptyState.tsx`
- Create: `components/ThemeProvider.tsx`
- Create: `components/ThemeToggle.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

**Step 1: Create ThemeProvider**

`"use client"` context provider. Stores preference in localStorage as `"ponyquiz-theme"`. Sets `data-theme` attribute on html. Supports light/dark/system.

**Step 2: Create Sidebar**

Navigation links. Shows different items for admin vs student roles. Uses `useSession()` to determine role. Links: Dashboard, Flashcards, Practice, Quiz, Leaderboard, Profile (student). Questions, Import, Images, Students, Badges, Settings (admin).

**Step 3: Create BottomTabs**

Mobile navigation (shown below md breakpoint, sidebar hidden). Same links as sidebar in compact form.

**Step 4: Create UI primitives**

Card, PageHeader, Modal, Badge, ProgressBar, EmptyState — all using CSS variable tokens. Match harmony-homeschool patterns.

**Step 5: Update layout.tsx**

Add ThemeProvider, Sidebar, BottomTabs, main content area with responsive layout.

**Step 6: Commit**

```bash
git add components/ app/layout.tsx app/globals.css
git commit -m "feat: add layout, navigation, theme system, and UI primitives"
```

---

## Task 5: Admin — Topic & Question Management

**Files:**
- Create: `lib/queries/topics.ts`
- Create: `lib/queries/questions.ts`
- Create: `lib/actions/topics.ts`
- Create: `lib/actions/questions.ts`
- Create: `app/admin/questions/page.tsx`
- Create: `app/admin/topics/page.tsx`
- Create: `components/admin/QuestionForm.tsx`
- Create: `components/admin/QuestionList.tsx`
- Create: `components/admin/TopicManager.tsx`

**Step 1: Create lib/queries/topics.ts**

`getTopics()` — returns all topics ordered by sort_order.

**Step 2: Create lib/actions/topics.ts**

`createTopic(formData)`, `updateTopic(formData)`, `deleteTopic(formData)` — Zod validated, parameterized SQL, revalidatePath.

**Step 3: Create lib/queries/questions.ts**

`getQuestions(filters?)` — list with optional topic/type/difficulty filters, joins topic name and image path. `getQuestion(id)` — single question with full details.

**Step 4: Create lib/actions/questions.ts**

`createQuestion(formData)`, `updateQuestion(formData)`, `deleteQuestion(formData)`, `toggleQuestionActive(formData)`.

**Step 5: Create admin topic management page**

Server component page at `/admin/topics`. Lists topics, inline add/edit/delete.

**Step 6: Create admin question management page**

Server component page at `/admin/questions` with `force-dynamic`. Shows filterable list of questions. Client component `QuestionForm` for create/edit in a modal.

**Step 7: Create QuestionList component**

Client component. Table/list view with filters (topic, type, difficulty). Each row shows question text, type, topic, difficulty, active status, edit/delete actions.

**Step 8: Create QuestionForm component**

Client component. Dynamic form that changes fields based on question type. For MC: shows 4 option inputs with correct-answer radio. For T/F: true/false toggle. For flashcard types: front text + back text/image. Image picker (from uploaded images).

**Step 9: Commit**

```bash
git add lib/queries/topics.ts lib/queries/questions.ts lib/actions/topics.ts lib/actions/questions.ts app/admin/ components/admin/
git commit -m "feat: add admin topic and question management"
```

---

## Task 6: Admin — Image Upload & Management

**Files:**
- Create: `lib/server/uploads.ts`
- Create: `lib/queries/images.ts`
- Create: `lib/actions/images.ts`
- Create: `app/api/uploads/[...path]/route.ts`
- Create: `app/admin/images/page.tsx`
- Create: `components/admin/ImageUploader.tsx`
- Create: `components/admin/ImageList.tsx`
- Create: `components/admin/HotspotEditor.tsx`

**Step 1: Create lib/server/uploads.ts**

Match harmony-homeschool pattern. Validate image types (JPG, PNG, WEBP, GIF, SVG). Max size 10MB. Save to `public/uploads/<subdir>/<uuid>.<ext>`. Return `{ path }` or `{ error }`.

**Step 2: Create app/api/uploads/[...path]/route.ts**

Serve uploaded files with MIME type detection.

**Step 3: Create lib/queries/images.ts and lib/actions/images.ts**

CRUD for images table. `uploadImage` action handles file + metadata. `updateHotspots` action saves diagram hotspot data.

**Step 4: Create admin image management page**

Grid view of uploaded images. Upload button. Click image to edit alt text, type, and hotspots.

**Step 5: Create HotspotEditor component**

Client component. For diagram images: click on image to place hotspot markers, enter label for each. Saves as JSON array of `{x, y, label}` (percentages for responsive positioning).

**Step 6: Commit**

```bash
git add lib/server/uploads.ts lib/queries/images.ts lib/actions/images.ts app/api/uploads/ app/admin/images/ components/admin/
git commit -m "feat: add image upload, management, and hotspot editor"
```

---

## Task 7: Admin — AI-Assisted Content Import

**Files:**
- Create: `lib/server/document-parser.ts`
- Create: `lib/actions/import.ts`
- Create: `app/admin/import/page.tsx`
- Create: `components/admin/ImportWizard.tsx`
- Create: `components/admin/DraftQuestionReview.tsx`

**Step 1: Install Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

**Step 2: Create lib/server/document-parser.ts**

- Accept uploaded PDF or Word doc (read file buffer)
- For PDFs: extract text (use `pdf-parse` or similar)
- For Word docs: extract text (use `mammoth` or similar)
- Send extracted text to Claude API with a prompt that asks it to parse into structured question JSON
- Return array of draft questions: `{ text, type, options?, answer?, topic?, difficulty? }`

```bash
npm install pdf-parse mammoth
```

**Step 3: Create lib/actions/import.ts**

`importDocument(formData)` — receives uploaded file, calls document-parser, returns draft questions as JSON. `saveDraftQuestions(formData)` — bulk insert reviewed/edited questions.

**Step 4: Create import wizard page**

`/admin/import` — multi-step flow:
1. Upload file (PDF or Word)
2. Show parsing progress
3. Display draft questions in editable list
4. Admin reviews, edits, assigns topics/difficulty, toggles which to import
5. Confirm → bulk insert into questions table

**Step 5: Create DraftQuestionReview component**

Client component. Shows each parsed question in an editable card. Admin can fix text, change type, add options, assign topic, set difficulty, or skip the question.

**Step 6: Commit**

```bash
git add lib/server/document-parser.ts lib/actions/import.ts app/admin/import/ components/admin/
git commit -m "feat: add AI-assisted document import for questions"
```

---

## Task 8: Flashcard Mode

**Files:**
- Create: `lib/queries/flashcards.ts`
- Create: `lib/actions/flashcards.ts`
- Create: `app/flashcards/page.tsx`
- Create: `components/flashcards/TopicPicker.tsx`
- Create: `components/flashcards/FlashcardViewer.tsx`
- Create: `components/flashcards/FlashcardCard.tsx`

**Step 1: Create lib/queries/flashcards.ts**

`getFlashcards(userId, topicId?)` — returns flashcard-type questions with user's progress (got_it/still_learning/unseen). Orders by spaced repetition: still_learning first (oldest reviewed first), then unseen, then got_it.

**Step 2: Create lib/actions/flashcards.ts**

`updateFlashcardProgress(formData)` — upsert into flashcard_progress. Updates status, last_reviewed, increments review_count.

**Step 3: Create app/flashcards/page.tsx**

Server component with `force-dynamic`. Fetches topics for picker. Renders TopicPicker + FlashcardViewer.

**Step 4: Create TopicPicker component**

Client component. Horizontal scrollable topic chips. "All" option. Shows count of cards per topic and progress percentage.

**Step 5: Create FlashcardViewer component**

Client component. Shows one card at a time. Flip animation (CSS transform rotateY). Swipe/tap to flip. "Got it" / "Still learning" buttons on the back. Progress indicator (card N of M). Fetches cards from API based on selected topic.

**Step 6: Create FlashcardCard component**

Client component. The actual card with flip animation. Front: question text or image. Back: answer text, definition, or labeled diagram. CSS 3D transform for flip effect.

**Step 7: Create API route for flashcard data**

```
app/api/flashcards/route.ts — GET with ?topic= filter
app/api/flashcards/progress/route.ts — POST to update progress
```

**Step 8: Commit**

```bash
git add lib/queries/flashcards.ts lib/actions/flashcards.ts app/flashcards/ components/flashcards/ app/api/flashcards/
git commit -m "feat: add flashcard study mode with spaced repetition"
```

---

## Task 9: Practice Mode

**Files:**
- Create: `lib/queries/quiz.ts`
- Create: `lib/actions/quiz.ts`
- Create: `app/practice/page.tsx`
- Create: `components/quiz/QuizSetup.tsx`
- Create: `components/quiz/QuestionRenderer.tsx`
- Create: `components/quiz/MultipleChoiceQuestion.tsx`
- Create: `components/quiz/TrueFalseQuestion.tsx`
- Create: `components/quiz/ImageQuestion.tsx`
- Create: `components/quiz/DiagramQuestion.tsx`
- Create: `components/quiz/FeedbackCard.tsx`

**Step 1: Create lib/queries/quiz.ts**

`getRandomQuestions(topicIds?, difficulty?, count?)` — returns random quiz-type questions. Uses `ORDER BY RANDOM() LIMIT $1`. Joins image data where needed.

**Step 2: Create lib/actions/quiz.ts**

`startQuizAttempt(formData)` — creates quiz_attempt row (mode: practice or graded). `submitAnswer(formData)` — inserts quiz_answer, returns correct/incorrect + explanation. `completeQuizAttempt(formData)` — calculates and saves final score.

**Step 3: Create QuizSetup component**

Client component. Topic multi-select, difficulty picker, question count slider. "Start Practice" button.

**Step 4: Create QuestionRenderer component**

Client component. Dispatches to the correct question type component based on `question.type`. Handles answer submission and feedback display.

**Step 5: Create question type components**

- `MultipleChoiceQuestion` — 4 options, tap to select, highlights correct/incorrect after submit
- `TrueFalseQuestion` — two large buttons
- `ImageQuestion` — shows image + multiple choice below (for photo_id and image_text types)
- `DiagramQuestion` — shows image with clickable hotspots, kid taps to identify parts

**Step 6: Create FeedbackCard component**

Shows after each answer in practice mode: correct/incorrect indicator, the right answer, explanation text. "Next Question" button.

**Step 7: Create app/practice/page.tsx**

Server component. Renders QuizSetup → on start, transitions to question flow → immediate feedback after each answer.

**Step 8: Create API routes**

```
app/api/quiz/start/route.ts — POST to create attempt and get questions
app/api/quiz/answer/route.ts — POST to submit answer
app/api/quiz/complete/route.ts — POST to finalize attempt
```

**Step 9: Commit**

```bash
git add lib/queries/quiz.ts lib/actions/quiz.ts app/practice/ components/quiz/ app/api/quiz/
git commit -m "feat: add practice quiz mode with immediate feedback"
```

---

## Task 10: Graded Quiz Mode

**Files:**
- Create: `app/quiz/page.tsx`
- Create: `components/quiz/GradedQuiz.tsx`
- Create: `components/quiz/QuizResults.tsx`
- Create: `components/quiz/ScoreSummary.tsx`

**Step 1: Create GradedQuiz component**

Client component. Reuses QuizSetup and question type components from Task 9. Key differences from practice:
- No feedback between questions — just "Next" button
- Progress bar showing question N of M
- All answers collected in state
- Submit all at end

**Step 2: Create QuizResults component**

Client component. Shown after quiz completion:
- Score (e.g., "8/10 — 80%")
- Per-question breakdown: question text, your answer, correct answer, explanation
- Color-coded (green/red) for correct/incorrect
- "Try Again" and "Back to Dashboard" buttons

**Step 3: Create ScoreSummary component**

Visual score display — large number, circular progress ring, encouraging message based on score tier.

**Step 4: Create app/quiz/page.tsx**

Server component. Renders setup → quiz flow → results. Saves completed attempt to DB.

**Step 5: Commit**

```bash
git add app/quiz/ components/quiz/GradedQuiz.tsx components/quiz/QuizResults.tsx components/quiz/ScoreSummary.tsx
git commit -m "feat: add graded quiz mode with results summary"
```

---

## Task 11: Student Dashboard

**Files:**
- Create: `lib/queries/dashboard.ts`
- Create: `app/dashboard/page.tsx`
- Create: `components/dashboard/StreakTracker.tsx`
- Create: `components/dashboard/TopicProgress.tsx`
- Create: `components/dashboard/RecentActivity.tsx`
- Create: `components/dashboard/QuickActions.tsx`

**Step 1: Create lib/queries/dashboard.ts**

`getDashboardData(userId)` — returns:
- Current streak count and last active date
- Per-topic progress (flashcards studied, quiz scores)
- Recent quiz attempts (last 5)
- Badge count
- Overall mastery percentage

**Step 2: Create StreakTracker component**

Visual streak display — flame/star icon, current count, week grid showing active days.

**Step 3: Create TopicProgress component**

Per-topic progress bars. Shows percentage of questions studied/quizzed per topic. Color-coded by mastery level.

**Step 4: Create RecentActivity component**

List of recent quiz attempts: date, mode, score, topics.

**Step 5: Create QuickActions component**

Large, tappable cards: "Study Flashcards", "Practice Quiz", "Take a Test". Kid-friendly, colorful.

**Step 6: Create app/dashboard/page.tsx**

Server component with `force-dynamic`. Fetches dashboard data, renders all components. Shows equipped avatar and title.

**Step 7: Update streak on activity**

Add middleware or action hook to update `users.streak_count` and `users.last_active_date` on any quiz/flashcard activity.

**Step 8: Commit**

```bash
git add lib/queries/dashboard.ts app/dashboard/ components/dashboard/
git commit -m "feat: add student dashboard with streaks and progress"
```

---

## Task 12: Gamification — Badges & Unlockables

**Files:**
- Create: `lib/queries/badges.ts`
- Create: `lib/queries/unlockables.ts`
- Create: `lib/actions/badges.ts`
- Create: `lib/server/badge-engine.ts`
- Create: `app/profile/page.tsx`
- Create: `app/leaderboard/page.tsx`
- Create: `app/admin/badges/page.tsx`
- Create: `components/profile/BadgeGrid.tsx`
- Create: `components/profile/UnlockableGrid.tsx`
- Create: `components/profile/AvatarSelector.tsx`
- Create: `components/leaderboard/LeaderboardTable.tsx`

**Step 1: Create lib/server/badge-engine.ts**

`checkAndAwardBadges(userId)` — called after quiz completion or flashcard session. Evaluates all badge criteria against user's stats. Awards any newly earned badges. Returns list of newly earned badges (for celebration UI).

Badge criteria types:
- `{ type: "quiz_score", threshold: 100 }` — perfect score
- `{ type: "quiz_count", threshold: 50 }` — volume
- `{ type: "streak", threshold: 7 }` — streak days
- `{ type: "topic_mastery", topicId: "...", threshold: 90 }` — per-topic

**Step 2: Create queries and actions for badges/unlockables**

Standard CRUD. `getLeaderboard()` — ranked students by total score, badges, streaks.

**Step 3: Create profile page**

Shows user's avatar, title, badges (earned and locked), unlockables, quiz history.

**Step 4: Create AvatarSelector component**

Grid of unlocked avatars. Tap to equip. Shows locked ones as grayed out with unlock criteria.

**Step 5: Create leaderboard page**

Server component with `force-dynamic`. Table: rank, avatar, name, title, score, badges count, streak.

**Step 6: Create admin badge management page**

CRUD for badges and unlockables. Set criteria, upload icons, preview.

**Step 7: Seed default badges and unlockables**

Create `db/seed.ts` with starter badges ("First Quiz", "Perfect Score", "7-Day Streak", etc.) and unlockables (default avatars, starter titles).

**Step 8: Commit**

```bash
git add lib/queries/badges.ts lib/queries/unlockables.ts lib/actions/badges.ts lib/server/badge-engine.ts app/profile/ app/leaderboard/ app/admin/badges/ components/profile/ components/leaderboard/ db/seed.ts
git commit -m "feat: add badges, unlockables, profile, and leaderboard"
```

---

## Task 13: Admin Dashboard & Student Management

**Files:**
- Create: `lib/queries/admin.ts`
- Create: `lib/actions/admin.ts`
- Create: `app/admin/page.tsx`
- Create: `app/admin/students/page.tsx`
- Create: `app/admin/students/[id]/page.tsx`
- Create: `components/admin/StudentList.tsx`
- Create: `components/admin/StudentDetail.tsx`

**Step 1: Create lib/queries/admin.ts**

`getAdminDashboard()` — student count, total quizzes taken, recent activity. `getStudents()` — all students with summary stats. `getStudentDetail(id)` — full profile, quiz history, flashcard progress, badges.

**Step 2: Create lib/actions/admin.ts**

`createStudentAccount(formData)` — admin creates student account. `resetStudentPassword(formData)`. `deleteStudentAccount(formData)`.

**Step 3: Create admin dashboard**

Overview: total students, quizzes taken today, active streaks, most-studied topics.

**Step 4: Create student management pages**

List view with search. Detail view per student showing their full progress, quiz history, badges.

**Step 5: Commit**

```bash
git add lib/queries/admin.ts lib/actions/admin.ts app/admin/ components/admin/StudentList.tsx components/admin/StudentDetail.tsx
git commit -m "feat: add admin dashboard and student management"
```

---

## Task 14: Docker Compose & Deployment

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Modify: `package.json` (ensure standalone output works)

**Step 1: Create Dockerfile**

Multi-stage build matching harmony-homeschool pattern:
1. `deps` — `npm ci`
2. `build` — `next build`
3. `runtime` — Node 20-slim, non-root user, copy standalone + static + db + public
4. CMD: `node db/bootstrap.js && node db/migrate.js && node server.js`

**Step 2: Create docker-compose.yml**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ponyquiz
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
      POSTGRES_DB: ponyquiz
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ponyquiz"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build: .
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      DATABASE_URL: postgresql://ponyquiz:${POSTGRES_PASSWORD:-changeme}@db:5432/ponyquiz
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
    volumes:
      - uploads:/app/public/uploads

volumes:
  pgdata:
  uploads:
```

**Step 3: Test Docker build**

```bash
docker compose build app
docker compose up -d
```

**Step 4: Commit**

```bash
git add Dockerfile docker-compose.yml
git commit -m "feat: add Docker Compose deployment configuration"
```

---

## Task 15: CLAUDE.md & Documentation

**Files:**
- Create: `CLAUDE.md`
- Create: `README.md`
- Create: `BD.md`

**Step 1: Create CLAUDE.md**

Document all conventions, gotchas, file organization, and patterns for Claude Code agents. Include:
- Project structure overview
- Database patterns (raw SQL, migrations, force-dynamic)
- Auth patterns (session helpers, role checks)
- Styling rules (CSS variables only, no hardcoded colors)
- Server/client boundary rules (never import pg from client)
- Pre-push validation (`docker compose build app`)

**Step 2: Create BD.md**

Beads workflow documentation for agent-based development.

**Step 3: Create README.md**

Setup instructions, environment variables, Docker deployment, development workflow.

**Step 4: Commit**

```bash
git add CLAUDE.md BD.md README.md
git commit -m "docs: add CLAUDE.md, BD.md, and README"
```

---

## Task Order & Dependencies

```
Task 1  (Scaffolding)
  └→ Task 2  (Database)
       └→ Task 3  (Auth)
            └→ Task 4  (Layout & Nav)
                 ├→ Task 5  (Question Management)
                 │    └→ Task 6  (Image Management)
                 │         └→ Task 7  (AI Import)
                 ├→ Task 8  (Flashcards)
                 ├→ Task 9  (Practice Mode)
                 │    └→ Task 10 (Graded Quiz)
                 ├→ Task 11 (Dashboard)
                 ├→ Task 12 (Gamification)
                 └→ Task 13 (Admin Dashboard)
  Task 14 (Docker) — after Task 4+
  Task 15 (Docs) — anytime after Task 1
```

Tasks 5-13 can be parallelized after Task 4 is complete (they share the layout but are otherwise independent). Tasks 9→10 are sequential (graded quiz reuses practice components). Tasks 5→6→7 are sequential (import depends on images which depends on questions).
