"use client";

import type { Quest, WorldFact } from "@/types";

const CATEGORY_LABEL: Record<string, string> = {
  npc: "NPCs",
  location: "Locations",
  faction: "Factions",
  lore: "Lore",
  item: "Items",
  event: "Events",
};

export default function QuestLog({ quests, worldFacts }: { quests: Quest[]; worldFacts: WorldFact[] }) {
  const active = quests.filter((q) => q.status === "active");
  const other = quests.filter((q) => q.status !== "active");

  const factsByCategory: Record<string, WorldFact[]> = {};
  for (const f of worldFacts) {
    factsByCategory[f.category] = factsByCategory[f.category] || [];
    factsByCategory[f.category].push(f);
  }

  return (
    <div className="p-4 text-sm overflow-y-auto h-full">
      <h2 className="text-lg font-serif text-parchment mb-2">Quest &amp; Plot Log</h2>

      <div className="mb-4">
        <div className="text-xs uppercase text-parchment/50 mb-1">Active Threads</div>
        {active.length === 0 ? (
          <p className="text-parchment/40 text-xs">No active threads yet.</p>
        ) : (
          <ul className="space-y-2">
            {active.map((q) => (
              <li key={q.id} className="bg-black/30 rounded p-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium">{q.title}</span>
                  <span className="text-[10px] uppercase text-parchment/40">{q.category}</span>
                </div>
                {q.description && <p className="text-xs text-parchment/60 mt-1">{q.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {other.length > 0 && (
        <div className="mb-4">
          <div className="text-xs uppercase text-parchment/50 mb-1">Resolved</div>
          <ul className="space-y-1">
            {other.map((q) => (
              <li key={q.id} className="text-xs text-parchment/50 flex justify-between">
                <span className={q.status === "completed" ? "line-through" : ""}>{q.title}</span>
                <span className="uppercase text-[10px]">{q.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {Object.entries(factsByCategory).map(([category, facts]) => (
        <div key={category} className="mb-4">
          <div className="text-xs uppercase text-parchment/50 mb-1">
            {CATEGORY_LABEL[category] || category}
          </div>
          <ul className="space-y-2">
            {facts.map((f) => (
              <li key={f.id} className="bg-black/20 rounded p-2">
                <div className="font-medium text-xs">{f.title}</div>
                <p className="text-xs text-parchment/60 mt-1">{f.content}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {worldFacts.length === 0 && (
        <p className="text-parchment/40 text-xs">No NPCs, locations, or factions discovered yet.</p>
      )}
    </div>
  );
}
