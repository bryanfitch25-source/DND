"use client";

import { useMemo, useState } from "react";
import type { NarrativeLogEntry } from "@/types";

export default function JournalPanel({ entries, summary }: { entries: NarrativeLogEntry[]; summary: string }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const needle = query.toLowerCase();
    return entries.filter((e) => e.content.toLowerCase().includes(needle));
  }, [entries, query]);

  return (
    <div className="p-6 h-full overflow-y-auto max-w-3xl mx-auto">
      <h2 className="text-lg font-serif text-parchment mb-4">Journal</h2>

      {summary && (
        <div className="mb-6 rounded-lg border border-white/10 bg-black/30 p-4">
          <h3 className="text-xs uppercase text-parchment/50 mb-2">Story So Far</h3>
          <p className="text-sm text-parchment/80 whitespace-pre-wrap leading-relaxed">{summary}</p>
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search the full transcript…"
        className="w-full mb-4 rounded bg-black/40 border border-white/10 px-3 py-2 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-1 focus:ring-blood"
      />

      {entries.length === 0 ? (
        <p className="text-sm text-parchment/40">Nothing recorded yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-parchment/40">No entries match &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div key={e.id} className={e.role === "player" ? "text-right" : "text-left"}>
              <div className="text-[10px] text-parchment/30 mb-0.5">Turn {e.turn_number}</div>
              <div
                className={`inline-block max-w-xl text-left rounded-lg px-3 py-2 whitespace-pre-wrap leading-relaxed text-sm ${
                  e.role === "player" ? "bg-blood/20 text-parchment" : "bg-black/30 text-parchment/90 font-serif"
                }`}
              >
                {e.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
