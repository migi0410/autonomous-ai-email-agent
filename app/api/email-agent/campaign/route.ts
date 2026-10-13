import { NextRequest } from "next/server";
import { handleGetCampaign, handleCreateCampaign } from "@/modules/email-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleGetCampaign(request);
}

export async function POST(request: NextRequest) {
  return handleCreateCampaign(request);
}
