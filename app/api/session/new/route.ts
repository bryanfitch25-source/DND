import { NextResponse } from "next/server";
import * as q from "@/lib/db/queries";

/** Start a brand-new oneshot session (a fresh campaign row). Becomes
 * "current" automatically since getPrimaryCampaignId always returns the
 * most recently created row. */
export async function POST() {
  try {
    const campaign = q.createCampaign();
    return NextResponse.json({ campaign });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
