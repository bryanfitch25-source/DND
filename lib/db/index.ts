import postgres from "postgres";
import fs from "fs";
import path from "path";

let client: postgres.Sql | null = null;
let migrated: Promise<void> | null = null;

/** Splits schema.sql into individual statements, safe against `--` comments
 * that themselves contain a semicolon (a naive split(";") breaks on those --
 * strips comment text before splitting instead). */
function splitStatements(sql: string): string[] {
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

/** Lazily create the Postgres client (Supabase). One connection pool per
 * warm serverless instance / dev process. */
export function getSql(): postgres.Sql {
  if (client) return client;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add your Supabase connection string to .env.local.");
  }

  client = postgres(connectionString, {
    ssl: "require",
    max: 5,
    idle_timeout: 20,
  });

  return client;
}

/** Run schema.sql (idempotent: CREATE TABLE/INDEX IF NOT EXISTS) and seed a
 * first campaign row if none exist yet. Cached per warm instance so it only
 * actually hits the database once, not on every request. */
export function ensureMigrated(): Promise<void> {
  if (migrated) return migrated;

  migrated = (async () => {
    const sql = getSql();
    const schemaPath = path.join(process.cwd(), "lib", "db", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    for (const statement of splitStatements(schema)) {
      await sql.unsafe(statement);
    }

    const rows = await sql`SELECT id FROM campaigns LIMIT 1`;
    if (rows.length === 0) {
      await sql`INSERT INTO campaigns (name, status) VALUES ('New Campaign', 'character_creation')`;
    }
  })();

  return migrated;
}

/**
 * The "current" campaign is simply the most recently created campaign row.
 * Starting a new campaign (see createCampaign in queries.ts) inserts a fresh
 * row with a higher id, which automatically becomes current -- no separate
 * "active campaign" pointer needed.
 */
export async function getPrimaryCampaignId(): Promise<number> {
  await ensureMigrated();
  const sql = getSql();
  const rows = await sql<{ id: number }[]>`SELECT id FROM campaigns ORDER BY id DESC LIMIT 1`;
  return rows[0].id;
}
