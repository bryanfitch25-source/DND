"use client";

import { useEffect } from "react";
import type { Character } from "@/types";
import { xpToNextLevel } from "@/lib/dnd";

export default function LevelUpModal({
  character,
  targetLevel,
  onConfirm,
  onClose,
  isLoading,
}: {
  character: Character;
  targetLevel: number;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const nextXp = xpToNextLevel(character.xp, targetLevel);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-ink border border-blood/40 rounded-lg p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-serif text-parchment mb-2">Level Up Available</h2>
        <p className="text-sm text-parchment/70 mb-4">
          {character.name} has earned enough XP ({character.xp}) to reach level {targetLevel}, up from level{" "}
          {character.level}. The DM will walk you through the new features, hit points, and any spell/ability
          choices this level grants.
        </p>
        {nextXp !== null && (
          <p className="text-xs text-parchment/40 mb-4">{nextXp} XP to the level after that.</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-3 py-2 rounded text-sm text-parchment/60 hover:text-parchment disabled:opacity-40"
          >
            Not now
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded bg-blood hover:bg-blood/80 disabled:opacity-40 text-parchment text-sm font-medium"
          >
            {isLoading ? "Leveling up…" : `Level Up to ${targetLevel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
