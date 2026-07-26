"use client";

import { useEffect, useState } from "react";
import NarrativePanel from "@/components/NarrativePanel";
import CharacterSheet from "@/components/CharacterSheet";
import QuestLog from "@/components/QuestLog";
import CombatView from "@/components/CombatView";
import type { NarrativeLogEntry, TurnResponse } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  character_creation: "Building Character",
  active: "Session Active",
  completed: "Session Complete",
};

export default function Home() {
  const [entries, setEntries] = useState<NarrativeLogEntry[]>([]);
  const [state, setState] = useState<TurnResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingDeathDecision, setAwaitingDeathDecision] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [initializing, setInitializing] = useState(true);

  async function loadState() {
    const [stateRes, narrativeRes] = await Promise.all([
      fetch("/api/state"),
      fetch("/api/narrative"),
    ]);
    const stateJson: TurnResponse = await stateRes.json();
    const narrativeJson = await narrativeRes.json();
    setState(stateJson);
    setEntries(narrativeJson.entries || []);
    setSessionComplete(!!stateJson.sessionComplete);
    setAwaitingDeathDecision(false);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadState();
      } catch (err) {
        setError("Failed to load session state. Is the dev server running correctly?");
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  async function handleSubmit(input: string) {
    setIsLoading(true);
    setError(null);
    setAwaitingDeathDecision(false);

    // Optimistically show the player's message immediately.
    setEntries((prev) => [
      ...prev,
      {
        id: Date.now(),
        campaign_id: 0,
        turn_number: 0,
        role: "player",
        content: input,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const json: TurnResponse = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || "Something went wrong processing that turn.");
        setIsLoading(false);
        return;
      }

      setState(json);
      setAwaitingDeathDecision(json.awaitingDeathDecision);
      setSessionComplete(json.sessionComplete);

      // Re-fetch the authoritative narrative log so ids/turn numbers line up.
      const narrativeRes = await fetch("/api/narrative");
      const narrativeJson = await narrativeRes.json();
      setEntries(narrativeJson.entries || []);
    } catch (err) {
      setError("Network error talking to the DM. Check the server console.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleNewSession() {
    setIsLoading(true);
    setError(null);
    try {
      await fetch("/api/session/new", { method: "POST" });
      await loadState();
    } catch (err) {
      setError("Failed to start a new oneshot. Check the server console.");
    } finally {
      setIsLoading(false);
    }
  }

  if (initializing) {
    return (
      <main className="h-screen flex items-center justify-center text-parchment/60 text-sm">
        Loading session…
      </main>
    );
  }

  const character = state?.character ?? null;
  const inventory = state?.inventory ?? [];
  const quests = state?.quests ?? [];
  const worldFacts = state?.worldFacts ?? [];
  const activeEncounter = state?.activeEncounter ?? null;
  const combatants = state?.combatants ?? [];
  const statusLabel = state ? STATUS_LABEL[state.campaign.status] || state.campaign.status : "";

  return (
    <main className="h-screen grid grid-rows-[auto_1fr] bg-ink">
      <header className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30">
        <span className="font-serif text-sm tracking-wide text-parchment">SoloDM — Oneshot</span>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            sessionComplete ? "bg-parchment/20 text-parchment" : "bg-blood/30 text-parchment/80"
          }`}
        >
          {statusLabel}
        </span>
      </header>

      <div className="grid grid-cols-[280px_1fr_300px] overflow-hidden">
        {/* Left: Character sheet */}
        <aside className="border-r border-white/10 bg-black/20 overflow-hidden">
          <CharacterSheet character={character} inventory={inventory} />
        </aside>

        {/* Center: narrative + combat */}
        <section className="flex flex-col overflow-hidden">
          {activeEncounter && (
            <div className="px-6 pt-4">
              <CombatView encounter={activeEncounter} combatants={combatants} />
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <NarrativePanel
              entries={entries}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              awaitingDeathDecision={awaitingDeathDecision}
              sessionComplete={sessionComplete}
              onNewSession={handleNewSession}
              characterExists={!!character}
              error={error}
            />
          </div>
        </section>

        {/* Right: quest/plot log */}
        <aside className="border-l border-white/10 bg-black/20 overflow-hidden">
          <QuestLog quests={quests} worldFacts={worldFacts} />
        </aside>
      </div>
    </main>
  );
}
