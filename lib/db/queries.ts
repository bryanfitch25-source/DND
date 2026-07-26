import { getDb } from "./index";
import type {
  Campaign,
  Character,
  CombatEncounter,
  CombatParticipant,
  InventoryItem,
  NarrativeLogEntry,
  Quest,
  RollLogEntry,
  WorldFact,
} from "@/types";

// ---------- Campaign (one row per oneshot session) ----------

export function getCampaign(campaignId: number): Campaign {
  const db = getDb();
  return db.prepare("SELECT * FROM campaigns WHERE id = ?").get(campaignId) as unknown as Campaign;
}

/** Start a brand-new oneshot. Its id is higher than any existing campaign,
 * so it automatically becomes "current" (see getPrimaryCampaignId). */
export function createCampaign(name = "New Oneshot"): Campaign {
  const db = getDb();
  const info = db
    .prepare("INSERT INTO campaigns (name, status) VALUES (?, 'character_creation')")
    .run(name);
  return getCampaign(info.lastInsertRowid as number);
}

export function updateCampaign(campaignId: number, fields: Partial<Campaign>) {
  const db = getDb();
  const keys = Object.keys(fields).filter((k) => k !== "id" && k !== "campaign_id");
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = @${k}`).join(", ");
  db.prepare(
    `UPDATE campaigns SET ${setClause}, updated_at = datetime('now') WHERE id = @id`
  ).run({ ...fields, id: campaignId });
}

export function incrementTurnNumber(campaignId: number): number {
  const db = getDb();
  db.prepare(
    "UPDATE campaigns SET current_turn_number = current_turn_number + 1, updated_at = datetime('now') WHERE id = ?"
  ).run(campaignId);
  return getCampaign(campaignId).current_turn_number;
}

// ---------- Characters ----------

export function getCharacterByCampaign(campaignId: number): Character | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM characters WHERE campaign_id = ? ORDER BY id DESC LIMIT 1")
    .get(campaignId) as unknown as Character | undefined;
  return row || null;
}

export function createCharacter(campaignId: number, fields: Partial<Character>): Character {
  const db = getDb();
  const cols = Object.keys(fields);
  const placeholders = cols.map((c) => `@${c}`).join(", ");
  const colNames = cols.join(", ");
  const info = db
    .prepare(
      `INSERT INTO characters (campaign_id${cols.length ? ", " + colNames : ""})
       VALUES (@campaign_id${cols.length ? ", " + placeholders : ""})`
    )
    .run({ campaign_id: campaignId, ...fields });
  return db.prepare("SELECT * FROM characters WHERE id = ?").get(info.lastInsertRowid) as unknown as Character;
}

export function updateCharacter(characterId: number, fields: Record<string, unknown>): Character {
  const db = getDb();
  const keys = Object.keys(fields);
  if (keys.length > 0) {
    const setClause = keys.map((k) => `${k} = @${k}`).join(", ");
    db.prepare(
      `UPDATE characters SET ${setClause}, updated_at = datetime('now') WHERE id = @id`
    ).run({ ...fields, id: characterId });
  }
  return db.prepare("SELECT * FROM characters WHERE id = ?").get(characterId) as unknown as Character;
}

// ---------- Inventory ----------

export function getInventory(characterId: number): InventoryItem[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM inventory_items WHERE character_id = ? ORDER BY id ASC")
    .all(characterId) as unknown as InventoryItem[];
}

export function addInventoryItem(
  campaignId: number,
  characterId: number,
  item: {
    name: string;
    description?: string;
    category?: string;
    quantity?: number;
    equipped?: boolean;
    weight?: number;
  }
): InventoryItem {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO inventory_items (campaign_id, character_id, name, description, category, quantity, equipped, weight)
       VALUES (@campaign_id, @character_id, @name, @description, @category, @quantity, @equipped, @weight)`
    )
    .run({
      campaign_id: campaignId,
      character_id: characterId,
      name: item.name,
      description: item.description || "",
      category: item.category || "gear",
      quantity: item.quantity ?? 1,
      equipped: item.equipped ? 1 : 0,
      weight: item.weight ?? 0,
    });
  return db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(info.lastInsertRowid) as unknown as InventoryItem;
}

export function removeInventoryItem(itemId: number, quantity?: number): { removed: boolean; remainingQuantity: number } {
  const db = getDb();
  const row = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(itemId) as
    | InventoryItem
    | undefined;
  if (!row) return { removed: false, remainingQuantity: 0 };

  const removeQty = quantity ?? row.quantity;
  if (removeQty >= row.quantity) {
    db.prepare("DELETE FROM inventory_items WHERE id = ?").run(itemId);
    return { removed: true, remainingQuantity: 0 };
  } else {
    const newQty = row.quantity - removeQty;
    db.prepare("UPDATE inventory_items SET quantity = ? WHERE id = ?").run(newQty, itemId);
    return { removed: false, remainingQuantity: newQty };
  }
}

// ---------- Quests ----------

export function getQuests(campaignId: number): Quest[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM quests WHERE campaign_id = ? ORDER BY status ASC, updated_at DESC")
    .all(campaignId) as unknown as Quest[];
}

export function addOrUpdateQuest(
  campaignId: number,
  quest: {
    id?: number;
    title: string;
    description?: string;
    status?: string;
    category?: string;
  }
): Quest {
  const db = getDb();
  if (quest.id) {
    const existing = db.prepare("SELECT * FROM quests WHERE id = ?").get(quest.id) as unknown as Quest | undefined;
    if (existing) {
      db.prepare(
        `UPDATE quests SET title = @title, description = @description, status = @status, category = @category, updated_at = datetime('now')
         WHERE id = @id`
      ).run({
        id: quest.id,
        title: quest.title ?? existing.title,
        description: quest.description ?? existing.description,
        status: quest.status ?? existing.status,
        category: quest.category ?? existing.category,
      });
      return db.prepare("SELECT * FROM quests WHERE id = ?").get(quest.id) as unknown as Quest;
    }
  }
  const info = db
    .prepare(
      `INSERT INTO quests (campaign_id, title, description, status, category)
       VALUES (@campaign_id, @title, @description, @status, @category)`
    )
    .run({
      campaign_id: campaignId,
      title: quest.title,
      description: quest.description || "",
      status: quest.status || "active",
      category: quest.category || "main",
    });
  return db.prepare("SELECT * FROM quests WHERE id = ?").get(info.lastInsertRowid) as unknown as Quest;
}

// ---------- World facts ----------

export function logWorldFact(
  campaignId: number,
  fact: { category: string; title: string; content: string; tags?: string }
): WorldFact {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO world_facts (campaign_id, category, title, content, tags)
       VALUES (@campaign_id, @category, @title, @content, @tags)`
    )
    .run({
      campaign_id: campaignId,
      category: fact.category,
      title: fact.title,
      content: fact.content,
      tags: fact.tags || "",
    });
  return db.prepare("SELECT * FROM world_facts WHERE id = ?").get(info.lastInsertRowid) as unknown as WorldFact;
}

export function searchWorldFacts(campaignId: number, query: string, limit = 8): WorldFact[] {
  const db = getDb();
  if (!query || !query.trim()) {
    return db
      .prepare("SELECT * FROM world_facts WHERE campaign_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(campaignId, limit) as unknown as WorldFact[];
  }
  // Sanitize query into FTS5 MATCH-safe token soup (OR of quoted terms).
  const terms = query
    .split(/[^a-zA-Z0-9']+/)
    .filter(Boolean)
    .map((t) => `"${t.replace(/"/g, "")}"`)
    .join(" OR ");

  if (!terms) {
    return db
      .prepare("SELECT * FROM world_facts WHERE campaign_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(campaignId, limit) as unknown as WorldFact[];
  }

  try {
    return db
      .prepare(
        `SELECT wf.* FROM world_facts_fts f
         JOIN world_facts wf ON wf.id = f.rowid
         WHERE f MATCH ? AND wf.campaign_id = ?
         ORDER BY rank
         LIMIT ?`
      )
      .all(terms, campaignId, limit) as unknown as WorldFact[];
  } catch {
    // Fall back to recency if the FTS query is malformed for any reason.
    return db
      .prepare("SELECT * FROM world_facts WHERE campaign_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(campaignId, limit) as unknown as WorldFact[];
  }
}

export function getAllWorldFacts(campaignId: number): WorldFact[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM world_facts WHERE campaign_id = ? ORDER BY created_at DESC")
    .all(campaignId) as unknown as WorldFact[];
}

// ---------- Narrative log ----------

export function appendNarrative(
  campaignId: number,
  turnNumber: number,
  role: "player" | "dm",
  content: string
): NarrativeLogEntry {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO narrative_log (campaign_id, turn_number, role, content) VALUES (?, ?, ?, ?)`
    )
    .run(campaignId, turnNumber, role, content);
  return db.prepare("SELECT * FROM narrative_log WHERE id = ?").get(info.lastInsertRowid) as unknown as NarrativeLogEntry;
}

/**
 * A oneshot's full narrative comfortably fits in context, so this is a
 * defensive cap rather than an active compression step -- see
 * MAX_NARRATIVE_ENTRIES_IN_CONTEXT in lib/config.ts. Returns the most
 * recent `limit` narrative_log rows in chronological order.
 */
export function getRecentNarrative(campaignId: number, limit: number): NarrativeLogEntry[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM narrative_log WHERE campaign_id = ? ORDER BY id DESC LIMIT ?`)
    .all(campaignId, limit) as unknown as NarrativeLogEntry[];
  return rows.reverse();
}

export function getAllNarrative(campaignId: number): NarrativeLogEntry[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM narrative_log WHERE campaign_id = ? ORDER BY id ASC")
    .all(campaignId) as unknown as NarrativeLogEntry[];
}

// ---------- Combat ----------

export function getActiveEncounter(campaignId: number): CombatEncounter | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM combat_encounters WHERE campaign_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1")
    .get(campaignId) as unknown as CombatEncounter | undefined;
  return row || null;
}

export function getCombatants(encounterId: number): CombatParticipant[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM combat_participants WHERE encounter_id = ? ORDER BY turn_order ASC")
    .all(encounterId) as unknown as CombatParticipant[];
}

export function startCombat(
  campaignId: number,
  description: string,
  participants: Array<{
    name: string;
    is_pc?: boolean;
    is_companion?: boolean;
    initiative: number;
    hp_current: number;
    hp_max: number;
    ac: number;
    position?: string;
    notes?: string;
  }>
): { encounter: CombatEncounter; combatants: CombatParticipant[] } {
  const db = getDb();

  // End any lingering active encounter first (defensive).
  db.prepare("UPDATE combat_encounters SET status = 'ended', ended_at = datetime('now') WHERE campaign_id = ? AND status = 'active'").run(campaignId);

  const info = db
    .prepare(
      "INSERT INTO combat_encounters (campaign_id, status, round_number, current_turn_index, description) VALUES (?, 'active', 1, 0, ?)"
    )
    .run(campaignId, description);
  const encounterId = info.lastInsertRowid as number;

  const sorted = [...participants].sort((a, b) => b.initiative - a.initiative);
  const insert = db.prepare(
    `INSERT INTO combat_participants
     (encounter_id, name, is_pc, is_companion, initiative, turn_order, hp_current, hp_max, ac, position, notes)
     VALUES (@encounter_id, @name, @is_pc, @is_companion, @initiative, @turn_order, @hp_current, @hp_max, @ac, @position, @notes)`
  );
  sorted.forEach((p, idx) => {
    insert.run({
      encounter_id: encounterId,
      name: p.name,
      is_pc: p.is_pc ? 1 : 0,
      is_companion: p.is_companion ? 1 : 0,
      initiative: p.initiative,
      turn_order: idx,
      hp_current: p.hp_current,
      hp_max: p.hp_max,
      ac: p.ac,
      position: p.position || "",
      notes: p.notes || "",
    });
  });

  const encounter = db.prepare("SELECT * FROM combat_encounters WHERE id = ?").get(encounterId) as unknown as CombatEncounter;
  return { encounter, combatants: getCombatants(encounterId) };
}

export function endCombat(encounterId: number) {
  const db = getDb();
  db.prepare("UPDATE combat_encounters SET status = 'ended', ended_at = datetime('now') WHERE id = ?").run(encounterId);
}

export function updateCombatState(
  encounterId: number,
  updates: {
    round_number?: number;
    current_turn_index?: number;
    participantUpdates?: Array<{
      id?: number;
      name?: string;
      hp_current?: number;
      hp_max?: number;
      ac?: number;
      conditions?: string[];
      position?: string;
      notes?: string;
      is_defeated?: boolean;
      initiative?: number;
    }>;
  }
): { encounter: CombatEncounter; combatants: CombatParticipant[] } {
  const db = getDb();
  const encounterFields: Record<string, unknown> = {};
  if (updates.round_number !== undefined) encounterFields.round_number = updates.round_number;
  if (updates.current_turn_index !== undefined) encounterFields.current_turn_index = updates.current_turn_index;
  if (Object.keys(encounterFields).length > 0) {
    const setClause = Object.keys(encounterFields)
      .map((k) => `${k} = @${k}`)
      .join(", ");
    db.prepare(`UPDATE combat_encounters SET ${setClause} WHERE id = @id`).run({
      ...encounterFields,
      id: encounterId,
    });
  }

  for (const p of updates.participantUpdates || []) {
    if (!p.id) continue;
    const fields: Record<string, unknown> = {};
    if (p.name !== undefined) fields.name = p.name;
    if (p.hp_current !== undefined) fields.hp_current = p.hp_current;
    if (p.hp_max !== undefined) fields.hp_max = p.hp_max;
    if (p.ac !== undefined) fields.ac = p.ac;
    if (p.conditions !== undefined) fields.conditions = JSON.stringify(p.conditions);
    if (p.position !== undefined) fields.position = p.position;
    if (p.notes !== undefined) fields.notes = p.notes;
    if (p.is_defeated !== undefined) fields.is_defeated = p.is_defeated ? 1 : 0;
    if (p.initiative !== undefined) fields.initiative = p.initiative;
    if (Object.keys(fields).length === 0) continue;
    const setClause = Object.keys(fields)
      .map((k) => `${k} = @${k}`)
      .join(", ");
    db.prepare(`UPDATE combat_participants SET ${setClause} WHERE id = @id`).run({
      ...fields,
      id: p.id,
    });
  }

  const encounter = db.prepare("SELECT * FROM combat_encounters WHERE id = ?").get(encounterId) as unknown as CombatEncounter;
  return { encounter, combatants: getCombatants(encounterId) };
}

// ---------- Roll log ----------

export function logRoll(
  campaignId: number,
  turnNumber: number,
  roll: { expression: string; breakdown: string; total: number; purpose?: string }
): RollLogEntry {
  const db = getDb();
  const info = db
    .prepare(
      "INSERT INTO roll_log (campaign_id, turn_number, expression, breakdown, total, purpose) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(campaignId, turnNumber, roll.expression, roll.breakdown, roll.total, roll.purpose || "");
  return db.prepare("SELECT * FROM roll_log WHERE id = ?").get(info.lastInsertRowid) as unknown as RollLogEntry;
}

export function getRecentRolls(campaignId: number, limit = 20): RollLogEntry[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM roll_log WHERE campaign_id = ? ORDER BY id DESC LIMIT ?")
    .all(campaignId, limit) as unknown as RollLogEntry[];
  return rows.reverse();
}
