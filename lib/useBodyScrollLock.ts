import { useEffect } from "react";

/** Locks background page scroll while a drawer/modal is open -- without
 * this, dragging inside a mobile overlay can scroll the page underneath it. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
