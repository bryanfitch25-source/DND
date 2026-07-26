import { NextResponse } from "next/server";
import { getPrimaryCampaignId } from "@/lib/db";
import * as q from "@/lib/db/queries";

export async function GET() {
  try {
    const campaignId = getPrimaryCampaignId();
    const entries = q.getAllNarrative(campaignId);
    return NextResponse.json({ entries });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
