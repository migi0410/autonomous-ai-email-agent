import { NextRequest } from "next/server";
import { handleActionRequest } from "@/modules/email-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleActionRequest(request);
}
