"use client";

import { useEffect, useRef, useState } from "react";
import type { NarrativeLogEntry } from "@/types";

export default function NarrativePanel({
  entries,
  onSubmit,
  isLoading,
  awaitingDeathDecision,
  sessionComplete,
  onNewSession,
  characterExists,
  error,
}: {
  entries: NarrativeLogEntry[];
  onSubmit: (input: string) => void;
  isLoading: boolean;
  awaitingDeathDecision: boolean;
  sessionComplete: boolean;
  onNewSession: () => void;
  characterExists: boolean;
  error: string | null;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries, isLoading]);

  function submit() {
    const trimmed = input.trim();
    if (!trimmed || isLoading || sessionComplete) return;
    onSubmit(trimmed);
    setInput("");
  }

  function quickReply(text: string) {
    if (isLoading || sessionComplete) return;
    onSubmit(text);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {entries.length === 0 && (
          <div className="text-parchment/50 text-sm max-w-2xl">
            <p className="mb-2">
              Welcome to your oneshot. Tell me who you want to play — describe a character concept,
              paste a finished build, or just say you&apos;d like a couple of quick options to pick
              from — and we&apos;ll dive straight into the session.
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
        {sessionComplete && (
          <div className="text-center py-6">
            <div className="inline-block px-6 py-3 rounded-lg border border-parchment/30 bg-black/40">
              <p className="font-serif text-xl tracking-widest text-parchment">THE END</p>
              <p className="text-xs text-parchment/50 mt-1">This oneshot has reached its ending.</p>
            </div>
          </div>
        )}
      </div>

      {awaitingDeathDecision && !sessionComplete && (
        <div className="mx-6 mb-3 rounded-lg border border-blood bg-blood/20 p-3">
          <p className="text-sm font-medium text-parchment mb-2">
            Death is on the line. How do you want to handle this moment?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => quickReply("I accept it. Let the blow land — my character dies here.")}
              className="px-3 py-1.5 text-xs rounded bg-blood/60 hover:bg-blood text-parchment"
            >
              Accept death
            </button>
            <button
              onClick={() => quickReply("I want to look for a narrative way to survive this if there's any chance.")}
              className="px-3 py-1.5 text-xs rounded bg-black/40 hover:bg-black/60 text-parchment"
            >
              Look for a reprieve
            </button>
            <button
              onClick={() => quickReply("Let me spend a resource, ability, or item to try to survive this.")}
              className="px-3 py-1.5 text-xs rounded bg-black/40 hover:bg-black/60 text-parchment"
            >
              Spend a resource to survive
            </button>
          </div>
        </div>
      )}

      {sessionComplete ? (
        <div className="border-t border-white/10 p-4 flex justify-center">
          <button
            onClick={onNewSession}
            className="px-5 py-2.5 rounded-md bg-blood hover:bg-blood/80 text-parchment text-sm font-medium"
          >
            Start a New Oneshot
          </button>
        </div>
      ) : (
        <div className="border-t border-white/10 p-4 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              characterExists ? "What do you do?" : "Describe your character concept, or ask for a couple of quick options…"
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
      )}
    </div>
  );
}
