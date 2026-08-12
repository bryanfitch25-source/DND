"use client";

import { useEffect } from "react";

/** A slide-in overlay panel, used on mobile to hold the character sheet /
 * quest log where a desktop layout would show them as static sidebars.
 * Closes on backdrop click or Esc. */
export default function Drawer({
  open,
  onClose,
  side,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-40 md:hidden transition-opacity duration-200 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className={`absolute top-0 bottom-0 ${side === "left" ? "left-0" : "right-0"} w-[85%] max-w-sm bg-ink-800 panel border-gold/20 shadow-2xl flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 pt-safe border-b border-gold/15">
          <span className="font-display text-sm uppercase tracking-wider text-gold-bright">{title}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-parchment/60 hover:text-parchment hover:bg-white/5"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pb-safe">{children}</div>
      </div>
    </div>
  );
}
