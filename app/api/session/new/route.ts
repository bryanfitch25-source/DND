import { NextResponse } from "next/server";
import * as q from "@/lib/db/queries";

/** Start a brand-new campaign (a fresh campaign row). Becomes "current"
 * automatically since getPrimaryCampaignId always returns the most
 * recently created row. Existing campaigns are kept in the database but
 * no longer surfaced (see README's "out of scope" section). */
export async function POST() {
  try {
    const campaign = await q.createCampaign();
    return NextResponse.json({ campaign });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
