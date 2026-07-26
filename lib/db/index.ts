import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { DB_PATH } from "../config";

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  const fullPath = path.isAbsolute(DB_PATH) ? DB_PATH : path.join(process.cwd(), DB_PATH);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new DatabaseSync(fullPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  runMigrations(db);

  return db;
}

function runMigrations(database: DatabaseSync) {
  const schemaPath = path.join(process.cwd(), "lib", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  database.exec(schema);

  // Bootstrap: make sure at least one oneshot (campaign row) exists so the
  // app has something to show on first run.
  const row = database.prepare("SELECT id FROM campaigns LIMIT 1").get() as { id: number } | undefined;
  if (!row) {
    database.prepare("INSERT INTO campaigns (name, status) VALUES (?, ?)").run(
      "New Oneshot",
      "character_creation"
    );
  }
}

/**
 * The "current" oneshot is simply the most recently created campaign row.
 * Starting a new oneshot (see createCampaign in queries.ts) inserts a fresh
 * row with a higher id, which automatically becomes current -- no separate
 * "active campaign" pointer needed.
 */
export function getPrimaryCampaignId(): number {
  const database = getDb();
  const row = database.prepare("SELECT id FROM campaigns ORDER BY id DESC LIMIT 1").get() as {
    id: number;
  };
  return row.id;
}
