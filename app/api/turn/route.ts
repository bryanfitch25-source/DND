import { NextResponse } from "next/server";
import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { GEMINI_MODEL, MAX_OUTPUT_TOKENS, MAX_TOOL_ITERATIONS } from "@/lib/config";
import { getPrimaryCampaignId } from "@/lib/db";
import * as q from "@/lib/db/queries";
import { toolDefinitions } from "@/lib/tools/definitions";
import { executeTool } from "@/lib/tools/execute";
import { buildSystemPrompt } from "@/lib/dm/systemPrompt";
import { buildMessages } from "@/lib/dm/context";
import { getFullState } from "@/lib/dm/state";
import { DEATH_TAG, SESSION_COMPLETE_TAG } from "@/lib/dm/tags";
import type { TurnResponse } from "@/types";

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

  const campaignId = getPrimaryCampaignId();
  const campaignBefore = q.getCampaign(campaignId);
  if (campaignBefore.status === "completed") {
    // Session already reached its ending -- don't spend a model call (and
    // free-tier quota) on a turn that can't go anywhere.
    const state = getFullState(
      "This session has already reached its ending. Start a new oneshot to keep playing."
    );
    return NextResponse.json({ ...state, awaitingDeathDecision: false, sessionComplete: true });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  const client = new GoogleGenAI({ apiKey });

  try {
    const turnNumber = q.incrementTurnNumber(campaignId);

    q.appendNarrative(campaignId, turnNumber, "player", playerInput);

    const character = q.getCharacterByCampaign(campaignId);
    const campaign = q.getCampaign(campaignId);

    const systemInstruction = buildSystemPrompt({ campaign, character });
    const contents: Content[] = buildMessages(campaignId, playerInput);

    let characterId = character ? character.id : null;
    let finalText = "";
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: toolDefinitions }],
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      });

      const candidate = response.candidates?.[0];
      const modelContent = candidate?.content;

      if (!modelContent) {
        // Blocked (safety) or otherwise empty response — surface what we can and stop.
        const reason = candidate?.finishReason || response.promptFeedback?.blockReason || "unknown";
        finalText = finalText || `(The DM's response was blocked or empty: ${reason}. Try rephrasing your action.)`;
        break;
      }

      // Echo the model's turn (including any functionCall parts) back into
      // the conversation before responding to it, exactly as Gemini expects.
      contents.push({ role: "model", parts: modelContent.parts || [] });

      const textFromResponse = (response.text || "").trim();
      if (textFromResponse) {
        finalText = textFromResponse;
      }

      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) {
        break;
      }

      const responseParts: Part[] = [];
      for (const call of functionCalls) {
        const name = call.name || "";
        const result = executeTool(name, call.args || {}, {
          campaignId,
          characterId,
          turnNumber,
        });
        if (result.createdCharacterId) {
          characterId = result.createdCharacterId;
        }
        responseParts.push({
          functionResponse: {
            name,
            response: result.isError ? { error: result.content } : { output: result.content },
          },
        });
      }

      contents.push({ role: "user", parts: responseParts });
    }

    let awaitingDeathDecision = false;
    let sessionComplete = false;
    let narrative = finalText.trim();

    if (narrative.includes(SESSION_COMPLETE_TAG)) {
      sessionComplete = true;
      narrative = narrative.replace(SESSION_COMPLETE_TAG, "").trim();
    } else if (narrative.includes(DEATH_TAG)) {
      awaitingDeathDecision = true;
      narrative = narrative.replace(DEATH_TAG, "").trim();
    }

    if (!narrative) {
      narrative = "(The DM paused without a response — try describing your action again.)";
    }

    q.appendNarrative(campaignId, turnNumber, "dm", narrative);

    if (sessionComplete) {
      q.updateCampaign(campaignId, { status: "completed" });
    }

    const state = getFullState(narrative);
    const responseBody: TurnResponse = {
      ...state,
      awaitingDeathDecision,
      sessionComplete,
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
