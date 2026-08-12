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
    <div className="border-2 border-blood/70 bg-blood/10 rounded-lg p-3 md:p-4 mb-4 shadow-glow-blood">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
        <h2 className="font-display text-2xl md:text-3xl text-blood-light tracking-wide">
          ⚔ Combat — Round {encounter.round_number}
        </h2>
        {encounter.description && <span className="text-lg text-parchment/60">{encounter.description}</span>}
      </div>

      <div className="flex flex-col md:grid md:grid-cols-[1fr_auto] gap-4 items-start">
        <div className="space-y-1 w-full min-w-0">
          {combatants.map((c, idx) => {
            const isActive = idx === encounter.current_turn_index;
            const conditions = safeConditions(c.conditions);
            const hpPct = c.hp_max > 0 ? Math.max(0, Math.min(100, (c.hp_current / c.hp_max) * 100)) : 0;
            return (
              <div
                key={c.id}
                className={`flex items-center gap-2 md:gap-3 rounded px-2 py-1.5 text-lg md:text-xl ${
                  isActive ? "bg-blood/40 ring-1 ring-blood" : "bg-ink-900/40"
                } ${c.is_defeated ? "opacity-40" : ""}`}
              >
                <span className="w-5 text-right text-base md:text-lg text-parchment/50 shrink-0">{c.initiative}</span>
                <span className="flex-1 min-w-0 truncate">
                  {isActive ? "▶ " : ""}
                  {c.name}
                  {c.is_pc ? " (You)" : c.is_companion ? " (Ally)" : ""}
                </span>
                <div className="hidden sm:block w-16 md:w-24 h-2 bg-ink-900/60 rounded overflow-hidden shrink-0 border border-black/40">
                  <div
                    className={`h-full ${hpPct > 50 ? "bg-green-700" : hpPct > 20 ? "bg-yellow-600" : "bg-blood"}`}
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
                <span className="text-base md:text-lg text-parchment/70 shrink-0">
                  {c.hp_current}/{c.hp_max}
                </span>
                <span className="hidden sm:inline text-base md:text-lg text-parchment/50 shrink-0">AC {c.ac}</span>
                {conditions.length > 0 && (
                  <span className="hidden md:inline text-base text-blood-light/90 shrink-0">{conditions.join(", ")}</span>
                )}
                {c.is_defeated ? <span className="text-base uppercase text-parchment/40 shrink-0">down</span> : null}
              </div>
            );
          })}
        </div>
        <CombatGrid encounter={encounter} combatants={combatants} character={character} />
      </div>

      {active && (
        <p className="text-lg text-parchment/60 mt-2">
          Current turn: <span className="font-medium text-scarlight-soft">{active.name}</span>
        </p>
      )}
    </div>
  );
}
