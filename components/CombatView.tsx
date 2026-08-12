"use client";

import type { CombatEncounter, CombatParticipant, Character } from "@/types";
import CombatGrid from "./CombatGrid";

function safeConditions(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default function CombatView({
  encounter,
  combatants,
  character,
}: {
  encounter: CombatEncounter;
  combatants: CombatParticipant[];
  character?: Character | null;
}) {
  const active = combatants[encounter.current_turn_index];

  return (
    <div className="border-2 border-blood bg-blood/10 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-serif text-blood tracking-wide">⚔ COMBAT — Round {encounter.round_number}</h2>
        {encounter.description && <span className="text-xs text-parchment/60">{encounter.description}</span>}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
        <div className="space-y-1">
          {combatants.map((c, idx) => {
            const isActive = idx === encounter.current_turn_index;
            const conditions = safeConditions(c.conditions);
            const hpPct = c.hp_max > 0 ? Math.max(0, Math.min(100, (c.hp_current / c.hp_max) * 100)) : 0;
            return (
              <div
                key={c.id}
                className={`flex items-center gap-3 rounded px-2 py-1.5 ${
                  isActive ? "bg-blood/40 ring-1 ring-blood" : "bg-black/30"
                } ${c.is_defeated ? "opacity-40" : ""}`}
              >
                <span className="w-6 text-right text-xs text-parchment/50">{c.initiative}</span>
                <span className="w-40 truncate text-sm">
                  {isActive ? "▶ " : ""}
                  {c.name}
                  {c.is_pc ? " (You)" : c.is_companion ? " (Ally)" : ""}
                </span>
                <div className="flex-1 h-2 bg-black/40 rounded overflow-hidden max-w-[140px]">
                  <div
                    className={`h-full ${hpPct > 50 ? "bg-green-700" : hpPct > 20 ? "bg-yellow-600" : "bg-blood"}`}
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
                <span className="text-xs w-16 text-parchment/70">
                  {c.hp_current}/{c.hp_max} HP
                </span>
                <span className="text-xs w-10 text-parchment/50">AC {c.ac}</span>
                {conditions.length > 0 && (
                  <span className="text-[10px] text-blood/90">{conditions.join(", ")}</span>
                )}
                {c.is_defeated ? <span className="text-[10px] uppercase text-parchment/40">down</span> : null}
              </div>
            );
          })}
        </div>
        <CombatGrid encounter={encounter} combatants={combatants} character={character} />
      </div>

      {active && (
        <p className="text-xs text-parchment/60 mt-2">
          Current turn: <span className="font-medium">{active.name}</span>
        </p>
      )}
    </div>
  );
}
