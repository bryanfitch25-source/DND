import { NextResponse } from "next/server";
import { getPrimaryCampaignId } from "@/lib/db";
import * as q from "@/lib/db/queries";

// See app/api/state/route.ts -- without this, Next.js statically caches
// this GET route's response at build time instead of hitting the database
// on every request.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campaignId = await getPrimaryCampaignId();
    const entries = await q.getAllNarrative(campaignId);
    return NextResponse.json({ entries });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
