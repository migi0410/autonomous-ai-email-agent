import { NextRequest } from "next/server";
import { handleCronTick } from "@/modules/email-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  return handleCronTick(request);
}

export async function POST(request: NextRequest) {
  return handleCronTick(request);
}
