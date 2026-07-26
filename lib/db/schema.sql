-- SoloDM database schema (SQLite)
-- Each row in `campaigns` is one oneshot session (single 2-4 hour sitting,
-- start to finish). Everything else keys off campaign_id, so a "new oneshot"
-- is just a new campaign row -- the schema already supported multi-campaign,
-- it's just that v1 UI only ever surfaces the most recent one as "current".

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'New Oneshot',
  status TEXT NOT NULL DEFAULT 'character_creation', -- character_creation | active | completed
  current_turn_number INTEGER NOT NULL DEFAULT 0,
  setting_notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  race TEXT NOT NULL DEFAULT '',
  class TEXT NOT NULL DEFAULT '',
  background TEXT NOT NULL DEFAULT '',
  alignment TEXT NOT NULL DEFAULT '',
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  proficiency_bonus INTEGER NOT NULL DEFAULT 2,

  -- Ability scores
  str INTEGER NOT NULL DEFAULT 10,
  dex INTEGER NOT NULL DEFAULT 10,
  con INTEGER NOT NULL DEFAULT 10,
  int INTEGER NOT NULL DEFAULT 10,
  wis INTEGER NOT NULL DEFAULT 10,
  cha INTEGER NOT NULL DEFAULT 10,

  -- Combat stats
  ac INTEGER NOT NULL DEFAULT 10,
  hp_max INTEGER NOT NULL DEFAULT 10,
  hp_current INTEGER NOT NULL DEFAULT 10,
  hp_temp INTEGER NOT NULL DEFAULT 0,
  hit_dice_type TEXT NOT NULL DEFAULT 'd8', -- e.g. d6/d8/d10/d12
  hit_dice_total INTEGER NOT NULL DEFAULT 1,
  hit_dice_current INTEGER NOT NULL DEFAULT 1,
  speed INTEGER NOT NULL DEFAULT 30,

  -- Death saves
  death_save_successes INTEGER NOT NULL DEFAULT 0,
  death_save_failures INTEGER NOT NULL DEFAULT 0,
  is_dead INTEGER NOT NULL DEFAULT 0,

  -- JSON-encoded structured fields
  saving_throw_proficiencies TEXT NOT NULL DEFAULT '[]', -- e.g. ["str","con"]
  skill_proficiencies TEXT NOT NULL DEFAULT '[]',         -- e.g. ["stealth","perception"]
  conditions TEXT NOT NULL DEFAULT '[]',                  -- e.g. ["poisoned","prone"]
  spell_slots TEXT NOT NULL DEFAULT '{}',                 -- e.g. {"1":{"max":2,"current":2}}
  known_spells TEXT NOT NULL DEFAULT '[]',
  features TEXT NOT NULL DEFAULT '[]',                    -- class/race features & traits

  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'gear', -- weapon | armor | gear | consumable | treasure | other
  quantity INTEGER NOT NULL DEFAULT 1,
  equipped INTEGER NOT NULL DEFAULT 0,
  weight REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active', -- active | completed | failed | abandoned
  category TEXT NOT NULL DEFAULT 'main', -- main | side | personal
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS world_facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'lore', -- npc | location | faction | lore | item | event
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '', -- comma-separated
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- FTS5 virtual table for keyword/tag search over world facts.
CREATE VIRTUAL TABLE IF NOT EXISTS world_facts_fts USING fts5(
  title, content, tags, category,
  content='world_facts',
  content_rowid='id'
);

-- Keep the FTS index in sync with world_facts.
CREATE TRIGGER IF NOT EXISTS world_facts_ai AFTER INSERT ON world_facts BEGIN
  INSERT INTO world_facts_fts(rowid, title, content, tags, category)
  VALUES (new.id, new.title, new.content, new.tags, new.category);
END;

CREATE TRIGGER IF NOT EXISTS world_facts_ad AFTER DELETE ON world_facts BEGIN
  INSERT INTO world_facts_fts(world_facts_fts, rowid, title, content, tags, category)
  VALUES ('delete', old.id, old.title, old.content, old.tags, old.category);
END;

CREATE TRIGGER IF NOT EXISTS world_facts_au AFTER UPDATE ON world_facts BEGIN
  INSERT INTO world_facts_fts(world_facts_fts, rowid, title, content, tags, category)
  VALUES ('delete', old.id, old.title, old.content, old.tags, old.category);
  INSERT INTO world_facts_fts(rowid, title, content, tags, category)
  VALUES (new.id, new.title, new.content, new.tags, new.category);
END;

CREATE TABLE IF NOT EXISTS narrative_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  role TEXT NOT NULL, -- player | dm
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS combat_encounters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active', -- active | ended
  round_number INTEGER NOT NULL DEFAULT 1,
  current_turn_index INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS combat_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  encounter_id INTEGER NOT NULL REFERENCES combat_encounters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_pc INTEGER NOT NULL DEFAULT 0,
  is_companion INTEGER NOT NULL DEFAULT 0,
  initiative INTEGER NOT NULL DEFAULT 0,
  turn_order INTEGER NOT NULL DEFAULT 0,
  hp_current INTEGER NOT NULL DEFAULT 1,
  hp_max INTEGER NOT NULL DEFAULT 1,
  ac INTEGER NOT NULL DEFAULT 10,
  conditions TEXT NOT NULL DEFAULT '[]',
  position TEXT NOT NULL DEFAULT '', -- freeform tactical position/range note
  notes TEXT NOT NULL DEFAULT '',
  is_defeated INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS roll_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL DEFAULT 0,
  expression TEXT NOT NULL, -- e.g. "1d20+3"
  breakdown TEXT NOT NULL,  -- e.g. "14 + 3 = 17"
  total INTEGER NOT NULL,
  purpose TEXT NOT NULL DEFAULT '', -- e.g. "Stealth check"
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_narrative_log_campaign ON narrative_log(campaign_id, turn_number);
CREATE INDEX IF NOT EXISTS idx_inventory_character ON inventory_items(character_id);
CREATE INDEX IF NOT EXISTS idx_quests_campaign ON quests(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_combat_participants_encounter ON combat_participants(encounter_id);
CREATE INDEX IF NOT EXISTS idx_roll_log_campaign ON roll_log(campaign_id);

-- Migration: the rolling-summary system was removed when the app moved from
-- an open-ended sandbox campaign to single-session oneshots (a session's
-- full narrative comfortably fits in context, so no compression step is
-- needed). Drop the now-unused table from any existing dev database.
DROP TABLE IF EXISTS campaign_summary;
