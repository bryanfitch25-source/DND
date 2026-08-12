"use client";

import type { Companion } from "@/types";

export default function CompanionRoster({ companions }: { companions: Companion[] }) {
  if (companions.length === 0) return null;

  return (
    <div className="p-4 text-sm border-t border-white/10">
      <h2 className="text-xs uppercase text-parchment/50 mb-2">Companions</h2>
      <ul className="space-y-2">
        {companions.map((c) => {
          const hpPct = c.hp_max > 0 ? Math.max(0, Math.min(100, (c.hp_current / c.hp_max) * 100)) : 0;
          return (
            <li key={c.id} className="bg-black/30 rounded p-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs">{c.name}</span>
                <span className="text-[10px] text-parchment/50">AC {c.ac}</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded overflow-hidden my-1">
                <div
                  className={`h-full ${hpPct > 50 ? "bg-green-700" : hpPct > 20 ? "bg-yellow-600" : "bg-blood"}`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <div className="text-[10px] text-parchment/50">
                {c.hp_current}/{c.hp_max} HP
              </div>
              {c.description && <p className="text-[11px] text-parchment/60 mt-1">{c.description}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
