import { NextResponse } from "next/server";
import { getFullState } from "@/lib/dm/state";

// Without this, Next.js statically prerenders this GET route at build time
// (it has no dynamic API calls for Next to detect) and serves that frozen
// snapshot to every request in production forever after -- this route must
// always hit the live database.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getFullState();
    return NextResponse.json(state);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
