// Shared 5e reference data for the frontend (ability mods, skill list, XP
// thresholds). Pure/static — no server dependencies, safe to import from
// client components.

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function fmtMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export const SKILLS: Array<{ key: string; label: string; ability: AbilityKey }> = [
  { key: "acrobatics", label: "Acrobatics", ability: "dex" },
  { key: "animal_handling", label: "Animal Handling", ability: "wis" },
  { key: "arcana", label: "Arcana", ability: "int" },
  { key: "athletics", label: "Athletics", ability: "str" },
  { key: "deception", label: "Deception", ability: "cha" },
  { key: "history", label: "History", ability: "int" },
  { key: "insight", label: "Insight", ability: "wis" },
  { key: "intimidation", label: "Intimidation", ability: "cha" },
  { key: "investigation", label: "Investigation", ability: "int" },
  { key: "medicine", label: "Medicine", ability: "wis" },
  { key: "nature", label: "Nature", ability: "int" },
  { key: "perception", label: "Perception", ability: "wis" },
  { key: "performance", label: "Performance", ability: "cha" },
  { key: "persuasion", label: "Persuasion", ability: "cha" },
  { key: "religion", label: "Religion", ability: "int" },
  { key: "sleight_of_hand", label: "Sleight of Hand", ability: "dex" },
  { key: "stealth", label: "Stealth", ability: "dex" },
  { key: "survival", label: "Survival", ability: "wis" },
];

export const ABILITIES: Array<{ key: AbilityKey; label: string }> = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];

// 5e PHB XP-to-level thresholds (index = level - 1).
export const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000,
  195000, 225000, 265000, 305000, 355000,
];

/** The highest level `xp` qualifies for, capped at 20. */
export function levelForXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(20, level);
}

export function xpToNextLevel(xp: number, currentLevel: number): number | null {
  if (currentLevel >= 20) return null;
  const next = XP_THRESHOLDS[currentLevel];
  return next !== undefined ? next - xp : null;
}

export function safeParseArray(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function safeParseSlots(json: string): Record<string, { max: number; current: number }> {
  try {
    const v = JSON.parse(json);
    return typeof v === "object" && v ? v : {};
  } catch {
    return {};
  }
}
