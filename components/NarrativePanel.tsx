"use client";

import { useEffect, useRef, useState } from "react";
import type { NarrativeLogEntry } from "@/types";

export default function NarrativePanel({
  entries,
  onSubmit,
  isLoading,
  defeatOccurred,
  characterExists,
  error,
  summary,
  inputRef,
}: {
  entries: NarrativeLogEntry[];
  onSubmit: (input: string) => void;
  isLoading: boolean;
  defeatOccurred: boolean;
  characterExists: boolean;
  error: string | null;
  summary?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}) {
  const [input, setInput] = useState("");
  const [recapDismissed, setRecapDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries, isLoading]);

  function submit() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {summary && !recapDismissed && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 max-w-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase text-parchment/50">Story So Far</span>
              <button
                onClick={() => setRecapDismissed(true)}
                className="text-parchment/40 hover:text-parchment/80 text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-parchment/70 line-clamp-4 whitespace-pre-wrap">{summary}</p>
          </div>
        )}
        {entries.length === 0 && (
          <div className="text-parchment/50 text-sm max-w-2xl">
            <p className="mb-2">
              Welcome to the Hollow Reach. Tell me who you want to play — describe a character concept,
              paste a finished build, or ask to build one step by step — and we&apos;ll begin.
            </p>
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className={entry.role === "player" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-2xl text-left rounded-lg px-4 py-2 whitespace-pre-wrap leading-relaxed ${
                entry.role === "player"
                  ? "bg-blood/30 text-parchment"
                  : "bg-black/30 text-parchment/90 font-serif"
              }`}
            >
              {entry.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left">
            <div className="inline-block rounded-lg px-4 py-2 bg-black/20 text-parchment/50 italic text-sm">
              The DM is thinking…
            </div>
          </div>
        )}
        {error && (
          <div className="text-left">
            <div className="inline-block rounded-lg px-4 py-2 bg-red-950 text-red-200 text-sm">
              {error}
            </div>
          </div>
        )}
        {defeatOccurred && (
          <div className="text-center py-2">
            <div className="inline-block px-4 py-2 rounded-lg border border-blood/60 bg-blood/20">
              <p className="text-xs uppercase tracking-widest text-parchment/80">You were defeated — but you survived</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-4 flex gap-2">
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
          className="flex-1 resize-none rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-1 focus:ring-blood disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 rounded-md bg-blood hover:bg-blood/80 disabled:opacity-40 disabled:cursor-not-allowed text-parchment text-sm font-medium self-end"
        >
          Send
        </button>
      </div>
    </div>
  );
}
