"use client";

import type { Quest } from "@/types";

export default function QuestLog({ quests }: { quests: Quest[] }) {
  const active = quests.filter((q) => q.status === "active");
  const other = quests.filter((q) => q.status !== "active");

  return (
    <div className="p-4 text-sm">
      <h2 className="text-lg font-serif text-parchment mb-2">Quest Log</h2>

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
        <div>
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
    </div>
  );
}
