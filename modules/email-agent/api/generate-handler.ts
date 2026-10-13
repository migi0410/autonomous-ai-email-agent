import { NextRequest, NextResponse } from "next/server";
import { draftSingleEmail, draftSequence } from "../core/drafter";

export async function handleGenerateRequest(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, campaignMode = "single" } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập prompt yêu cầu." }, { status: 400 });
    }

    if (campaignMode === "sequence") {
      const result = await draftSequence(body);
      return NextResponse.json({
        success: true,
        isSequence: true,
        steps: result.steps,
        provider: result.provider,
        model: result.model,
      });
    } else {
      const result = await draftSingleEmail(body);
      return NextResponse.json({
        success: true,
        isSequence: false,
        subject: result.subject,
        preheader: result.preheader,
        html: result.html,
        provider: result.provider,
        model: result.model,
      });
    }
  } catch (err: any) {
    console.error("[EmailAgent API] Generate error:", err);
    return NextResponse.json({ success: false, error: err.message || "Lỗi khi sinh email" }, { status: 500 });
  }
}
