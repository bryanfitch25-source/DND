"use client";

import { useMemo, useState } from "react";
import type { RollLogEntry } from "@/types";

export default function RollHistory({ rolls }: { rolls: RollLogEntry[] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const list = [...rolls].reverse();
    if (!filter.trim()) return list;
    const needle = filter.toLowerCase();
    return list.filter((r) => r.purpose.toLowerCase().includes(needle) || r.expression.toLowerCase().includes(needle));
  }, [rolls, filter]);

  if (rolls.length === 0) return null;

  return (
    <div className="border-t border-white/10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase text-parchment/50 hover:text-parchment/80"
      >
        <span>Roll History ({rolls.length})</span>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by purpose or expression…"
            className="w-full mb-2 rounded bg-black/40 border border-white/10 px-2 py-1 text-xs text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-1 focus:ring-blood"
          />
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {filtered.map((r) => (
              <li key={r.id} className="text-xs flex justify-between gap-2 bg-black/20 rounded px-2 py-1">
                <span className="text-parchment/70 truncate">{r.purpose || r.expression}</span>
                <span className="text-parchment/40 shrink-0">{r.breakdown}</span>
              </li>
            ))}
            {filtered.length === 0 && <li className="text-parchment/30 text-xs">No matching rolls.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
