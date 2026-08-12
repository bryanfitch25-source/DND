import Anthropic from "@anthropic-ai/sdk";
import * as q from "../db/queries";
import {
  SUMMARY_MODEL,
  SUMMARY_TRIGGER_ROWS,
  KEEP_RAW_ROWS_AFTER_SUMMARY,
  SUMMARY_MAX_OUTPUT_TOKENS,
} from "../config";

/**
 * An open-ended campaign's narrative log can grow indefinitely, unlike a
 * bounded oneshot. Once more than SUMMARY_TRIGGER_ROWS unsummarized rows
 * have piled up (beyond the always-kept-raw window), fold the older rows
 * into a single rolling summary via a cheap model call, so context sent to
 * the main DM model each turn stays bounded. No-ops if the trigger hasn't
 * been reached yet.
 */
export async function summarizeIfNeeded(
  campaignId: number,
  apiKey: string,
  force = false
): Promise<void> {
  const { summary, through_row_id } = await q.getCampaignSummary(campaignId);
  const rows = await q.getNarrativeAfter(campaignId, through_row_id);
  if (!force && rows.length <= SUMMARY_TRIGGER_ROWS) return;

  const keepRaw = force ? 0 : KEEP_RAW_ROWS_AFTER_SUMMARY;
  const toSummarize = rows.slice(0, rows.length - keepRaw);
  if (toSummarize.length === 0) return;

  const transcriptChunk = toSummarize
    .map((r) => `${r.role === "player" ? "PLAYER" : "DM"} (turn ${r.turn_number}): ${r.content}`)
    .join("\n\n");

  const prompt = `You are maintaining a running summary of an ongoing solo Dungeons & Dragons campaign, used as context for an AI Dungeon Master in future turns.

${summary ? `Here is the summary so far:\n\n${summary}\n\n` : ""}Here is the next chunk of the campaign transcript to fold in:

${transcriptChunk}

Write an updated, complete summary (not a diff) covering everything a DM needs to stay consistent: the character's identity, growth, and current situation; key NPCs, factions, and their disposition toward the player; locations visited; promises made; active and resolved plot threads; and any other durable established facts. Be concise but complete -- prefer a dense bulleted structure over prose. Do not lose important facts that were in the prior summary.`;

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: SUMMARY_MODEL,
    max_tokens: SUMMARY_MAX_OUTPUT_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n")
    .trim();

  if (!text) return;

  const throughRowId = toSummarize[toSummarize.length - 1].id;
  await q.upsertCampaignSummary(campaignId, text, throughRowId);
}
