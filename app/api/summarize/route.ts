import { NextResponse } from "next/server";
import { getPrimaryCampaignId } from "@/lib/db";
import { summarizeIfNeeded } from "@/lib/dm/summarize";
import * as q from "@/lib/db/queries";

/** Force a rolling-summary regeneration right now, regardless of whether
 * the normal row-count trigger has been reached (Settings tab action). */
export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to your environment and redeploy." },
      { status: 500 }
    );
  }

  try {
    const campaignId = await getPrimaryCampaignId();
    await summarizeIfNeeded(campaignId, apiKey, true);
    const { summary } = await q.getCampaignSummary(campaignId);
    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
