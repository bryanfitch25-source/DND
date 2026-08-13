import type Anthropic from "@anthropic-ai/sdk";
import * as q from "../db/queries";
import { serializeCharacter } from "./character";
import type { Character } from "@/types";

/**
 * Build the `messages` array for a DM turn: the current character sheet (so
 * the DM doesn't need a get_character_sheet round-trip just to check
 * numbers it needs for nearly every roll now -- see systemPrompt.ts section
 * 12), the rolling campaign summary (if any) plus any narrative rows not
 * yet folded into it, presented as a synthetic context turn, followed by
 * the new player input. See lib/dm/summarize.ts for how the summary stays
 * bounded across a long-running, open-ended campaign.
 */
export async function buildMessages(
  campaignId: number,
  playerInput: string,
  character: Character | null
): Promise<Anthropic.MessageParam[]> {
  const messages: Anthropic.MessageParam[] = [];

  const { summary, through_row_id } = await q.getCampaignSummary(campaignId);
  const recent = await q.getNarrativeAfter(campaignId, through_row_id);
  const characterSheet = character ? await serializeCharacter(character) : null;

  if (summary || recent.length > 0 || characterSheet) {
    let intro = "";
    if (characterSheet) {
      // Snapshot as of the START of this turn. If a tool call updates the
      // character mid-turn, the tool_result the DM already sees carries the
      // fresh numbers -- this block is just to avoid the round-trip on the
      // common case where nothing's changed yet this turn.
      intro += `[CURRENT CHARACTER SHEET — as of the start of this turn]\n${JSON.stringify(characterSheet)}\n[END CHARACTER SHEET]\n\n`;
    }
    if (summary) {
      intro += `[CAMPAIGN SO FAR — SUMMARY]\n${summary}\n[END SUMMARY]\n\n`;
    }
    if (recent.length > 0) {
      intro += `[RECENT TRANSCRIPT]\n`;
      for (const entry of recent) {
        intro += `${entry.role === "player" ? "PLAYER" : "DM"} (turn ${entry.turn_number}): ${entry.content}\n\n`;
      }
      intro += `[END RECENT TRANSCRIPT]\n\n`;
    }
    intro += `This is context only — do not respond to it directly. Respond to the player's new input below.`;

    messages.push({ role: "user", content: intro });
    messages.push({
      role: "assistant",
      content: "Understood, I have the campaign context so far. Ready for the player's next action.",
    });
  }

  // cache_control here doesn't help across different turns (playerInput is
  // different every time), but it does mark everything up through this
  // point as a cache breakpoint for the CURRENT turn's tool-use loop: a
  // turn that needs several tool round-trips (see app/api/turn/route.ts)
  // resends this whole array on every iteration, and this lets Anthropic
  // serve the repeated prefix from cache instead of rebilling it each time.
  messages.push({ role: "user", content: [{ type: "text", text: playerInput, cache_control: { type: "ephemeral" } }] });

  return messages;
}
