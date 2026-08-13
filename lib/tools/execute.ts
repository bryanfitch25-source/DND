import { rollDice } from "../dice";
import * as q from "../db/queries";
import { WORLD_FACT_SEARCH_LIMIT } from "../config";
import { serializeCharacter } from "../dm/character";

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

/**
 * spell_slots is declared to the model as a JSON-encoded string field
 * rather than a freeform nested object, so normalize whatever comes back
 * into a valid JSON string we can store as-is. Falls back to "{}" if the
 * model sends malformed JSON.
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

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolExecutionResult> {
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
        const character = await q.createCharacter(ctx.campaignId, fields);
        if (Array.isArray(starting_inventory)) {
          for (const item of starting_inventory) {
            if (item?.name) await q.addInventoryItem(ctx.campaignId, character.id, item);
          }
        }
        await q.updateCampaign(ctx.campaignId, { status: "active" });
        return {
          content: JSON.stringify(await serializeCharacter(character)),
          createdCharacterId: character.id,
        };
      }

      case "get_character_sheet": {
        if (!ctx.characterId) {
          return { content: "No character exists yet. This campaign is still in character creation." };
        }
        const character = await q.getCharacterByCampaign(ctx.campaignId);
        return { content: JSON.stringify(await serializeCharacter(character)) };
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
        const updated = await q.updateCharacter(ctx.characterId, fields);
        return { content: JSON.stringify(await serializeCharacter(updated)) };
      }

      case "add_inventory_item": {
        if (!ctx.characterId) {
          return { content: "No character exists yet; cannot add inventory.", isError: true };
        }
        const item = await q.addInventoryItem(ctx.campaignId, ctx.characterId, input as any);
        return { content: JSON.stringify(item) };
      }

      case "remove_inventory_item": {
        const itemId = Number(input.item_id);
        const quantity = input.quantity !== undefined ? Number(input.quantity) : undefined;
        const result = await q.removeInventoryItem(itemId, quantity);
        return { content: JSON.stringify(result) };
      }

      case "get_quest_log": {
        const quests = await q.getQuests(ctx.campaignId);
        return { content: JSON.stringify(quests) };
      }

      case "update_quest": {
        const quest = await q.addOrUpdateQuest(ctx.campaignId, input as any);
        return { content: JSON.stringify(quest) };
      }

      case "log_world_fact": {
        const fact = await q.logWorldFact(ctx.campaignId, input as any);
        return { content: JSON.stringify(fact) };
      }

      case "search_world_facts": {
        const query = String(input.query || "");
        const facts = await q.searchWorldFacts(ctx.campaignId, query, WORLD_FACT_SEARCH_LIMIT);
        return { content: JSON.stringify(facts) };
      }

      case "roll_dice": {
        const expression = String(input.expression || "");
        const purpose = input.purpose ? String(input.purpose) : "";
        const result = rollDice(expression);
        const logged = await q.logRoll(ctx.campaignId, ctx.turnNumber, {
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
        const gridWidth = input.grid_width ? Number(input.grid_width) : 10;
        const gridHeight = input.grid_height ? Number(input.grid_height) : 8;
        const terrain = (input.terrain as any[]) || [];
        const { encounter, combatants } = await q.startCombat(
          ctx.campaignId,
          description,
          participants,
          gridWidth,
          gridHeight,
          terrain
        );
        return { content: JSON.stringify({ encounter, combatants }) };
      }

      case "manage_companion": {
        const companion = await q.upsertCompanion(ctx.campaignId, input as any);
        return { content: JSON.stringify(companion) };
      }

      case "update_combat_state": {
        const encounter = await q.getActiveEncounter(ctx.campaignId);
        if (!encounter) {
          return { content: "No active combat encounter.", isError: true };
        }
        const result = await q.updateCombatState(encounter.id, {
          round_number: input.round_number as number | undefined,
          current_turn_index: input.current_turn_index as number | undefined,
          terrain: input.terrain as any,
          participantUpdates: input.participant_updates as any,
        });
        return { content: JSON.stringify(result) };
      }

      case "end_combat": {
        const encounter = await q.getActiveEncounter(ctx.campaignId);
        if (!encounter) {
          return { content: "No active combat encounter to end." };
        }
        await q.endCombat(encounter.id);
        return { content: "Combat ended." };
      }

      default:
        return { content: `Unknown tool: ${name}`, isError: true };
    }
  } catch (err) {
    return { content: `Tool error: ${(err as Error).message}`, isError: true };
  }
}
