import { NextResponse } from "next/server";
import { getPrimaryCampaignId } from "@/lib/db";
import * as q from "@/lib/db/queries";

/** Patch the current campaign's settings: name and/or model override. */
export async function PATCH(req: Request) {
  let body: { name?: string; model?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const campaignId = await getPrimaryCampaignId();
    const fields: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) fields.name = body.name.trim();
    if (body.model !== undefined) fields.model = body.model;

    if (Object.keys(fields).length > 0) {
      await q.updateCampaign(campaignId, fields as any);
    }

    return NextResponse.json({ campaign: await q.getCampaign(campaignId) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
