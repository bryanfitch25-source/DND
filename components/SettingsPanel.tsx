"use client";

import { useEffect, useRef, useState } from "react";
import type { Campaign } from "@/types";

const MODEL_OPTIONS = [
  { value: "", label: "Default (Haiku — fast & cheap)" },
  { value: "claude-sonnet-5", label: "Sonnet (higher quality, more expensive)" },
];

type SaveState = "idle" | "saved" | "error";

function useTransientState(): [SaveState, (s: SaveState) => void] {
  const [state, setState] = useState<SaveState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  function set(s: SaveState) {
    setState(s);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (s !== "idle") timeoutRef.current = setTimeout(() => setState("idle"), 2500);
  }
  return [state, set];
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === "saved") return <span className="text-lg text-scarlight-soft">✓ Saved</span>;
  if (state === "error") return <span className="text-lg text-blood-light">Failed to save — try again</span>;
  return null;
}

export default function SettingsPanel({
  campaign,
  onRename,
  onModelChange,
  onForceSummarize,
  onNewCampaign,
}: {
  campaign: Campaign;
  onRename: (name: string) => Promise<boolean>;
  onModelChange: (model: string | null) => Promise<boolean>;
  onForceSummarize: () => Promise<string>;
  onNewCampaign: () => void;
}) {
  const [name, setName] = useState(campaign.name);
  const [model, setModel] = useState(campaign.model || "");
  const [savingName, setSavingName] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [nameSaveState, setNameSaveState] = useTransientState();
  const [modelSaveState, setModelSaveState] = useTransientState();

  // This panel now stays mounted permanently (see app/page.tsx) so tab
  // switches don't wipe an in-progress edit here -- but that means it also
  // won't naturally re-init when the underlying campaign actually changes
  // (e.g. "Start a New Campaign"). Resync only on campaign.id changing, so
  // an in-progress edit to the *current* campaign's name is never clobbered.
  useEffect(() => {
    setName(campaign.name);
    setModel(campaign.model || "");
  }, [campaign.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveName() {
    setSavingName(true);
    try {
      const ok = await onRename(name.trim());
      setNameSaveState(ok ? "saved" : "error");
    } finally {
      setSavingName(false);
    }
  }

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto max-w-xl mx-auto space-y-8">
      <h2 className="font-display text-3xl text-gold-bright">Settings</h2>

      <section>
        <h3 className="text-lg uppercase tracking-widest text-gold/70 mb-2 pb-1 border-b border-gold/15">
          Campaign Name
        </h3>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !savingName && name.trim() && name !== campaign.name) {
                e.preventDefault();
                saveName();
              }
            }}
            className="flex-1 rounded bg-ink-900/60 border border-gold/20 px-3 py-2 text-xl text-parchment focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <button
            disabled={savingName || !name.trim() || name === campaign.name}
            onClick={saveName}
            className="px-3 py-2 rounded bg-blood hover:bg-blood-light disabled:opacity-40 text-parchment text-xl"
          >
            Save
          </button>
        </div>
        <div className="mt-1 h-4"><SaveBadge state={nameSaveState} /></div>
      </section>

      <section>
        <h3 className="text-lg uppercase tracking-widest text-gold/70 mb-2 pb-1 border-b border-gold/15">
          DM Model
        </h3>
        <p className="text-lg text-parchment/50 mb-2">
          The Claude API is billed per token. This campaign defaults to Haiku to keep cost down — a
          character-creation turn (several tool calls at once) measured about $0.16 on Sonnet; ordinary
          turns with 1-2 tool calls cost noticeably less. Switch to Sonnet here for a specific campaign if
          you want richer, more consistent narration and don't mind paying more per turn.
        </p>
        <select
          value={model}
          disabled={savingModel}
          onChange={async (e) => {
            const next = e.target.value;
            setModel(next);
            setSavingModel(true);
            try {
              const ok = await onModelChange(next || null);
              setModelSaveState(ok ? "saved" : "error");
            } finally {
              setSavingModel(false);
            }
          }}
          className="w-full rounded bg-ink-900/60 border border-gold/20 px-3 py-2 text-xl text-parchment focus:outline-none focus:ring-1 focus:ring-gold"
        >
          {MODEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="mt-1 h-4"><SaveBadge state={modelSaveState} /></div>
      </section>

      <section>
        <h3 className="text-lg uppercase tracking-widest text-gold/70 mb-2 pb-1 border-b border-gold/15">
          Rolling Summary
        </h3>
        <p className="text-lg text-parchment/50 mb-2">
          The campaign's context is periodically compressed into a rolling summary so long campaigns stay
          within the model's context window (see the Journal tab). Force it to refresh now if you want it
          fully up to date.
        </p>
        <button
          disabled={summarizing}
          onClick={async () => {
            setSummarizing(true);
            setSummaryResult(null);
            try {
              const summary = await onForceSummarize();
              setSummaryResult(summary || "(Not enough new narrative yet to summarize.)");
            } finally {
              setSummarizing(false);
            }
          }}
          className="px-3 py-2 rounded bg-ink-900/60 border border-gold/20 hover:border-gold/50 disabled:opacity-40 text-parchment text-xl"
        >
          {summarizing ? "Summarizing…" : "Regenerate Summary Now"}
        </button>
        {summaryResult && (
          <div className="mt-2 text-lg text-parchment/60 bg-ink-900/50 rounded p-2 whitespace-pre-wrap max-h-40 overflow-y-auto">
            {summaryResult}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg uppercase tracking-widest text-gold/70 mb-2 pb-1 border-b border-gold/15">
          Account
        </h3>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="px-3 py-2 rounded bg-ink-900/60 border border-gold/20 hover:border-gold/50 text-parchment text-xl"
        >
          Log Out
        </button>
        <p className="text-lg text-parchment/40 mt-1">
          Clears your "remember me" session on this device. You'll need your username and password to log
          back in.
        </p>
      </section>

      <section>
        <h3 className="text-lg uppercase tracking-widest text-blood-light/80 mb-2 pb-1 border-b border-blood/20">
          Danger Zone
        </h3>
        <button
          onClick={onNewCampaign}
          className="px-3 py-2 rounded border border-blood/40 text-blood-light/90 hover:bg-blood/10 text-xl"
        >
          Start a New Campaign
        </button>
        <p className="text-lg text-parchment/40 mt-1">
          Your current character and story stay saved in the database; the app just switches to a fresh
          campaign.
        </p>
      </section>
    </div>
  );
}
