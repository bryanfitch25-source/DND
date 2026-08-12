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
    <div className="p-4 md:p-6 h-full overflow-y-auto max-w-3xl mx-auto">
      <h2 className="font-display text-3xl text-gold-bright mb-4">Journal</h2>

      {summary && (
        <div className="mb-6 panel rounded-lg p-4">
          <h3 className="text-lg uppercase tracking-widest text-gold/70 mb-2">Story So Far</h3>
          <p className="text-xl text-parchment/80 whitespace-pre-wrap leading-relaxed font-body">{summary}</p>
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search the full transcript…"
        className="w-full mb-4 rounded bg-ink-900/60 border border-gold/20 px-3 py-2 text-xl text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-1 focus:ring-gold"
      />

      {entries.length === 0 ? (
        <p className="text-xl text-parchment/40">Nothing recorded yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-xl text-parchment/40">No entries match &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div key={e.id} className={e.role === "player" ? "text-right" : "text-left"}>
              <div className="text-base text-parchment/30 mb-0.5">Turn {e.turn_number}</div>
              <div
                className={`inline-block max-w-[90%] md:max-w-xl text-left rounded-lg px-3 py-2 whitespace-pre-wrap leading-relaxed text-xl ${
                  e.role === "player"
                    ? "bg-blood/20 border border-blood-light/15 text-parchment"
                    : "bg-ink-800/60 border-l-2 border-gold/25 text-parchment/90 font-body"
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
