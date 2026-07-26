import type { Content } from "@google/genai";
import * as q from "../db/queries";
import { MAX_NARRATIVE_ENTRIES_IN_CONTEXT } from "../config";

/**
 * Build the `contents` array for the DM turn: the session's narrative log so
 * far, verbatim, followed by the new player input. A oneshot (~2-4 hours)
 * comfortably fits in context in full, so there's no summarization step --
 * MAX_NARRATIVE_ENTRIES_IN_CONTEXT is just a defensive cap for an unusually
 * long session. Gemini's chat format uses role "user" / "model" content
 * turns (no separate "system" role — that goes in systemInstruction instead).
 */
export function buildMessages(campaignId: number, playerInput: string): Content[] {
  const messages: Content[] = [];

  const history = q.getRecentNarrative(campaignId, MAX_NARRATIVE_ENTRIES_IN_CONTEXT);

  if (history.length > 0) {
    let intro = `[SESSION SO FAR]\n`;
    for (const entry of history) {
      intro += `${entry.role === "player" ? "PLAYER" : "DM"} (turn ${entry.turn_number}): ${entry.content}\n\n`;
    }
    intro += `[END SESSION SO FAR]\n\nThis is context only — do not respond to it directly. Respond to the player's new input below.`;

    messages.push({ role: "user", parts: [{ text: intro }] });
    messages.push({
      role: "model",
      parts: [{ text: "Understood, I have the session so far. Ready for the player's next action." }],
    });
  }

  messages.push({ role: "user", parts: [{ text: playerInput }] });

  return messages;
}
