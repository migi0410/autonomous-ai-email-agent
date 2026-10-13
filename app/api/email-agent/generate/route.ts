import { NextRequest } from "next/server";
import { handleGenerateRequest } from "@/modules/email-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleGenerateRequest(request);
}
