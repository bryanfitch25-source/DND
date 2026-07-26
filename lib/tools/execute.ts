import { rollDice } from "../dice";
import * as q from "../db/queries";
import { WORLD_FACT_SEARCH_LIMIT } from "../config";

export interface ToolContext {
  campaignId: number;
  characterId: number | null;
  turnNumber: number;
}

export interface ToolExecutionResult {
  content: string; // fed back to Claude as the tool_result content
  isError?: boolean;
  /** Set true if this tool call created the character (so the caller can pick up the new id). */
  createdCharacterId?: number;
}

function serializeCharacter(character: ReturnType<typeof q.getCharacterByCampaign>) {
  if (!character) return null;
  const inventory = q.getInventory(character.id);
  return {
    ...character,
    saving_throw_proficiencies: safeParse(character.saving_throw_proficiencies, []),
    skill_proficiencies: safeParse(character.skill_proficiencies, []),
    conditions: safeParse(character.conditions, []),
    spell_slots: safeParse(character.spell_slots, {}),
    known_spells: safeParse(character.known_spells, []),
    features: safeParse(character.features, []),
    inventory,
  };
}

function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * spell_slots is declared to the model as a JSON-encoded string (Gemini's
 * function-calling schema has no freeform/additionalProperties object type),
 * so normalize whatever comes back into a valid JSON string we can store
 * as-is. Falls back to "{}" if the model sends malformed JSON.
 */
function normalizeJsonStringField(value: unknown): string {
  if (typeof value === "string") {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return "{}";
    }
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "{}";
}

export function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): ToolExecutionResult {
  try {
    switch (name) {
      case "create_character": {
        const { starting_inventory, ...rest } = input as any;
        const fields: Record<string, unknown> = { ...rest };
        for (const key of ["saving_throw_proficiencies", "skill_proficiencies", "known_spells", "features"]) {
          if (fields[key] !== undefined) fields[key] = JSON.stringify(fields[key]);
        }
        if (fields.spell_slots !== undefined) fields.spell_slots = normalizeJsonStringField(fields.spell_slots);
        if (fields.hp_current === undefined) fields.hp_current = fields.hp_max;
        const character = q.createCharacter(ctx.campaignId, fields);
        if (Array.isArray(starting_inventory)) {
          for (const item of starting_inventory) {
            if (item?.name) q.addInventoryItem(ctx.campaignId, character.id, item);
          }
        }
        q.updateCampaign(ctx.campaignId, { status: "active" });
        return {
          content: JSON.stringify(serializeCharacter(character)),
          createdCharacterId: character.id,
        };
      }

      case "get_character_sheet": {
        if (!ctx.characterId) {
          return { content: "No character exists yet. This campaign is still in character creation." };
        }
        const character = q.getCharacterByCampaign(ctx.campaignId);
        return { content: JSON.stringify(serializeCharacter(character)) };
      }

      case "update_character": {
        if (!ctx.characterId) {
          return { content: "No character exists yet; cannot update.", isError: true };
        }
        const fields: Record<string, unknown> = { ...input };
        for (const key of ["conditions", "known_spells", "features"]) {
          if (fields[key] !== undefined) fields[key] = JSON.stringify(fields[key]);
        }
        if (fields.spell_slots !== undefined) fields.spell_slots = normalizeJsonStringField(fields.spell_slots);
        if (fields.is_dead !== undefined) fields.is_dead = fields.is_dead ? 1 : 0;
        const updated = q.updateCharacter(ctx.characterId, fields);
        return { content: JSON.stringify(serializeCharacter(updated)) };
      }

      case "add_inventory_item": {
        if (!ctx.characterId) {
          return { content: "No character exists yet; cannot add inventory.", isError: true };
        }
        const item = q.addInventoryItem(ctx.campaignId, ctx.characterId, input as any);
        return { content: JSON.stringify(item) };
      }

      case "remove_inventory_item": {
        const itemId = Number(input.item_id);
        const quantity = input.quantity !== undefined ? Number(input.quantity) : undefined;
        const result = q.removeInventoryItem(itemId, quantity);
        return { content: JSON.stringify(result) };
      }

      case "get_quest_log": {
        const quests = q.getQuests(ctx.campaignId);
        return { content: JSON.stringify(quests) };
      }

      case "update_quest": {
        const quest = q.addOrUpdateQuest(ctx.campaignId, input as any);
        return { content: JSON.stringify(quest) };
      }

      case "log_world_fact": {
        const fact = q.logWorldFact(ctx.campaignId, input as any);
        return { content: JSON.stringify(fact) };
      }

      case "search_world_facts": {
        const query = String(input.query || "");
        const facts = q.searchWorldFacts(ctx.campaignId, query, WORLD_FACT_SEARCH_LIMIT);
        return { content: JSON.stringify(facts) };
      }

      case "roll_dice": {
        const expression = String(input.expression || "");
        const purpose = input.purpose ? String(input.purpose) : "";
        const result = rollDice(expression);
        const logged = q.logRoll(ctx.campaignId, ctx.turnNumber, {
          expression: result.expression,
          breakdown: result.breakdown,
          total: result.total,
          purpose,
        });
        return { content: JSON.stringify({ ...result, purpose, id: logged.id }) };
      }

      case "start_combat": {
        const description = String(input.description || "");
        const participants = (input.participants as any[]) || [];
        const { encounter, combatants } = q.startCombat(ctx.campaignId, description, participants);
        return { content: JSON.stringify({ encounter, combatants }) };
      }

      case "update_combat_state": {
        const encounter = q.getActiveEncounter(ctx.campaignId);
        if (!encounter) {
          return { content: "No active combat encounter.", isError: true };
        }
        const result = q.updateCombatState(encounter.id, {
          round_number: input.round_number as number | undefined,
          current_turn_index: input.current_turn_index as number | undefined,
          participantUpdates: input.participant_updates as any,
        });
        return { content: JSON.stringify(result) };
      }

      case "end_combat": {
        const encounter = q.getActiveEncounter(ctx.campaignId);
        if (!encounter) {
          return { content: "No active combat encounter to end." };
        }
        q.endCombat(encounter.id);
        return { content: "Combat ended." };
      }

      default:
        return { content: `Unknown tool: ${name}`, isError: true };
    }
  } catch (err) {
    return { content: `Tool error: ${(err as Error).message}`, isError: true };
  }
}
