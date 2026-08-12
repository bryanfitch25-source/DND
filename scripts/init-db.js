// Standalone DB init script (npm run db:init). Applies schema.sql against
// DATABASE_URL (a Supabase Postgres connection string) if not already
// present, and seeds an initial campaign row. Safe to run multiple times
// (CREATE TABLE/INDEX IF NOT EXISTS throughout schema.sql).
const fs = require("fs");
const path = require("path");
const postgres = require("postgres");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add your Supabase connection string to .env.local.");
  process.exit(1);
}

function splitStatements(sql) {
  const withoutComments = sql
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");
  return withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  const sql = postgres(connectionString, { ssl: "require" });

  const schema = fs.readFileSync(path.join(process.cwd(), "lib", "db", "schema.sql"), "utf-8");

  for (const statement of splitStatements(schema)) {
    await sql.unsafe(statement);
  }

  const rows = await sql`SELECT id FROM campaigns ORDER BY id ASC LIMIT 1`;
  if (rows.length === 0) {
    await sql`INSERT INTO campaigns (name, status) VALUES ('My Campaign', 'character_creation')`;
    console.log("Created initial campaign row.");
  }

  console.log("Database schema applied.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
