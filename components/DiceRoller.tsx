"use client";

import { useEffect, useRef, useState } from "react";
import { rollDice, type RollResult } from "@/lib/dice";
import { IconDie } from "./Icons";

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100];

// Client-side, player-facing dice roller -- separate from the DM's own
// roll_dice tool. This is for the player to physically roll something
// themselves (curiosity, a house-ruled check, just wanting the tactile
// button) without it being logged as an official game roll. "Insert" drops
// the result into the story input so the DM sees it as part of what the
// player says, exactly like calling out a physical dice roll at a table.
export default function DiceRoller({ onInsert }: { onInsert: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("1d20");
  const [modifier, setModifier] = useState(0);
  const [result, setResult] = useState<RollResult | null>(null);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function roll(baseExpr: string) {
    const modPart = modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : "";
    const fullExpr = `${baseExpr}${modPart}`;
    try {
      const r = rollDice(fullExpr);
      setResult(r);
      setHistory((prev) => [r, ...prev].slice(0, 8));
      setError(null);
      setExpression(baseExpr);
    } catch {
      setError("Invalid dice expression");
    }
  }

  function rollCustom() {
    roll(expression);
  }

  function insertResult(r: RollResult) {
    onInsert(`(I rolled ${r.expression}: ${r.breakdown})`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Roll your own dice"
        title="Roll your own dice"
        className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-md border border-gold/25 text-gold-bright hover:border-gold/50 hover:bg-white/5 self-end flex items-center justify-center"
      >
        <IconDie className="w-5 h-5" />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute bottom-full right-0 mb-2 w-72 panel rounded-lg p-3 shadow-glow-gold z-20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg uppercase tracking-widest text-gold/70">Roll Your Own</span>
            <button onClick={() => setOpen(false)} aria-label="Close dice roller" className="text-parchment/40 hover:text-parchment/80 text-lg">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {QUICK_DICE.map((sides) => (
              <button
                key={sides}
                onClick={() => roll(`1d${sides}`)}
                className="text-lg py-1.5 rounded border border-gold/20 text-parchment/80 hover:text-parchment hover:border-gold/50"
              >
                d{sides}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <input
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && rollCustom()}
              placeholder="e.g. 2d6"
              className="flex-1 min-w-0 rounded bg-ink-900/60 border border-gold/15 px-2 py-1.5 text-lg text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-1 focus:ring-scarlight"
            />
            <button
              onClick={() => setModifier((m) => m - 1)}
              aria-label="Decrease modifier"
              className="w-7 h-7 shrink-0 rounded border border-gold/20 text-parchment/70 hover:text-parchment"
            >
              −
            </button>
            <span className="w-8 text-center text-lg text-parchment/70 shrink-0">
              {modifier > 0 ? `+${modifier}` : modifier}
            </span>
            <button
              onClick={() => setModifier((m) => m + 1)}
              aria-label="Increase modifier"
              className="w-7 h-7 shrink-0 rounded border border-gold/20 text-parchment/70 hover:text-parchment"
            >
              +
            </button>
            <button
              onClick={rollCustom}
              className="shrink-0 px-2.5 py-1.5 rounded bg-blood hover:bg-blood-light text-parchment text-lg"
            >
              Roll
            </button>
          </div>

          {error && <p className="text-lg text-blood-light mb-2">{error}</p>}

          {result && (
            <div className="rounded bg-ink-900/60 border border-gold/15 px-2.5 py-2 mb-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-lg text-parchment/60">{result.expression}</span>
                <span className="text-2xl font-display text-gold-bright">{result.total}</span>
              </div>
              <p className="text-lg text-parchment/50">{result.breakdown}</p>
              <button
                onClick={() => insertResult(result)}
                className="mt-1.5 w-full text-lg py-1 rounded border border-gold/25 text-parchment/70 hover:text-parchment hover:border-gold/50"
              >
                Insert into message
              </button>
            </div>
          )}

          {history.length > 1 && (
            <ul className="space-y-0.5 max-h-24 overflow-y-auto">
              {history.slice(1).map((r, i) => (
                <li key={i} className="text-lg flex justify-between gap-2 text-parchment/40">
                  <span>{r.expression}</span>
                  <span>{r.breakdown}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
