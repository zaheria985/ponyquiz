# PonyQuiz — Application Specification

## 1. Overview

PonyQuiz is an educational quiz web application for young riders (under 12, approximately 3 years of riding experience). It helps kids deepen their equestrian knowledge through three learning modes: flashcards, practice quizzes, and graded quizzes. The app includes gamification features to keep kids motivated.

**Target audience:** Kids under 12 with ~3 years riding experience — not beginners, they know the basics and the content should build on that foundation.

**User roles:**
- **Admin** (single user) — manages all content, questions, images, and student accounts
- **Student** — studies flashcards, takes quizzes, earns rewards

## 2. Question Types & Content Model

Content is organized into two tracks based on how it's used:

### Flashcard Content (self-assessed)

| Type | Front | Back |
|------|-------|------|
| Open-ended Q&A | Question text (e.g., "What are the signs of colic?") | Full detailed answer |
| Term / Definition | Term (e.g., "Withers") | Definition + optional image |
| Image Study | Diagram or photo | All labeled parts / identification |

### Quiz Content (auto-graded)

| Type | Description |
|------|-------------|
| Multiple Choice | Question text + 4 answer options, one correct |
| True / False | Statement that is either true or false |
| Labeled Diagram | Image where kid identifies specific parts (tap-the-location or match-label-to-part) |
| Photo Identification | Photo shown, kid selects what it is from multiple choice options |
| Image + Text | Reference image accompanies a standard text question |

### Question Metadata

Every question includes:
- **Topic / category** (e.g., Breeds, Tack & Equipment, Anatomy, Riding Skills)
- **Difficulty level** (beginner, intermediate, advanced)
- **Explanation text** — shown after answering to reinforce learning

## 3. Three Modes of Interaction

### 3.1 Flashcard Mode (Study)
- Browse by topic or "all"
- Tap/click to flip card (question on front, answer on back)
- Self-assess each card: "Got it" or "Still learning"
- **Spaced repetition** — cards marked "still learning" appear more frequently
- Progress tracked per student

### 3.2 Practice Mode (Learn by Doing)
- Unscored quiz-style experience
- Questions pulled randomly from selected topics
- **Immediate feedback** after each answer (correct/incorrect + explanation)
- No time limit, no final score — low pressure
- Can quit and resume anytime

### 3.3 Graded Quiz Mode (Test)
- Randomly generated from the question pool
- Configurable: number of questions, topics, difficulty
- **No feedback until the end**
- Final score + summary showing correct/incorrect with explanations
- Results saved to student's history
- Feeds into gamification (badges, leaderboard)

## 4. Gamification

### Badges
Awarded for milestones:
- **Quiz score achievements** — "Perfect Score," "90% Club"
- **Streak milestones** — "7-Day Streak," "30-Day Streak"
- **Volume milestones** — "First Quiz," "50 Quizzes Taken," "100 Flashcards Studied"
- **Topic mastery** — "Anatomy Expert" (scored 90%+ on all anatomy questions)

### Streaks
- Daily login/activity streak counter
- Visual streak tracker on the student dashboard

### Leaderboard
- Ranked by quiz scores, badges earned, or overall activity
- Visible to all students to encourage friendly competition

### Progress Tracking
- Per-topic progress bars (how much of each category studied/quizzed)
- Overall mastery percentage
- Quiz history with scores over time

### Unlockable Rewards
Tied to the badge/milestone system — earn a badge, unlock a reward:
- **Avatars / profile customization** — unlockable pony avatars, backgrounds, profile frames
- **Quiz themes** — visual themes for the quiz interface (e.g., "Barn at Sunset," "Cross-Country Course")
- **Title / rank system** — earned titles displayed on profile and leaderboard: "Stable Hand" → "Groom" → "Working Pupil" → "Head Girl/Boy"

## 5. Admin Features

### Content Management
- **AI-assisted import** — upload a PDF or Word doc, Claude API parses it into draft questions, admin reviews and edits before publishing
- **Manual entry** — create questions one-by-one through forms (question text, answers, images, tags)
- Both options available; admin chooses whichever fits the content
- Tag questions with topic, difficulty, and question type
- Preview questions as students would see them

### Image Management
- Upload images and associate them with questions
- Set image type (diagram, photo, reference)
- Configure hotspots/labels for labeled diagram questions (coordinates + correct label)

### Student Management
- Create student accounts or approve self-registration
- View individual student progress, quiz history, and flashcard stats
- View leaderboard and badge status across all students

### Quiz Configuration
- Set default number of questions per quiz
- Select which topics / difficulty levels are available
- Enable/disable specific question sets

## 6. Tech Stack & Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), React, Tailwind CSS |
| Backend | Next.js API routes / Server Actions |
| Database | PostgreSQL + node-postgres (`pg`) with raw SQL migrations |
| Auth | NextAuth.js (admin + student accounts) |
| AI Parsing | Claude API (document → structured questions) |
| File Storage | Local volume mount (Docker volume) |
| Deployment | Docker Compose (self-hosted) |
| Source Control | GitHub repository |

**Responsive design** — works on desktop, tablet, and phone (kids may use any device).

## 7. Data Model

### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Display name |
| email | String | Unique, used for login |
| password | String | Hashed |
| role | Enum | admin, student |
| avatar | String | Reference to equipped avatar asset |
| title | String | Current equipped title/rank |
| streakCount | Int | Current daily streak |
| lastActiveDate | Date | For streak calculation |

### Question
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| text | String | Question or flashcard front text |
| type | Enum | multiple_choice, true_false, flashcard_qa, flashcard_term, flashcard_image |
| topic | String | Category (Breeds, Anatomy, etc.) |
| difficulty | Enum | beginner, intermediate, advanced |
| explanation | String | Shown after answering |
| options | JSON | For MC: array of {text, isCorrect} |
| answer | String | For flashcard types: the back-of-card content |
| imageId | UUID | Optional, FK to Image |

### Image
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| filePath | String | Path on disk |
| altText | String | Accessibility text |
| type | Enum | diagram, photo, reference |
| hotspots | JSON | For diagrams: array of {x, y, label} |

### QuizAttempt
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK to User |
| mode | Enum | practice, graded |
| score | Int | Number correct |
| totalQuestions | Int | Total in this attempt |
| topicFilter | String | Topic(s) used to generate |
| difficulty | String | Difficulty filter used |
| createdAt | DateTime | Timestamp |

### QuizAnswer
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| quizAttemptId | UUID | FK to QuizAttempt |
| questionId | UUID | FK to Question |
| selectedAnswer | String | What the student chose |
| correct | Boolean | Was it right |

### FlashcardProgress
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK to User |
| questionId | UUID | FK to Question |
| status | Enum | got_it, still_learning |
| lastReviewed | DateTime | For spaced repetition |
| reviewCount | Int | Times reviewed |

### Badge
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Display name |
| description | String | What it's for |
| icon | String | Asset path |
| criteria | JSON | Unlock rules (type + threshold) |

### StudentBadge
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK to User |
| badgeId | UUID | FK to Badge |
| earnedAt | DateTime | When earned |

### Unlockable
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Display name |
| type | Enum | avatar, theme, title |
| criteria | JSON | Unlock rules |
| assetPath | String | Path to asset file |

### StudentUnlockable
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK to User |
| unlockableId | UUID | FK to Unlockable |
| earnedAt | DateTime | When earned |
| equipped | Boolean | Currently in use |

## 8. Pages / Screens

### Public
- **Login / Register** — email + password, role selection (student by default, admin by invite/config)

### Student Views
- **Dashboard** — streaks, progress bars, recent activity, equipped avatar/title
- **Flashcard Viewer** — topic picker → swipeable/tappable cards with flip animation
- **Practice Mode** — topic/difficulty picker → question flow with instant feedback
- **Graded Quiz** — topic/difficulty/count picker → quiz flow → results summary
- **Leaderboard** — ranked students with avatars, titles, badges
- **Profile** — avatar, title, badges, unlockables, quiz history

### Admin Views
- **Admin Dashboard** — student count, recent activity overview
- **Question Manager** — list, search, filter, create, edit, delete questions
- **Content Import** — upload PDF/Word → AI parse → review/edit draft questions
- **Image Manager** — upload, tag, configure hotspots for diagrams
- **Student List** — view progress per student
- **Badge / Unlockable Manager** — configure rewards and criteria
