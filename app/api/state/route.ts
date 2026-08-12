import { NextResponse } from "next/server";
import { getFullState } from "@/lib/dm/state";

export async function GET() {
  try {
    const state = await getFullState();
    return NextResponse.json(state);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
