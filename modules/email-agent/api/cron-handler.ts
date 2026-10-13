import { NextRequest, NextResponse } from "next/server";
import { runAutonomousSequenceTick } from "../core/sequence-planner";

export async function handleCronTick(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRun = searchParams.get("forceRun") === "true";

    const result = await runAutonomousSequenceTick(forceRun);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[EmailAgent API] Cron tick error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
