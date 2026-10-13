import { NextRequest, NextResponse } from "next/server";
import {
  createAutonomousCampaign,
  getActiveAutonomousCampaign,
} from "../storage/agent-store";

export async function handleGetCampaign(request: NextRequest) {
  try {
    const data = await getActiveAutonomousCampaign();
    return NextResponse.json({
      success: true,
      campaign: data.campaign,
      subscribers: data.subscribers,
      segmentCounts: data.segmentCounts,
    });
  } catch (err: any) {
    console.error("[EmailAgent API] Get campaign error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function handleCreateCampaign(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, channel_type, smtp_config, sequence_blueprint, tracking_config, subscribers } = body;

    if (!name || !sequence_blueprint || !subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Thiếu thông tin tên chiến dịch, kịch bản chuỗi hoặc danh sách người nhận.",
      }, { status: 400 });
    }

    const result = await createAutonomousCampaign({
      name,
      total_weeks: sequence_blueprint.length,
      channel_type: channel_type || "gmail",
      smtp_config,
      sequence_blueprint,
      tracking_config,
      subscribers,
    });

    return NextResponse.json({
      success: true,
      message: `🎉 Đã kích hoạt chiến dịch tự động thành công với ${result.subscriberCount} đối tượng!`,
      campaign: result.campaign,
      subscriberCount: result.subscriberCount,
    });
  } catch (err: any) {
    console.error("[EmailAgent API] Create campaign error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
