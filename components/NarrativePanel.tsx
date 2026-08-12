"use client";

import { useEffect, useRef, useState } from "react";
import type { NarrativeLogEntry } from "@/types";

const DEFAULT_QUICK_ACTIONS = ["Look around", "Check my inventory", "Rest here"];
const COMBAT_QUICK_ACTIONS = ["Attack the nearest enemy", "Defend / hold position", "Try to flee"];

export default function NarrativePanel({
  entries,
  onSubmit,
  isLoading,
  defeatOccurred,
  characterExists,
  inCombat,
  error,
  summary,
  inputRef,
}: {
  entries: NarrativeLogEntry[];
  onSubmit: (input: string) => Promise<boolean>;
  isLoading: boolean;
  defeatOccurred: boolean;
  characterExists: boolean;
  inCombat?: boolean;
  error: string | null;
  summary?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}) {
  const [input, setInput] = useState("");
  const [recapDismissed, setRecapDismissed] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setShowJumpToLatest(false);
  }

  // Only auto-scroll on new content if the reader was already near the
  // bottom -- otherwise a new DM reply would yank someone back down while
  // they're scrolled up rereading earlier history. If they're scrolled up
  // when new content arrives, surface a "Jump to latest" nudge instead.
  useEffect(() => {
    if (wasNearBottomRef.current) {
      scrollToBottom();
    } else {
      setShowJumpToLatest(true);
    }
  }, [entries, isLoading]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    wasNearBottomRef.current = nearBottom;
    if (nearBottom) setShowJumpToLatest(false);
  }

  async function submit(text?: string) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading) return;
    // Clear (or leave the box, for quick actions) optimistically, but
    // restore it on failure so a failed send never loses what was typed.
    if (text === undefined) setInput("");
    const ok = await onSubmit(trimmed);
    if (!ok && text === undefined) setInput(trimmed);
  }

  const quickActions = characterExists ? (inCombat ? COMBAT_QUICK_ACTIONS : DEFAULT_QUICK_ACTIONS) : [];

  return (
    <div className="flex flex-col h-full relative">
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-4">
        {summary && !recapDismissed && (
          <div className="panel rounded-lg p-3 max-w-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-widest text-gold/70">Story So Far</span>
              <button
                onClick={() => setRecapDismissed(true)}
                aria-label="Dismiss story so far"
                className="text-parchment/40 hover:text-parchment/80 text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-parchment/70 line-clamp-4 whitespace-pre-wrap">{summary}</p>
          </div>
        )}
        {entries.length === 0 && (
          <div className="text-parchment/50 text-sm max-w-2xl font-body">
            <p className="mb-2">
              Welcome to the Hollow Reach. Tell me who you want to play — describe a character concept,
              paste a finished build, or ask to build one step by step — and we&apos;ll begin.
            </p>
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className={entry.role === "player" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[90%] md:max-w-2xl text-left rounded-lg px-3 md:px-4 py-2 whitespace-pre-wrap leading-relaxed text-sm md:text-base ${
                entry.role === "player"
                  ? "bg-blood/30 border border-blood-light/20 text-parchment"
                  : "bg-ink-800/70 border-l-2 border-gold/30 text-parchment/90 font-body"
              }`}
            >
              {entry.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-ink-800/50 text-parchment/50 italic text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-scarlight animate-pulse shadow-glow" />
              The DM is thinking…
            </div>
          </div>
        )}
        {error && (
          <div className="text-left">
            <div className="inline-block rounded-lg px-4 py-2 bg-blood-dark/40 border border-blood-light/40 text-parchment text-sm">
              {error}
            </div>
          </div>
        )}
        {defeatOccurred && (
          <div className="text-center py-2">
            <div className="inline-block px-4 py-2 rounded-lg border border-blood/60 bg-blood/20 shadow-glow-blood">
              <p className="text-xs uppercase tracking-widest text-parchment/80">You were defeated — but you survived</p>
            </div>
          </div>
        )}
      </div>

      {showJumpToLatest && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded-full bg-ink-800 border border-gold/40 text-parchment/80 shadow-glow-gold hover:text-parchment"
        >
          ↓ Jump to latest
        </button>
      )}

      {quickActions.length > 0 && (
        <div className="px-3 md:px-6 pb-2 flex gap-2 overflow-x-auto">
          {quickActions.map((qa) => (
            <button
              key={qa}
              onClick={() => submit(qa)}
              disabled={isLoading}
              className="shrink-0 whitespace-nowrap text-xs px-3 py-1.5 rounded-full border border-gold/25 text-parchment/70 hover:text-parchment hover:border-gold/50 disabled:opacity-40"
            >
              {qa}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-gold/15 p-3 md:p-4 pb-safe flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            characterExists ? "What do you do?" : "Describe your character concept, or ask to build one step by step…"
          }
          rows={2}
          disabled={isLoading}
          className="flex-1 resize-none rounded-md bg-ink-900/60 border border-gold/20 px-3 py-2.5 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
        />
        <button
          onClick={() => submit()}
          disabled={isLoading || !input.trim()}
          className="min-h-[44px] px-4 py-2 rounded-md bg-blood hover:bg-blood-light disabled:opacity-40 disabled:cursor-not-allowed text-parchment text-sm font-medium self-end shadow-glow-blood"
        >
          Send
        </button>
      </div>
    </div>
  );
}
