const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const isCheck = process.argv.includes("--check");

  try {
    // Ensure schema_migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Get already-applied migrations
    const applied = await pool.query("SELECT filename FROM schema_migrations ORDER BY filename");
    const appliedSet = new Set(applied.rows.map(r => r.filename));

    // Get migration files
    const migrationsDir = path.join(__dirname, "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("No migrations directory found");
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    const pending = files.filter(f => !appliedSet.has(f));

    if (pending.length === 0) {
      console.log("No pending migrations");
      return;
    }

    if (isCheck) {
      console.log(`${pending.length} pending migration(s):`);
      pending.forEach(f => console.log(`  - ${f}`));
      process.exit(1);
    }

    // Apply pending migrations
    for (const file of pending) {
      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [file]
        );
        await pool.query("COMMIT");
        console.log(`  Applied: ${file}`);
      } catch (err) {
        await pool.query("ROLLBACK");
        console.error(`  Failed: ${file}`, err.message);
        process.exit(1);
      }
    }

    console.log(`Applied ${pending.length} migration(s)`);

  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
