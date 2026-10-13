import { NextRequest, NextResponse } from "next/server";
import {
  getActiveAutonomousCampaign,
  pauseAutonomousCampaign,
  resumeAutonomousCampaign,
  resetAutonomousCampaign,
} from "../storage/agent-store";

export async function handleActionRequest(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, campaignId } = body;

    const activeData = await getActiveAutonomousCampaign();
    const targetId = campaignId || activeData.campaign?.id;

    if (!targetId && action !== "reset") {
      return NextResponse.json({ success: false, error: "Không tìm thấy chiến dịch để thực hiện hành động." }, { status: 400 });
    }

    switch (action) {
      case "pause": {
        await pauseAutonomousCampaign(targetId);
        return NextResponse.json({ success: true, message: "Đã tạm dừng chiến dịch tự động." });
      }
      case "resume": {
        await resumeAutonomousCampaign(targetId);
        return NextResponse.json({ success: true, message: "Đã tiếp tục chiến dịch tự động." });
      }
      case "reset": {
        await resetAutonomousCampaign(targetId);
        return NextResponse.json({ success: true, message: "Đã xóa và đặt lại chiến dịch tự động." });
      }
      default:
        return NextResponse.json({ success: false, error: `Hành động không hợp lệ: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error("[EmailAgent API] Action error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
