"use client";

import { useMemo, useState } from "react";
import type { CombatEncounter, CombatParticipant, Character, TerrainMarker } from "@/types";
import { safeParseArray } from "@/lib/dnd";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function tokenColor(c: CombatParticipant): string {
  if (c.is_defeated) return "bg-black/40 text-parchment/30 border-white/10";
  if (c.is_pc) return "bg-blood text-parchment border-blood/60";
  if (c.is_companion) return "bg-sky-800 text-parchment border-sky-500/60";
  return "bg-zinc-700 text-parchment border-zinc-400/40";
}

function terrainStyle(type: TerrainMarker["type"]): string {
  if (type === "wall") return "bg-zinc-950/80 border border-zinc-600/40";
  if (type === "cover") return "bg-green-950/50 border border-green-700/30";
  return "bg-yellow-950/40 border border-yellow-700/20"; // difficult
}

function terrainGlyph(type: TerrainMarker["type"]): string {
  if (type === "wall") return "▓";
  if (type === "cover") return "◆";
  return "≈";
}

function parseTerrain(json: string): TerrainMarker[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const CELL_SIZE = 34;

export default function CombatGrid({
  encounter,
  combatants,
  character,
}: {
  encounter: CombatEncounter;
  combatants: CombatParticipant[];
  character?: Character | null;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeId = combatants[encounter.current_turn_index]?.id;
  const width = Math.max(1, encounter.grid_width);
  const height = Math.max(1, encounter.grid_height);
  const terrain = useMemo(() => parseTerrain(encounter.terrain), [encounter.terrain]);

  const selected = combatants.find((c) => c.id === selectedId) || null;
  const canShowRange = !!(selected && selected.is_pc && selected.id === activeId && character);
  const rangeSquares = canShowRange ? Math.floor((character!.speed || 30) / 5) : 0;

  const reachableCells = useMemo(() => {
    if (!canShowRange || !selected) return new Set<string>();
    const cells = new Set<string>();
    for (let dx = -rangeSquares; dx <= rangeSquares; dx++) {
      for (let dy = -rangeSquares; dy <= rangeSquares; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) > rangeSquares) continue;
        const gx = selected.x + dx;
        const gy = selected.y + dy;
        if (gx < 0 || gy < 0 || gx >= width || gy >= height) continue;
        cells.add(`${gx},${gy}`);
      }
    }
    return cells;
  }, [canShowRange, selected, rangeSquares, width, height]);

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-2">
      <div className="overflow-auto">
        <div
          className="relative"
          style={{
            width: width * CELL_SIZE,
            height: height * CELL_SIZE,
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
        >
          {canShowRange &&
            Array.from(reachableCells).map((key) => {
              const [gx, gy] = key.split(",").map(Number);
              return (
                <div
                  key={key}
                  className="absolute bg-green-500/10 border border-green-500/20"
                  style={{ width: CELL_SIZE, height: CELL_SIZE, left: gx * CELL_SIZE, top: gy * CELL_SIZE }}
                />
              );
            })}

          {terrain.map((t, i) => (
            <div
              key={i}
              title={t.type}
              className={`absolute flex items-center justify-center text-xs ${terrainStyle(t.type)}`}
              style={{ width: CELL_SIZE, height: CELL_SIZE, left: t.x * CELL_SIZE, top: t.y * CELL_SIZE }}
            >
              {terrainGlyph(t.type)}
            </div>
          ))}

          {combatants.map((c) => {
            const hpPct = c.hp_max > 0 ? Math.max(0, Math.min(100, (c.hp_current / c.hp_max) * 100)) : 0;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                title={`${c.name} — ${c.hp_current}/${c.hp_max} HP, AC ${c.ac}`}
                className={`absolute flex flex-col items-center justify-center rounded-full border-2 text-[10px] font-semibold leading-none transition-all duration-300 cursor-pointer ${tokenColor(
                  c
                )} ${c.id === activeId ? "ring-2 ring-parchment ring-offset-1 ring-offset-black" : ""} ${
                  c.id === selectedId ? "scale-110 z-10" : ""
                }`}
                style={{
                  width: CELL_SIZE - 6,
                  height: CELL_SIZE - 6,
                  left: c.x * CELL_SIZE + 3,
                  top: c.y * CELL_SIZE + 3,
                }}
              >
                <span>{initials(c.name)}</span>
                <div className="mt-0.5 h-0.5 w-4/5 overflow-hidden rounded bg-black/50">
                  <div
                    className={`h-full ${hpPct > 50 ? "bg-green-500" : hpPct > 20 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="mt-2 rounded-md border border-white/10 bg-black/40 p-2 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-parchment">
              {selected.name}
              {selected.is_pc ? " (You)" : selected.is_companion ? " (Ally)" : ""}
            </span>
            <button onClick={() => setSelectedId(null)} className="text-parchment/40 hover:text-parchment/80">
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-parchment/70">
            <span>HP {selected.hp_current}/{selected.hp_max}</span>
            <span>AC {selected.ac}</span>
            <span>Init {selected.initiative}</span>
            <span>Pos ({selected.x}, {selected.y})</span>
            {selected.is_defeated && <span className="text-parchment/40 uppercase">down</span>}
          </div>
          {safeParseArray(selected.conditions).length > 0 && (
            <div className="mt-1 text-blood/90">{safeParseArray(selected.conditions).join(", ")}</div>
          )}
          {selected.notes && <div className="mt-1 text-parchment/50 italic">{selected.notes}</div>}
        </div>
      )}
    </div>
  );
}
