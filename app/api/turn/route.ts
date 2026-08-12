import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL, MAX_OUTPUT_TOKENS, MAX_TOOL_ITERATIONS } from "@/lib/config";
import { getPrimaryCampaignId } from "@/lib/db";
import * as q from "@/lib/db/queries";
import { toolDefinitions } from "@/lib/tools/definitions";
import { executeTool } from "@/lib/tools/execute";
import { buildSystemPrompt } from "@/lib/dm/systemPrompt";
import { buildMessages } from "@/lib/dm/context";
import { summarizeIfNeeded } from "@/lib/dm/summarize";
import { getFullState } from "@/lib/dm/state";
import { DEFEAT_TAG } from "@/lib/dm/tags";
import type { TurnResponse } from "@/types";

export const runtime = "nodejs";
// A DM turn can involve several tool-calling round-trips (character
// creation measured ~55s locally). 60s is the max Vercel allows on the
// Hobby plan; if turns start timing out, trim MAX_TOOL_ITERATIONS in
// lib/config.ts rather than raising this past what your plan allows.
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { input?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const playerInput = (body.input || "").trim();
  if (!playerInput) {
    return NextResponse.json({ error: "Missing 'input'" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to your environment and redeploy." },
      { status: 500 }
    );
  }

  const campaignId = await getPrimaryCampaignId();
  const client = new Anthropic({ apiKey });

  try {
    // Fold older narrative into the rolling summary before building context,
    // so a long-running campaign's context stays bounded (see lib/dm/summarize.ts).
    await summarizeIfNeeded(campaignId, apiKey);

    const turnNumber = await q.incrementTurnNumber(campaignId);

    await q.appendNarrative(campaignId, turnNumber, "player", playerInput);

    const character = await q.getCharacterByCampaign(campaignId);
    const campaign = await q.getCampaign(campaignId);

    const system = buildSystemPrompt({ campaign, character });
    const messages: Anthropic.MessageParam[] = await buildMessages(campaignId, playerInput);

    let characterId = character ? character.id : null;
    let finalText = "";
    let iterations = 0;
    const model = campaign.model || CLAUDE_MODEL;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      const response = await client.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system,
        tools: toolDefinitions as Anthropic.Tool[],
        messages,
      });

      // Echo the model's turn back into the conversation before responding
      // to it, exactly as Claude's tool-use loop expects.
      messages.push({ role: "assistant", content: response.content });

      const textFromResponse = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("\n")
        .trim();
      if (textFromResponse) {
        finalText = textFromResponse;
      }

      if (response.stop_reason !== "tool_use") {
        break;
      }

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      if (toolUseBlocks.length === 0) break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const result = await executeTool(block.name, (block.input as Record<string, unknown>) || {}, {
          campaignId,
          characterId,
          turnNumber,
        });
        if (result.createdCharacterId) {
          characterId = result.createdCharacterId;
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result.content,
          is_error: result.isError,
        });
      }

      messages.push({ role: "user", content: toolResults });
    }

    let defeatOccurred = false;
    let narrative = finalText.trim();

    if (narrative.includes(DEFEAT_TAG)) {
      defeatOccurred = true;
      narrative = narrative.replace(DEFEAT_TAG, "").trim();
    }

    if (!narrative) {
      narrative = "(The DM paused without a response — try describing your action again.)";
    }

    await q.appendNarrative(campaignId, turnNumber, "dm", narrative);

    const state = await getFullState(narrative);
    const responseBody: TurnResponse = {
      ...state,
      defeatOccurred,
    };

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error("Turn processing failed:", err);
    return NextResponse.json(
      { error: `Turn processing failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
