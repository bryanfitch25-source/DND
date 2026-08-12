import type Anthropic from "@anthropic-ai/sdk";
import * as q from "../db/queries";

/**
 * Build the `messages` array for a DM turn: the rolling campaign summary
 * (if any) plus any narrative rows not yet folded into it, presented as a
 * synthetic context turn, followed by the new player input. See
 * lib/dm/summarize.ts for how the summary stays bounded across a
 * long-running, open-ended campaign.
 */
export async function buildMessages(campaignId: number, playerInput: string): Promise<Anthropic.MessageParam[]> {
  const messages: Anthropic.MessageParam[] = [];

  const { summary, through_row_id } = await q.getCampaignSummary(campaignId);
  const recent = await q.getNarrativeAfter(campaignId, through_row_id);

  if (summary || recent.length > 0) {
    let intro = "";
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

  messages.push({ role: "user", content: playerInput });

  return messages;
}
