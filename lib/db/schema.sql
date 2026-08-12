-- SoloDM database schema (Postgres / Supabase)
-- Each row in `campaigns` is one ongoing, open-ended solo campaign (not a
-- bounded oneshot) -- everything else keys off campaign_id. A player keeps
-- playing the same campaign indefinitely across sessions; starting a new
-- campaign just inserts a fresh row, and the app always shows the most
-- recently created row as "current" (see getPrimaryCampaignId).
--
-- Booleans are stored as INTEGER 0/1 (not native BOOLEAN) and timestamps as
-- TEXT, matching the original SQLite-era shape 1:1 -- this keeps every
-- TypeScript type in types/index.ts, and all frontend truthiness checks,
-- unchanged across the SQLite -> Postgres migration.

CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'New Campaign',
  status TEXT NOT NULL DEFAULT 'character_creation', -- character_creation | active
  current_turn_number INTEGER NOT NULL DEFAULT 0,
  setting_notes TEXT DEFAULT '',
  model TEXT DEFAULT NULL, -- per-campaign override of CLAUDE_MODEL (lib/config.ts); NULL = use default
  created_at TEXT NOT NULL DEFAULT (now()::text),
  updated_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS characters (
  id SERIAL PRIMARY KEY,
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

  -- Death saves. This is a soft-fail game by default (see design note in
  -- lib/dm/systemPrompt.ts) -- failing death saves leads to a narrated
  -- setback (captured, injured, robbed) rather than permanent death.
  death_save_successes INTEGER NOT NULL DEFAULT 0,
  death_save_failures INTEGER NOT NULL DEFAULT 0,
  is_dead INTEGER NOT NULL DEFAULT 0,

  -- JSON-encoded structured fields (stored as text, same convention as SQLite)
  saving_throw_proficiencies TEXT NOT NULL DEFAULT '[]', -- e.g. ["str","con"]
  skill_proficiencies TEXT NOT NULL DEFAULT '[]',         -- e.g. ["stealth","perception"]
  conditions TEXT NOT NULL DEFAULT '[]',                  -- e.g. ["poisoned","prone"]
  spell_slots TEXT NOT NULL DEFAULT '{}',                 -- e.g. {"1":{"max":2,"current":2}}
  known_spells TEXT NOT NULL DEFAULT '[]',
  features TEXT NOT NULL DEFAULT '[]',                    -- class/race features & traits

  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (now()::text),
  updated_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'gear', -- weapon | armor | gear | consumable | treasure | other
  quantity INTEGER NOT NULL DEFAULT 1,
  equipped INTEGER NOT NULL DEFAULT 0,
  weight REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS quests (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active', -- active | completed | failed | abandoned
  category TEXT NOT NULL DEFAULT 'main', -- main | side | personal
  created_at TEXT NOT NULL DEFAULT (now()::text),
  updated_at TEXT NOT NULL DEFAULT (now()::text)
);

-- NPCs, locations, factions, lore, items, and events the DM has established.
-- search_world_facts (lib/db/queries.ts) does a plain ILIKE search over
-- title/content/tags -- no FTS5 equivalent needed at this scale.
CREATE TABLE IF NOT EXISTS world_facts (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'lore', -- npc | location | faction | lore | item | event
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '', -- comma-separated
  created_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS narrative_log (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  role TEXT NOT NULL, -- player | dm
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now()::text)
);

-- An open-ended campaign's narrative log can grow indefinitely, unlike a
-- bounded oneshot, so older turns get periodically compressed into a
-- rolling summary instead of being sent to the model verbatim forever. One
-- row per campaign; through_row_id is the highest narrative_log.id already
-- folded into `summary`. See lib/dm/summarize.ts.
CREATE TABLE IF NOT EXISTS campaign_summary (
  campaign_id INTEGER PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  through_row_id INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS combat_encounters (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active', -- active | ended
  round_number INTEGER NOT NULL DEFAULT 1,
  current_turn_index INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  grid_width INTEGER NOT NULL DEFAULT 10,  -- battle map size, in 5-ft squares
  grid_height INTEGER NOT NULL DEFAULT 8,
  terrain TEXT NOT NULL DEFAULT '[]', -- JSON array of {x,y,type}, type: wall | cover | difficult
  created_at TEXT NOT NULL DEFAULT (now()::text),
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS combat_participants (
  id SERIAL PRIMARY KEY,
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
  x INTEGER NOT NULL DEFAULT 0, -- grid column (0-indexed, in 5-ft squares)
  y INTEGER NOT NULL DEFAULT 0, -- grid row (0-indexed, in 5-ft squares)
  notes TEXT NOT NULL DEFAULT '',
  is_defeated INTEGER NOT NULL DEFAULT 0
);

-- Persistent NPC allies/companions that exist outside of combat (combat's
-- own is_companion flag on combat_participants only lives for the duration
-- of one encounter). The DM can recruit/update/dismiss these via the
-- manage_companion tool; the roster panel shows whichever are active.
CREATE TABLE IF NOT EXISTS companions (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  hp_current INTEGER NOT NULL DEFAULT 1,
  hp_max INTEGER NOT NULL DEFAULT 1,
  ac INTEGER NOT NULL DEFAULT 10,
  notes TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1, -- 0 once dismissed/departed/dead
  created_at TEXT NOT NULL DEFAULT (now()::text),
  updated_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS roll_log (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL DEFAULT 0,
  expression TEXT NOT NULL, -- e.g. "1d20+3"
  breakdown TEXT NOT NULL,  -- e.g. "14 + 3 = 17"
  total INTEGER NOT NULL,
  purpose TEXT NOT NULL DEFAULT '', -- e.g. "Stealth check"
  created_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE INDEX IF NOT EXISTS idx_narrative_log_campaign ON narrative_log(campaign_id, turn_number);
CREATE INDEX IF NOT EXISTS idx_inventory_character ON inventory_items(character_id);
CREATE INDEX IF NOT EXISTS idx_quests_campaign ON quests(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_combat_participants_encounter ON combat_participants(encounter_id);
CREATE INDEX IF NOT EXISTS idx_roll_log_campaign ON roll_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_companions_campaign ON companions(campaign_id, is_active);
CREATE INDEX IF NOT EXISTS idx_world_facts_campaign ON world_facts(campaign_id);
