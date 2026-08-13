import * as q from "../db/queries";
import type { Character } from "@/types";

function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Shared between the get_character_sheet tool (lib/tools/execute.ts) and
// the auto-injected per-turn context (lib/dm/context.ts) so the DM sees the
// exact same shape either way, whether it's handed to it up front or it
// asks for it explicitly mid-turn.
export async function serializeCharacter(character: Character | null) {
  if (!character) return null;
  const inventory = await q.getInventory(character.id);
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
