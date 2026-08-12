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
import Drawer from "@/components/Drawer";
import { IconShield, IconScroll, IconFlame, IconBook, IconMap, IconGear } from "@/components/Icons";
import { levelForXp } from "@/lib/dnd";
import type { NarrativeLogEntry, TurnResponse } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  character_creation: "Building Character",
  active: "Campaign Active",
};

type View = "story" | "journal" | "map" | "settings";

const TABS: Array<{ key: View; label: string; Icon: typeof IconFlame }> = [
  { key: "story", label: "Story", Icon: IconFlame },
  { key: "journal", label: "Journal", Icon: IconBook },
  { key: "map", label: "Atlas", Icon: IconMap },
  { key: "settings", label: "Settings", Icon: IconGear },
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
  const [charDrawerOpen, setCharDrawerOpen] = useState(false);
  const [questDrawerOpen, setQuestDrawerOpen] = useState(false);
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
  // somewhere), "Esc" is handled locally by modals/drawers that need it.
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
      setLevelUpDiff(`Leveled up to ${result.character.level}! Max HP now ${result.character.hp_max}.`);
      setTimeout(() => setLevelUpDiff(null), 8000);
    }
  }

  if (initializing) {
    return (
      <main className="h-screen flex items-center justify-center text-parchment/60 text-sm font-display tracking-widest uppercase">
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

  const questSidebar = (
    <>
      <QuestLog quests={quests} />
      <CompanionRoster companions={companions} />
      <RollHistory rolls={recentRolls} />
    </>
  );

  return (
    <main className="h-[100dvh] grid grid-rows-[auto_1fr_auto] md:grid-rows-[auto_1fr] bg-ink-900">
      <header className="flex items-center justify-between gap-2 px-3 md:px-4 py-2 pt-safe border-b border-gold/15 bg-ink-800/80 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setCharDrawerOpen(true)}
            className="md:hidden w-11 h-11 shrink-0 flex items-center justify-center rounded-full border border-gold/25 text-gold-bright"
            aria-label="Open character sheet"
          >
            <IconShield className="w-5 h-5" />
          </button>
          <span className="font-display text-sm md:text-base tracking-wide text-parchment truncate">
            <span className="text-gold-bright">SoloDM</span>
            <span className="hidden sm:inline"> — {state?.campaign.name}</span>
          </span>
          <nav className="hidden md:flex gap-1 ml-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                  view === t.key
                    ? "bg-blood/40 text-parchment shadow-glow-blood"
                    : "text-parchment/50 hover:text-parchment hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canLevelUp && (
            <button
              onClick={() => setShowLevelUp(true)}
              className="text-xs px-2 py-1 rounded border border-scarlight/50 text-scarlight-soft shadow-glow animate-pulse"
            >
              <span className="hidden sm:inline">⬆ Level Up Available</span>
              <span className="sm:hidden">⬆</span>
            </button>
          )}
          <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded bg-blood/25 text-parchment/80 border border-blood/30">
            {statusLabel}
          </span>
          <button
            onClick={() => setQuestDrawerOpen(true)}
            className="md:hidden w-11 h-11 shrink-0 flex items-center justify-center rounded-full border border-gold/25 text-gold-bright"
            aria-label="Open quest log"
          >
            <IconScroll className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-[280px_1fr_280px] overflow-hidden">
        {/* Left: Character sheet (desktop static, mobile drawer) */}
        <aside className="hidden md:block border-r border-gold/10 bg-ink-800/60 overflow-y-auto">
          <CharacterSheet character={character} inventory={inventory} />
        </aside>

        {/* Center: view content */}
        <section className="flex flex-col overflow-hidden">
          {view === "story" && (
            <>
              {activeEncounter && (
                <div className="px-3 md:px-6 pt-3 md:pt-4">
                  <CombatView encounter={activeEncounter} combatants={combatants} character={character} />
                </div>
              )}
              {levelUpDiff && (
                <div className="px-3 md:px-6 pt-3">
                  <div className="rounded-lg border border-scarlight/40 bg-scarlight-dim/20 px-3 py-2 text-xs text-parchment/90 shadow-glow">
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

        {/* Right: quests, companions, roll history (desktop static, mobile drawer) */}
        <aside className="hidden md:flex border-l border-gold/10 bg-ink-800/60 flex-col overflow-y-auto">
          {questSidebar}
        </aside>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden flex items-stretch justify-around border-t border-gold/15 bg-ink-800/90 backdrop-blur pb-safe">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] uppercase tracking-wide transition-colors ${
              view === t.key ? "text-scarlight-soft" : "text-parchment/40"
            }`}
          >
            <t.Icon className="w-5 h-5" />
            {t.label}
          </button>
        ))}
      </nav>

      <Drawer open={charDrawerOpen} onClose={() => setCharDrawerOpen(false)} side="left" title="Character">
        <CharacterSheet character={character} inventory={inventory} />
      </Drawer>
      <Drawer open={questDrawerOpen} onClose={() => setQuestDrawerOpen(false)} side="right" title="Quests & Party">
        {questSidebar}
      </Drawer>

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
