"use client";

import type { Character, InventoryItem } from "@/types";

function mod(score: number): string {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

function safeParseArray(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function safeParseSlots(json: string): Record<string, { max: number; current: number }> {
  try {
    const v = JSON.parse(json);
    return typeof v === "object" && v ? v : {};
  } catch {
    return {};
  }
}

const ABILITIES: Array<{ key: keyof Character; label: string }> = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];

export default function CharacterSheet({
  character,
  inventory,
}: {
  character: Character | null;
  inventory: InventoryItem[];
}) {
  if (!character) {
    return (
      <div className="p-4 text-sm text-parchment/60">
        <h2 className="text-lg font-serif mb-2 text-parchment">Character</h2>
        <p>No character yet. Describe who you want to play in the story panel to begin creation.</p>
      </div>
    );
  }

  const conditions = safeParseArray(character.conditions);
  const spellSlots = safeParseSlots(character.spell_slots);
  const hasSlots = Object.keys(spellSlots).length > 0;

  const hpPct = character.hp_max > 0 ? Math.max(0, Math.min(100, (character.hp_current / character.hp_max) * 100)) : 0;

  return (
    <div className="p-4 text-sm overflow-y-auto h-full">
      <h2 className="text-lg font-serif text-parchment mb-1">{character.name}</h2>
      <p className="text-parchment/60 mb-3">
        Level {character.level} {character.race} {character.class}
        {character.background ? ` · ${character.background}` : ""}
      </p>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span>
            HP {character.hp_current}/{character.hp_max}
            {character.hp_temp > 0 ? ` (+${character.hp_temp} temp)` : ""}
          </span>
          <span>AC {character.ac}</span>
        </div>
        <div className="h-2 bg-black/40 rounded overflow-hidden">
          <div
            className={`h-full ${hpPct > 50 ? "bg-green-700" : hpPct > 20 ? "bg-yellow-600" : "bg-blood"}`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>

      {character.is_dead ? (
        <div className="mb-3 text-blood font-semibold">DECEASED</div>
      ) : character.hp_current <= 0 ? (
        <div className="mb-3 text-xs">
          Death saves — Successes: {"●".repeat(character.death_save_successes)}
          {"○".repeat(3 - character.death_save_successes)} / Failures:{" "}
          {"●".repeat(character.death_save_failures)}
          {"○".repeat(3 - character.death_save_failures)}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2 mb-3">
        {ABILITIES.map(({ key, label }) => (
          <div key={key} className="bg-black/30 rounded p-2 text-center">
            <div className="text-[10px] text-parchment/50">{label}</div>
            <div className="font-semibold">{character[key] as number}</div>
            <div className="text-xs text-parchment/60">{mod(character[key] as number)}</div>
          </div>
        ))}
      </div>

      <div className="text-xs text-parchment/70 mb-3">
        Prof. Bonus {mod(0)[0] === "-" ? "" : "+"}
        {character.proficiency_bonus} · Speed {character.speed} ft · Hit Dice {character.hit_dice_current}/
        {character.hit_dice_total}
        {character.hit_dice_type}
      </div>

      {conditions.length > 0 && (
        <div className="mb-3">
          <div className="text-xs uppercase text-parchment/50 mb-1">Conditions</div>
          <div className="flex flex-wrap gap-1">
            {conditions.map((c, i) => (
              <span key={i} className="px-2 py-0.5 bg-blood/40 rounded text-xs">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasSlots && (
        <div className="mb-3">
          <div className="text-xs uppercase text-parchment/50 mb-1">Spell Slots</div>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(spellSlots).map(([lvl, s]) => (
              <span key={lvl} className="px-2 py-0.5 bg-black/30 rounded">
                Lv{lvl}: {s.current}/{s.max}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs uppercase text-parchment/50 mb-1">Inventory</div>
        {inventory.length === 0 ? (
          <p className="text-parchment/40 text-xs">Empty</p>
        ) : (
          <ul className="space-y-1">
            {inventory.map((item) => (
              <li key={item.id} className="text-xs flex justify-between gap-2">
                <span>
                  {item.name}
                  {item.quantity > 1 ? ` (x${item.quantity})` : ""}
                  {item.equipped ? " [equipped]" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
