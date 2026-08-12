"use client";

import { useEffect } from "react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

/** Themed replacement for window.confirm() -- native browser confirm
 * dialogs break the mystical dark aesthetic and can't be styled at all. */
export default function ConfirmModal({
  title,
  body,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useBodyScrollLock(true);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`bg-ink-800 panel rounded-lg p-6 max-w-sm w-full ${danger ? "border-blood/40 shadow-glow-blood" : "border-gold/30 shadow-glow-gold"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg text-parchment mb-2">{title}</h2>
        <p className="text-sm text-parchment/70 mb-5">{body}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded text-sm text-parchment/60 hover:text-parchment"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded text-sm font-medium text-parchment ${
              danger ? "bg-blood hover:bg-blood-light shadow-glow-blood" : "bg-scarlight-dim hover:bg-scarlight/40 border border-scarlight/50 shadow-glow"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
