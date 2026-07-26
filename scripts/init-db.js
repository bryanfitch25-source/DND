// Standalone DB init script (npm run db:init). Creates data/solodm.db and
// applies schema.sql if not already present. Safe to run multiple times.
const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

const dbPath = process.env.SOLODM_DB_PATH || path.join(process.cwd(), "data", "solodm.db");
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

const schema = fs.readFileSync(path.join(process.cwd(), "lib", "db", "schema.sql"), "utf-8");
db.exec(schema);

const row = db.prepare("SELECT id FROM campaigns ORDER BY id ASC LIMIT 1").get();
if (!row) {
  db.prepare("INSERT INTO campaigns (name, status) VALUES (?, ?)").run(
    "My Campaign",
    "character_creation"
  );
  console.log("Created initial campaign row.");
}

console.log(`Database initialized at ${dbPath}`);
db.close();
