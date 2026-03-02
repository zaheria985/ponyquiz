import { Pool } from "pg";

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("Seeding badges...");

    // Default badges
    const badges = [
      {
        name: "First Quiz",
        description: "Completed your very first quiz!",
        icon: "\ud83c\udf1f",
        criteria: { type: "quiz_count", threshold: 1 },
      },
      {
        name: "Quiz Master",
        description: "Completed 10 quizzes. You are on fire!",
        icon: "\ud83d\udd25",
        criteria: { type: "quiz_count", threshold: 10 },
      },
      {
        name: "Perfect Score",
        description: "Achieved a perfect score on a graded quiz!",
        icon: "\ud83d\udcaf",
        criteria: { type: "quiz_score", threshold: 100 },
      },
      {
        name: "Week Warrior",
        description: "Maintained a 7-day streak!",
        icon: "\u26e1\ufe0f",
        criteria: { type: "streak", threshold: 7 },
      },
      {
        name: "Month Champion",
        description: "Maintained a 30-day streak! Incredible dedication!",
        icon: "\ud83d\udc51",
        criteria: { type: "streak", threshold: 30 },
      },
      {
        name: "Flash Scholar",
        description: "Reviewed 50 flashcards. Knowledge is power!",
        icon: "\ud83d\udcda",
        criteria: { type: "flashcard_count", threshold: 50 },
      },
    ];

    for (const badge of badges) {
      await pool.query(
        `INSERT INTO badges (name, description, icon, criteria)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [badge.name, badge.description, badge.icon, JSON.stringify(badge.criteria)]
      );
    }
    console.log(`Seeded ${badges.length} badges.`);

    // Default unlockables
    console.log("Seeding unlockables...");

    const unlockables = [
      {
        name: "Pony Rider",
        type: "avatar",
        criteria: { type: "quiz_count", threshold: 0 },
        asset_path: null,
      },
      {
        name: "Beginner Rider",
        type: "title",
        criteria: { type: "quiz_count", threshold: 0 },
        asset_path: null,
      },
      {
        name: "Quiz Champion",
        type: "title",
        criteria: { type: "quiz_count", threshold: 25 },
        asset_path: null,
      },
      {
        name: "Streak Master",
        type: "title",
        criteria: { type: "streak", threshold: 14 },
        asset_path: null,
      },
    ];

    for (const item of unlockables) {
      await pool.query(
        `INSERT INTO unlockables (name, type, criteria, asset_path)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [item.name, item.type, JSON.stringify(item.criteria), item.asset_path]
      );
    }
    console.log(`Seeded ${unlockables.length} unlockables.`);

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
