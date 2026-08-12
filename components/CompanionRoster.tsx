"use client";

import type { Companion } from "@/types";

export default function CompanionRoster({ companions }: { companions: Companion[] }) {
  if (companions.length === 0) return null;

  return (
    <div className="p-4 text-xl border-t border-gold/15">
      <h2 className="text-lg uppercase tracking-widest text-gold/70 mb-2 pb-1 border-b border-gold/15">
        Companions
      </h2>
      <ul className="space-y-2">
        {companions.map((c) => {
          const hpPct = c.hp_max > 0 ? Math.max(0, Math.min(100, (c.hp_current / c.hp_max) * 100)) : 0;
          return (
            <li key={c.id} className="panel rounded p-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-lg text-parchment">{c.name}</span>
                <span className="text-base text-parchment/50">AC {c.ac}</span>
              </div>
              <div className="h-1.5 bg-ink-900/60 rounded overflow-hidden my-1 border border-black/40">
                <div
                  className={`h-full ${hpPct > 50 ? "bg-green-700" : hpPct > 20 ? "bg-yellow-600" : "bg-blood"}`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <div className="text-base text-parchment/50">
                {c.hp_current}/{c.hp_max} HP
              </div>
              {c.description && <p className="text-lg text-parchment/60 mt-1">{c.description}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
