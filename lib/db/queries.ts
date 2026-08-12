import { getSql, ensureMigrated } from "./index";
import type {
  Campaign,
  Character,
  CombatEncounter,
  CombatParticipant,
  Companion,
  InventoryItem,
  NarrativeLogEntry,
  Quest,
  RollLogEntry,
  WorldFact,
} from "@/types";

async function db() {
  await ensureMigrated();
  return getSql();
}

// ---------- Campaign (one row per open-ended campaign) ----------

export async function getCampaign(campaignId: number): Promise<Campaign> {
  const sql = await db();
  const rows = await sql<Campaign[]>`SELECT * FROM campaigns WHERE id = ${campaignId}`;
  return rows[0];
}

/** Start a brand-new campaign. Its id is higher than any existing campaign,
 * so it automatically becomes "current" (see getPrimaryCampaignId). */
export async function createCampaign(name = "New Campaign"): Promise<Campaign> {
  const sql = await db();
  const rows = await sql<Campaign[]>`
    INSERT INTO campaigns (name, status) VALUES (${name}, 'character_creation') RETURNING *`;
  return rows[0];
}

export async function updateCampaign(campaignId: number, fields: Partial<Campaign>): Promise<void> {
  const sql = await db();
  const keys = Object.keys(fields).filter((k) => k !== "id" && k !== "campaign_id");
  if (keys.length === 0) return;
  const patch: Record<string, unknown> = {};
  for (const k of keys) patch[k] = (fields as Record<string, unknown>)[k];
  await sql`UPDATE campaigns SET ${sql(patch)}, updated_at = now()::text WHERE id = ${campaignId}`;
}

export async function incrementTurnNumber(campaignId: number): Promise<number> {
  const sql = await db();
  const rows = await sql<{ current_turn_number: number }[]>`
    UPDATE campaigns SET current_turn_number = current_turn_number + 1, updated_at = now()::text
    WHERE id = ${campaignId} RETURNING current_turn_number`;
  return rows[0].current_turn_number;
}

// ---------- Characters ----------

export async function getCharacterByCampaign(campaignId: number): Promise<Character | null> {
  const sql = await db();
  const rows = await sql<Character[]>`
    SELECT * FROM characters WHERE campaign_id = ${campaignId} ORDER BY id DESC LIMIT 1`;
  return rows[0] || null;
}

export async function createCharacter(campaignId: number, fields: Partial<Character>): Promise<Character> {
  const sql = await db();
  const rows = await sql<Character[]>`
    INSERT INTO characters ${sql({ campaign_id: campaignId, ...fields })} RETURNING *`;
  return rows[0];
}

export async function updateCharacter(
  characterId: number,
  fields: Record<string, unknown>
): Promise<Character> {
  const sql = await db();
  const keys = Object.keys(fields);
  if (keys.length > 0) {
    await sql`UPDATE characters SET ${sql(fields)}, updated_at = now()::text WHERE id = ${characterId}`;
  }
  const rows = await sql<Character[]>`SELECT * FROM characters WHERE id = ${characterId}`;
  return rows[0];
}

// ---------- Inventory ----------

export async function getInventory(characterId: number): Promise<InventoryItem[]> {
  const sql = await db();
  return sql<InventoryItem[]>`
    SELECT * FROM inventory_items WHERE character_id = ${characterId} ORDER BY id ASC`;
}

export async function addInventoryItem(
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
): Promise<InventoryItem> {
  const sql = await db();
  const rows = await sql<InventoryItem[]>`
    INSERT INTO inventory_items (campaign_id, character_id, name, description, category, quantity, equipped, weight)
    VALUES (
      ${campaignId}, ${characterId}, ${item.name}, ${item.description || ""},
      ${item.category || "gear"}, ${item.quantity ?? 1}, ${item.equipped ? 1 : 0}, ${item.weight ?? 0}
    ) RETURNING *`;
  return rows[0];
}

export async function removeInventoryItem(
  itemId: number,
  quantity?: number
): Promise<{ removed: boolean; remainingQuantity: number }> {
  const sql = await db();
  const rows = await sql<InventoryItem[]>`SELECT * FROM inventory_items WHERE id = ${itemId}`;
  const row = rows[0];
  if (!row) return { removed: false, remainingQuantity: 0 };

  const removeQty = quantity ?? row.quantity;
  if (removeQty >= row.quantity) {
    await sql`DELETE FROM inventory_items WHERE id = ${itemId}`;
    return { removed: true, remainingQuantity: 0 };
  } else {
    const newQty = row.quantity - removeQty;
    await sql`UPDATE inventory_items SET quantity = ${newQty} WHERE id = ${itemId}`;
    return { removed: false, remainingQuantity: newQty };
  }
}

// ---------- Quests ----------

export async function getQuests(campaignId: number): Promise<Quest[]> {
  const sql = await db();
  return sql<Quest[]>`
    SELECT * FROM quests WHERE campaign_id = ${campaignId} ORDER BY status ASC, updated_at DESC`;
}

export async function addOrUpdateQuest(
  campaignId: number,
  quest: {
    id?: number;
    title: string;
    description?: string;
    status?: string;
    category?: string;
  }
): Promise<Quest> {
  const sql = await db();
  if (quest.id) {
    const existingRows = await sql<Quest[]>`SELECT * FROM quests WHERE id = ${quest.id}`;
    const existing = existingRows[0];
    if (existing) {
      const rows = await sql<Quest[]>`
        UPDATE quests SET
          title = ${quest.title ?? existing.title},
          description = ${quest.description ?? existing.description},
          status = ${quest.status ?? existing.status},
          category = ${quest.category ?? existing.category},
          updated_at = now()::text
        WHERE id = ${quest.id} RETURNING *`;
      return rows[0];
    }
  }
  const rows = await sql<Quest[]>`
    INSERT INTO quests (campaign_id, title, description, status, category)
    VALUES (${campaignId}, ${quest.title}, ${quest.description || ""}, ${quest.status || "active"}, ${quest.category || "main"})
    RETURNING *`;
  return rows[0];
}

// ---------- World facts ----------

export async function logWorldFact(
  campaignId: number,
  fact: { category: string; title: string; content: string; tags?: string }
): Promise<WorldFact> {
  const sql = await db();
  const rows = await sql<WorldFact[]>`
    INSERT INTO world_facts (campaign_id, category, title, content, tags)
    VALUES (${campaignId}, ${fact.category}, ${fact.title}, ${fact.content}, ${fact.tags || ""})
    RETURNING *`;
  return rows[0];
}

/** Plain ILIKE search over title/content/tags -- replaces the SQLite-era
 * FTS5 virtual table, which has no direct Postgres equivalent needed at
 * this scale (a single campaign's world facts is at most a few hundred rows). */
export async function searchWorldFacts(campaignId: number, query: string, limit = 8): Promise<WorldFact[]> {
  const sql = await db();
  const trimmed = query.trim();
  if (!trimmed) {
    return sql<WorldFact[]>`
      SELECT * FROM world_facts WHERE campaign_id = ${campaignId} ORDER BY created_at DESC LIMIT ${limit}`;
  }
  const needle = `%${trimmed}%`;
  return sql<WorldFact[]>`
    SELECT * FROM world_facts
    WHERE campaign_id = ${campaignId}
      AND (title ILIKE ${needle} OR content ILIKE ${needle} OR tags ILIKE ${needle})
    ORDER BY created_at DESC LIMIT ${limit}`;
}

export async function getAllWorldFacts(campaignId: number): Promise<WorldFact[]> {
  const sql = await db();
  return sql<WorldFact[]>`
    SELECT * FROM world_facts WHERE campaign_id = ${campaignId} ORDER BY created_at DESC`;
}

// ---------- Narrative log ----------

export async function appendNarrative(
  campaignId: number,
  turnNumber: number,
  role: "player" | "dm",
  content: string
): Promise<NarrativeLogEntry> {
  const sql = await db();
  const rows = await sql<NarrativeLogEntry[]>`
    INSERT INTO narrative_log (campaign_id, turn_number, role, content)
    VALUES (${campaignId}, ${turnNumber}, ${role}, ${content}) RETURNING *`;
  return rows[0];
}

/** Returns the most recent `limit` narrative_log rows in chronological order. */
export async function getRecentNarrative(campaignId: number, limit: number): Promise<NarrativeLogEntry[]> {
  const sql = await db();
  const rows = await sql<NarrativeLogEntry[]>`
    SELECT * FROM narrative_log WHERE campaign_id = ${campaignId} ORDER BY id DESC LIMIT ${limit}`;
  return rows.reverse();
}

/** Narrative rows with id strictly greater than `afterRowId`, chronological. */
export async function getNarrativeAfter(campaignId: number, afterRowId: number): Promise<NarrativeLogEntry[]> {
  const sql = await db();
  return sql<NarrativeLogEntry[]>`
    SELECT * FROM narrative_log WHERE campaign_id = ${campaignId} AND id > ${afterRowId} ORDER BY id ASC`;
}

export async function getAllNarrative(campaignId: number): Promise<NarrativeLogEntry[]> {
  const sql = await db();
  return sql<NarrativeLogEntry[]>`
    SELECT * FROM narrative_log WHERE campaign_id = ${campaignId} ORDER BY id ASC`;
}

// ---------- Rolling campaign summary (open-ended campaigns only) ----------

export async function getCampaignSummary(
  campaignId: number
): Promise<{ summary: string; through_row_id: number }> {
  const sql = await db();
  const rows = await sql<{ summary: string; through_row_id: number }[]>`
    SELECT summary, through_row_id FROM campaign_summary WHERE campaign_id = ${campaignId}`;
  return rows[0] || { summary: "", through_row_id: 0 };
}

export async function upsertCampaignSummary(
  campaignId: number,
  summary: string,
  throughRowId: number
): Promise<void> {
  const sql = await db();
  await sql`
    INSERT INTO campaign_summary (campaign_id, summary, through_row_id, updated_at)
    VALUES (${campaignId}, ${summary}, ${throughRowId}, now()::text)
    ON CONFLICT (campaign_id) DO UPDATE SET
      summary = EXCLUDED.summary,
      through_row_id = EXCLUDED.through_row_id,
      updated_at = now()::text`;
}

// ---------- Companions (persistent roster outside combat) ----------

export async function getCompanions(campaignId: number, activeOnly = true): Promise<Companion[]> {
  const sql = await db();
  if (activeOnly) {
    return sql<Companion[]>`
      SELECT * FROM companions WHERE campaign_id = ${campaignId} AND is_active = 1 ORDER BY id ASC`;
  }
  return sql<Companion[]>`SELECT * FROM companions WHERE campaign_id = ${campaignId} ORDER BY id ASC`;
}

export async function upsertCompanion(
  campaignId: number,
  companion: {
    id?: number;
    name: string;
    description?: string;
    hp_current?: number;
    hp_max?: number;
    ac?: number;
    notes?: string;
    is_active?: boolean;
  }
): Promise<Companion> {
  const sql = await db();
  if (companion.id) {
    const existingRows = await sql<Companion[]>`SELECT * FROM companions WHERE id = ${companion.id}`;
    const existing = existingRows[0];
    if (existing) {
      const rows = await sql<Companion[]>`
        UPDATE companions SET
          name = ${companion.name ?? existing.name},
          description = ${companion.description ?? existing.description},
          hp_current = ${companion.hp_current ?? existing.hp_current},
          hp_max = ${companion.hp_max ?? existing.hp_max},
          ac = ${companion.ac ?? existing.ac},
          notes = ${companion.notes ?? existing.notes},
          is_active = ${companion.is_active !== undefined ? (companion.is_active ? 1 : 0) : existing.is_active},
          updated_at = now()::text
        WHERE id = ${companion.id} RETURNING *`;
      return rows[0];
    }
  }
  const rows = await sql<Companion[]>`
    INSERT INTO companions (campaign_id, name, description, hp_current, hp_max, ac, notes, is_active)
    VALUES (
      ${campaignId}, ${companion.name}, ${companion.description || ""},
      ${companion.hp_current ?? companion.hp_max ?? 1}, ${companion.hp_max ?? 1}, ${companion.ac ?? 10},
      ${companion.notes || ""}, ${companion.is_active === false ? 0 : 1}
    ) RETURNING *`;
  return rows[0];
}

// ---------- Combat ----------

export async function getActiveEncounter(campaignId: number): Promise<CombatEncounter | null> {
  const sql = await db();
  const rows = await sql<CombatEncounter[]>`
    SELECT * FROM combat_encounters WHERE campaign_id = ${campaignId} AND status = 'active'
    ORDER BY id DESC LIMIT 1`;
  return rows[0] || null;
}

export async function getCombatants(encounterId: number): Promise<CombatParticipant[]> {
  const sql = await db();
  return sql<CombatParticipant[]>`
    SELECT * FROM combat_participants WHERE encounter_id = ${encounterId} ORDER BY turn_order ASC`;
}

export async function startCombat(
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
    x?: number;
    y?: number;
    notes?: string;
  }>,
  gridWidth = 10,
  gridHeight = 8,
  terrain: Array<{ x: number; y: number; type: string }> = []
): Promise<{ encounter: CombatEncounter; combatants: CombatParticipant[] }> {
  const sql = await db();

  // End any lingering active encounter first (defensive).
  await sql`
    UPDATE combat_encounters SET status = 'ended', ended_at = now()::text
    WHERE campaign_id = ${campaignId} AND status = 'active'`;

  const encounterRows = await sql<CombatEncounter[]>`
    INSERT INTO combat_encounters (campaign_id, status, round_number, current_turn_index, description, grid_width, grid_height, terrain)
    VALUES (${campaignId}, 'active', 1, 0, ${description}, ${gridWidth}, ${gridHeight}, ${JSON.stringify(terrain)})
    RETURNING *`;
  const encounter = encounterRows[0];

  const sorted = [...participants].sort((a, b) => b.initiative - a.initiative);
  for (let idx = 0; idx < sorted.length; idx++) {
    const p = sorted[idx];
    await sql`
      INSERT INTO combat_participants
        (encounter_id, name, is_pc, is_companion, initiative, turn_order, hp_current, hp_max, ac, x, y, notes)
      VALUES (
        ${encounter.id}, ${p.name}, ${p.is_pc ? 1 : 0}, ${p.is_companion ? 1 : 0}, ${p.initiative}, ${idx},
        ${p.hp_current}, ${p.hp_max}, ${p.ac}, ${p.x ?? 0}, ${p.y ?? 0}, ${p.notes || ""}
      )`;
  }

  return { encounter, combatants: await getCombatants(encounter.id) };
}

export async function endCombat(encounterId: number): Promise<void> {
  const sql = await db();
  await sql`UPDATE combat_encounters SET status = 'ended', ended_at = now()::text WHERE id = ${encounterId}`;
}

export async function updateCombatState(
  encounterId: number,
  updates: {
    round_number?: number;
    current_turn_index?: number;
    terrain?: Array<{ x: number; y: number; type: string }>;
    participantUpdates?: Array<{
      id?: number;
      name?: string;
      hp_current?: number;
      hp_max?: number;
      ac?: number;
      conditions?: string[];
      x?: number;
      y?: number;
      notes?: string;
      is_defeated?: boolean;
      initiative?: number;
    }>;
  }
): Promise<{ encounter: CombatEncounter; combatants: CombatParticipant[] }> {
  const sql = await db();
  const encounterFields: Record<string, unknown> = {};
  if (updates.round_number !== undefined) encounterFields.round_number = updates.round_number;
  if (updates.current_turn_index !== undefined) encounterFields.current_turn_index = updates.current_turn_index;
  if (updates.terrain !== undefined) encounterFields.terrain = JSON.stringify(updates.terrain);
  if (Object.keys(encounterFields).length > 0) {
    await sql`UPDATE combat_encounters SET ${sql(encounterFields)} WHERE id = ${encounterId}`;
  }

  for (const p of updates.participantUpdates || []) {
    if (!p.id) continue;
    const fields: Record<string, unknown> = {};
    if (p.name !== undefined) fields.name = p.name;
    if (p.hp_current !== undefined) fields.hp_current = p.hp_current;
    if (p.hp_max !== undefined) fields.hp_max = p.hp_max;
    if (p.ac !== undefined) fields.ac = p.ac;
    if (p.conditions !== undefined) fields.conditions = JSON.stringify(p.conditions);
    if (p.x !== undefined) fields.x = p.x;
    if (p.y !== undefined) fields.y = p.y;
    if (p.notes !== undefined) fields.notes = p.notes;
    if (p.is_defeated !== undefined) fields.is_defeated = p.is_defeated ? 1 : 0;
    if (p.initiative !== undefined) fields.initiative = p.initiative;
    if (Object.keys(fields).length === 0) continue;
    await sql`UPDATE combat_participants SET ${sql(fields)} WHERE id = ${p.id}`;
  }

  const encounterRows = await sql<CombatEncounter[]>`SELECT * FROM combat_encounters WHERE id = ${encounterId}`;
  return { encounter: encounterRows[0], combatants: await getCombatants(encounterId) };
}

// ---------- Roll log ----------

export async function logRoll(
  campaignId: number,
  turnNumber: number,
  roll: { expression: string; breakdown: string; total: number; purpose?: string }
): Promise<RollLogEntry> {
  const sql = await db();
  const rows = await sql<RollLogEntry[]>`
    INSERT INTO roll_log (campaign_id, turn_number, expression, breakdown, total, purpose)
    VALUES (${campaignId}, ${turnNumber}, ${roll.expression}, ${roll.breakdown}, ${roll.total}, ${roll.purpose || ""})
    RETURNING *`;
  return rows[0];
}

export async function getRecentRolls(campaignId: number, limit = 20): Promise<RollLogEntry[]> {
  const sql = await db();
  const rows = await sql<RollLogEntry[]>`
    SELECT * FROM roll_log WHERE campaign_id = ${campaignId} ORDER BY id DESC LIMIT ${limit}`;
  return rows.reverse();
}
