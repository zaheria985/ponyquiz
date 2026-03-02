const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function bootstrap() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Check if schema already exists
    const result = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
    );

    if (result.rows[0].exists) {
      console.log("Schema already exists, skipping bootstrap");
      return;
    }

    // Apply schema
    console.log("Applying initial schema...");
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await pool.query(schema);
    console.log("Schema applied successfully");

    // Create schema_migrations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Migration tracking table created");

  } finally {
    await pool.end();
  }
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
