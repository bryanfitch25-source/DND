"use client";

import { useMemo, useState } from "react";
import type { WorldFact } from "@/types";

const CATEGORY_LABEL: Record<string, string> = {
  npc: "NPCs",
  location: "Locations",
  faction: "Factions",
  lore: "Lore",
  item: "Items",
  event: "Events",
};

const CATEGORY_ORDER = ["location", "npc", "faction", "event", "item", "lore"];

function tagList(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function WorldAtlas({ worldFacts }: { worldFacts: WorldFact[] }) {
  const [query, setQuery] = useState("");
  const [linkedTo, setLinkedTo] = useState<WorldFact | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return worldFacts;
    const needle = query.toLowerCase();
    return worldFacts.filter(
      (f) =>
        f.title.toLowerCase().includes(needle) ||
        f.content.toLowerCase().includes(needle) ||
        f.tags.toLowerCase().includes(needle)
    );
  }, [worldFacts, query]);

  const related = useMemo(() => {
    if (!linkedTo) return [];
    const myTags = new Set(tagList(linkedTo.tags).map((t) => t.toLowerCase()));
    if (myTags.size === 0) return [];
    return worldFacts.filter((f) => {
      if (f.id === linkedTo.id) return false;
      return tagList(f.tags).some((t) => myTags.has(t.toLowerCase()));
    });
  }, [linkedTo, worldFacts]);

  const byCategory: Record<string, WorldFact[]> = {};
  for (const f of filtered) {
    byCategory[f.category] = byCategory[f.category] || [];
    byCategory[f.category].push(f);
  }

  if (worldFacts.length === 0) {
    return (
      <div className="p-6 text-xl text-parchment/50">
        No NPCs, locations, or factions discovered yet. They&apos;ll appear here as the DM establishes them.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h2 className="font-display text-3xl text-gold-bright">World Atlas</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the world…"
          className="rounded bg-ink-900/60 border border-gold/20 px-3 py-1.5 text-xl text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-1 focus:ring-gold w-full sm:w-64"
        />
      </div>

      {linkedTo && (
        <div className="mb-4 rounded-lg border border-scarlight/40 bg-scarlight-dim/15 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xl font-medium text-parchment">Related to &ldquo;{linkedTo.title}&rdquo;</span>
            <button onClick={() => setLinkedTo(null)} className="text-parchment/40 hover:text-parchment/80 text-lg">
              ✕ clear
            </button>
          </div>
          {related.length === 0 ? (
            <p className="text-lg text-parchment/50">No other facts share a tag with this one.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <span key={r.id} className="text-lg px-2 py-1 bg-ink-900/50 rounded">
                  {r.title} <span className="text-parchment/40">({CATEGORY_LABEL[r.category] || r.category})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map((category) => (
        <div key={category} className="mb-6">
          <h3 className="text-lg uppercase tracking-widest text-gold/70 mb-2 pb-1 border-b border-gold/15">
            {CATEGORY_LABEL[category] || category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {byCategory[category].map((f) => (
              <button
                key={f.id}
                onClick={() => setLinkedTo(f)}
                className="text-left panel hover:border-gold/30 rounded-lg p-3 transition-colors"
              >
                <div className="font-medium text-xl text-parchment mb-1">{f.title}</div>
                <p className="text-lg text-parchment/60 line-clamp-3">{f.content}</p>
                {tagList(f.tags).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tagList(f.tags).map((t, i) => (
                      <span key={i} className="text-base px-1.5 py-0.5 bg-white/5 rounded text-parchment/40">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && <p className="text-xl text-parchment/40">No facts match &ldquo;{query}&rdquo;.</p>}
    </div>
  );
}
