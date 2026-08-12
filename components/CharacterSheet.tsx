"use client";

import { useState } from "react";
import type { Character, InventoryItem } from "@/types";
import { ABILITIES, SKILLS, abilityMod, fmtMod, safeParseArray, safeParseSlots } from "@/lib/dnd";

type Section = "abilities" | "skills" | "attacks" | "spells" | "inventory";

export default function CharacterSheet({
  character,
  inventory,
}: {
  character: Character | null;
  inventory: InventoryItem[];
}) {
  const [open, setOpen] = useState<Record<Section, boolean>>({
    abilities: true,
    skills: false,
    attacks: false,
    spells: false,
    inventory: true,
  });

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
  const knownSpells = safeParseArray(character.known_spells);
  const features = safeParseArray(character.features);
  const savingThrowProfs = new Set(safeParseArray(character.saving_throw_proficiencies));
  const skillProfs = new Set(safeParseArray(character.skill_proficiencies));
  const hasSlots = Object.keys(spellSlots).length > 0;
  const equippedWeapons = inventory.filter((i) => i.category === "weapon" && i.equipped);

  const hpPct = character.hp_max > 0 ? Math.max(0, Math.min(100, (character.hp_current / character.hp_max) * 100)) : 0;

  const strMod = abilityMod(character.str);
  const dexMod = abilityMod(character.dex);
  const meleeBonus = strMod + character.proficiency_bonus;
  const finesseBonus = Math.max(strMod, dexMod) + character.proficiency_bonus;
  const rangedBonus = dexMod + character.proficiency_bonus;

  function toggle(section: Section) {
    setOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  }

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
        <div className="flex justify-between text-[11px] text-parchment/50 mt-1">
          <span>XP {character.xp}</span>
          <span>Prof. {fmtMod(character.proficiency_bonus)}</span>
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

      <SectionHeader label="Abilities & Saves" open={open.abilities} onToggle={() => toggle("abilities")} />
      {open.abilities && (
        <div className="mb-3">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {ABILITIES.map(({ key, label }) => (
              <div key={key} className="bg-black/30 rounded p-2 text-center">
                <div className="text-[10px] text-parchment/50">{label}</div>
                <div className="font-semibold">{character[key] as number}</div>
                <div className="text-xs text-parchment/60">{fmtMod(abilityMod(character[key] as number))}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
            {ABILITIES.map(({ key, label }) => {
              const prof = savingThrowProfs.has(key);
              const mod = abilityMod(character[key] as number) + (prof ? character.proficiency_bonus : 0);
              return (
                <div key={key} className={`flex items-center gap-1 ${prof ? "text-parchment" : "text-parchment/50"}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${prof ? "bg-blood" : "bg-white/20"}`} />
                  {label} {fmtMod(mod)}
                </div>
              );
            })}
          </div>
          <div className="text-xs text-parchment/70 mt-2">
            Speed {character.speed} ft · Hit Dice {character.hit_dice_current}/{character.hit_dice_total}
            {character.hit_dice_type}
          </div>
        </div>
      )}

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

      <SectionHeader label="Skills" open={open.skills} onToggle={() => toggle("skills")} />
      {open.skills && (
        <div className="mb-3 grid grid-cols-1 gap-0.5 text-xs">
          {SKILLS.map(({ key, label, ability }) => {
            const prof = skillProfs.has(key);
            const mod = abilityMod(character[ability] as number) + (prof ? character.proficiency_bonus : 0);
            return (
              <div key={key} className={`flex items-center justify-between px-1 py-0.5 rounded ${prof ? "bg-black/20" : ""}`}>
                <span className={`flex items-center gap-1 ${prof ? "text-parchment" : "text-parchment/50"}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${prof ? "bg-blood" : "bg-white/20"}`} />
                  {label}
                  <span className="text-[9px] uppercase text-parchment/30">({ability})</span>
                </span>
                <span>{fmtMod(mod)}</span>
              </div>
            );
          })}
        </div>
      )}

      <SectionHeader label="Attacks" open={open.attacks} onToggle={() => toggle("attacks")} />
      {open.attacks && (
        <div className="mb-3 text-xs">
          <div className="grid grid-cols-3 gap-1 mb-2 text-center">
            <div className="bg-black/30 rounded p-1.5">
              <div className="text-[9px] text-parchment/50">MELEE</div>
              <div className="font-semibold">{fmtMod(meleeBonus)}</div>
            </div>
            <div className="bg-black/30 rounded p-1.5">
              <div className="text-[9px] text-parchment/50">FINESSE</div>
              <div className="font-semibold">{fmtMod(finesseBonus)}</div>
            </div>
            <div className="bg-black/30 rounded p-1.5">
              <div className="text-[9px] text-parchment/50">RANGED</div>
              <div className="font-semibold">{fmtMod(rangedBonus)}</div>
            </div>
          </div>
          {equippedWeapons.length === 0 ? (
            <p className="text-parchment/40">No weapons equipped.</p>
          ) : (
            <ul className="space-y-1">
              {equippedWeapons.map((w) => (
                <li key={w.id} className="flex justify-between">
                  <span>{w.name}</span>
                  <span className="text-parchment/50">{w.description || "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(hasSlots || knownSpells.length > 0) && (
        <>
          <SectionHeader label="Spells" open={open.spells} onToggle={() => toggle("spells")} />
          {open.spells && (
            <div className="mb-3">
              {hasSlots && (
                <div className="flex flex-wrap gap-2 text-xs mb-2">
                  {Object.entries(spellSlots).map(([lvl, s]) => (
                    <span key={lvl} className="px-2 py-0.5 bg-black/30 rounded">
                      Lv{lvl}: {s.current}/{s.max}
                    </span>
                  ))}
                </div>
              )}
              {knownSpells.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {knownSpells.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-black/20 rounded text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {features.length > 0 && (
        <div className="mb-3">
          <div className="text-xs uppercase text-parchment/50 mb-1">Features</div>
          <ul className="space-y-1 text-xs text-parchment/70">
            {features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <SectionHeader label="Inventory" open={open.inventory} onToggle={() => toggle("inventory")} />
      {open.inventory && (
        <div>
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
      )}
    </div>
  );
}

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between text-xs uppercase text-parchment/50 mb-1 hover:text-parchment/80"
    >
      <span>{label}</span>
      <span>{open ? "−" : "+"}</span>
    </button>
  );
}
