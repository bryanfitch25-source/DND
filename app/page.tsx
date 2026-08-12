"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NarrativePanel from "@/components/NarrativePanel";
import CharacterSheet from "@/components/CharacterSheet";
import QuestLog from "@/components/QuestLog";
import CombatView from "@/components/CombatView";
import CompanionRoster from "@/components/CompanionRoster";
import RollHistory from "@/components/RollHistory";
import JournalPanel from "@/components/JournalPanel";
import WorldAtlas from "@/components/WorldAtlas";
import SettingsPanel from "@/components/SettingsPanel";
import LevelUpModal from "@/components/LevelUpModal";
import { levelForXp } from "@/lib/dnd";
import type { NarrativeLogEntry, TurnResponse } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  character_creation: "Building Character",
  active: "Campaign Active",
};

type View = "story" | "journal" | "map" | "settings";

const TABS: Array<{ key: View; label: string }> = [
  { key: "story", label: "Story" },
  { key: "journal", label: "Journal" },
  { key: "map", label: "Atlas" },
  { key: "settings", label: "Settings" },
];

export default function Home() {
  const [view, setView] = useState<View>("story");
  const [entries, setEntries] = useState<NarrativeLogEntry[]>([]);
  const [state, setState] = useState<TurnResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defeatOccurred, setDefeatOccurred] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLoading, setLevelUpLoading] = useState(false);
  const [levelUpDiff, setLevelUpDiff] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function loadState() {
    const [stateRes, narrativeRes] = await Promise.all([fetch("/api/state"), fetch("/api/narrative")]);
    const stateJson: TurnResponse = await stateRes.json();
    const narrativeJson = await narrativeRes.json();
    setState(stateJson);
    setEntries(narrativeJson.entries || []);
    setDefeatOccurred(false);
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

  // Keyboard shortcuts: "/" focuses the story input (unless already typing
  // somewhere), "Esc" is handled locally by modals that need it.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        setView("story");
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSubmit = useCallback(async (input: string): Promise<TurnResponse | null> => {
    setIsLoading(true);
    setError(null);
    setDefeatOccurred(false);

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
        return null;
      }

      setState(json);
      setDefeatOccurred(json.defeatOccurred);

      const narrativeRes = await fetch("/api/narrative");
      const narrativeJson = await narrativeRes.json();
      setEntries(narrativeJson.entries || []);

      return json;
    } catch (err) {
      setError("Network error talking to the DM. Check the server console.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function handleNewCampaign() {
    if (
      !confirm(
        "Start a brand-new campaign? Your current character and story stay saved, but the app will switch to a fresh one."
      )
    ) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await fetch("/api/session/new", { method: "POST" });
      await loadState();
      setView("story");
    } catch (err) {
      setError("Failed to start a new campaign. Check the server console.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRename(name: string) {
    const res = await fetch("/api/campaign", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (json.campaign) setState((prev) => (prev ? { ...prev, campaign: json.campaign } : prev));
  }

  async function handleModelChange(model: string | null) {
    const res = await fetch("/api/campaign", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    });
    const json = await res.json();
    if (json.campaign) setState((prev) => (prev ? { ...prev, campaign: json.campaign } : prev));
  }

  async function handleForceSummarize(): Promise<string> {
    const res = await fetch("/api/summarize", { method: "POST" });
    const json = await res.json();
    if (json.summary !== undefined) {
      setState((prev) => (prev ? { ...prev, summary: json.summary } : prev));
    }
    return json.summary || "";
  }

  async function handleLevelUp() {
    if (!state?.character) return;
    setLevelUpLoading(true);
    const prevLevel = state.character.level;
    const targetLevel = levelForXp(state.character.xp);
    const result = await handleSubmit(
      `I've earned enough XP to level up (currently ${state.character.xp} XP, level ${prevLevel}). Please walk me through leveling up to level ${targetLevel}.`
    );
    setLevelUpLoading(false);
    setShowLevelUp(false);
    if (result?.character && result.character.level > prevLevel) {
      setLevelUpDiff(
        `Leveled up to ${result.character.level}! Max HP now ${result.character.hp_max}.`
      );
      setTimeout(() => setLevelUpDiff(null), 8000);
    }
  }

  if (initializing) {
    return (
      <main className="h-screen flex items-center justify-center text-parchment/60 text-sm">
        Loading campaign…
      </main>
    );
  }

  const character = state?.character ?? null;
  const inventory = state?.inventory ?? [];
  const quests = state?.quests ?? [];
  const worldFacts = state?.worldFacts ?? [];
  const activeEncounter = state?.activeEncounter ?? null;
  const combatants = state?.combatants ?? [];
  const companions = state?.companions ?? [];
  const recentRolls = state?.recentRolls ?? [];
  const summary = state?.summary ?? "";
  const statusLabel = state ? STATUS_LABEL[state.campaign.status] || state.campaign.status : "";
  const eligibleLevel = character ? levelForXp(character.xp) : 0;
  const canLevelUp = !!character && eligibleLevel > character.level;

  return (
    <main className="h-screen grid grid-rows-[auto_1fr] bg-ink">
      <header className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-4">
          <span className="font-serif text-sm tracking-wide text-parchment">SoloDM — {state?.campaign.name}</span>
          <nav className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={`text-xs px-2.5 py-1 rounded ${
                  view === t.key
                    ? "bg-blood/40 text-parchment"
                    : "text-parchment/50 hover:text-parchment hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {canLevelUp && (
            <button
              onClick={() => setShowLevelUp(true)}
              className="text-xs px-2 py-0.5 rounded bg-green-800/60 hover:bg-green-700/60 text-parchment animate-pulse"
            >
              ⬆ Level Up Available
            </button>
          )}
          <span className="text-xs px-2 py-0.5 rounded bg-blood/30 text-parchment/80">{statusLabel}</span>
        </div>
      </header>

      <div className="grid grid-cols-[280px_1fr_280px] overflow-hidden">
        {/* Left: Character sheet */}
        <aside className="border-r border-white/10 bg-black/20 overflow-y-auto">
          <CharacterSheet character={character} inventory={inventory} />
        </aside>

        {/* Center: view content */}
        <section className="flex flex-col overflow-hidden">
          {view === "story" && (
            <>
              {activeEncounter && (
                <div className="px-6 pt-4">
                  <CombatView encounter={activeEncounter} combatants={combatants} character={character} />
                </div>
              )}
              {levelUpDiff && (
                <div className="px-6 pt-3">
                  <div className="rounded-lg border border-green-700/40 bg-green-900/20 px-3 py-2 text-xs text-parchment/90">
                    {levelUpDiff}
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <NarrativePanel
                  entries={entries}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  defeatOccurred={defeatOccurred}
                  characterExists={!!character}
                  error={error}
                  summary={summary}
                  inputRef={inputRef}
                />
              </div>
            </>
          )}
          {view === "journal" && <JournalPanel entries={entries} summary={summary} />}
          {view === "map" && <WorldAtlas worldFacts={worldFacts} />}
          {view === "settings" && state && (
            <SettingsPanel
              campaign={state.campaign}
              onRename={handleRename}
              onModelChange={handleModelChange}
              onForceSummarize={handleForceSummarize}
              onNewCampaign={handleNewCampaign}
            />
          )}
        </section>

        {/* Right: quests, companions, roll history */}
        <aside className="border-l border-white/10 bg-black/20 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <QuestLog quests={quests} />
            <CompanionRoster companions={companions} />
          </div>
          <RollHistory rolls={recentRolls} />
        </aside>
      </div>

      {showLevelUp && character && (
        <LevelUpModal
          character={character}
          targetLevel={eligibleLevel}
          onConfirm={handleLevelUp}
          onClose={() => setShowLevelUp(false)}
          isLoading={levelUpLoading}
        />
      )}
    </main>
  );
}
