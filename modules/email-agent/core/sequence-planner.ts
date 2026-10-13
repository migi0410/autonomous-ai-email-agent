import {
  getActiveAutonomousCampaign,
  updateCampaignProgress,
  updateSubscriberStepAndSegment,
} from "../storage/agent-store";
import { evaluateSubscriberBehavior, adaptSubjectForSegment } from "./evaluator";
import { enqueueAutonomousStepJob, sendEmailDirectly } from "./dispatcher";
import { AutonomousCampaign, AutonomousSubscriber, BehaviorSegment } from "../types";

export interface TickResult {
  success: boolean;
  message: string;
  processedCount: number;
  campaignId?: number;
}

/**
 * Chu kỳ tự động kiểm tra và điều phối gửi các bước tiếp theo (Tick)
 * Có thể được gọi bởi Cron hoặc thủ công (forceRun)
 */
export async function runAutonomousSequenceTick(forceRun = false): Promise<TickResult> {
  const activeData = await getActiveAutonomousCampaign();
  const campaign = activeData.campaign;

  if (!campaign || campaign.status !== "running") {
    return {
      success: true,
      message: "Không có chiến dịch tự động nào đang chạy.",
      processedCount: 0,
    };
  }

  const subscribers = activeData.subscribers.filter((s) => s.status === "active");
  if (subscribers.length === 0) {
    await updateCampaignProgress(campaign.id, campaign.total_weeks, true);
    return {
      success: true,
      message: "Tất cả đối tượng đã hoàn thành chuỗi chiến dịch.",
      processedCount: 0,
      campaignId: campaign.id,
    };
  }

  const now = new Date();
  const dueSubscribers = subscribers.filter((s) => {
    if (forceRun) return true;
    if (!s.next_due_at) return false;
    return new Date(s.next_due_at) <= now;
  });

  if (dueSubscribers.length === 0) {
    return {
      success: true,
      message: "Chưa có đối tượng nào đến hạn gửi tiếp theo.",
      processedCount: 0,
      campaignId: campaign.id,
    };
  }

  const blueprint = campaign.sequence_blueprint || [];
  let processedCount = 0;

  for (const sub of dueSubscribers) {
    const stepIndex = sub.last_sent_at ? sub.current_step : 0;
    const stepData = blueprint[stepIndex] || blueprint[0];
    if (!stepData) continue;

    // 1. Đánh giá hành vi người nhận
    let segment: BehaviorSegment = "pending";
    if (sub.last_sent_at) {
      segment = await evaluateSubscriberBehavior(sub.email, campaign.name);
    }

    // 2. Tinh chỉnh nội dung theo nhánh hành vi
    const finalSubject = adaptSubjectForSegment(stepData.subject, segment);
    const finalHtml = stepData.html;

    // 3. Gửi email
    const sendRes = await sendEmailDirectly({
      smtp: campaign.smtp_config,
      recipient: {
        email: sub.email,
        companyName: sub.company_name,
        contactName: sub.contact_name,
      },
      subject: finalSubject,
      htmlContent: finalHtml,
      campaignName: `${campaign.name}_step${stepIndex + 1}_${segment}`,
      trackingConfig: campaign.tracking_config,
    });

    const nextStepIndex = stepIndex + 1;
    const isFinished = nextStepIndex >= blueprint.length;
    let nextDueAt: string | null = null;

    if (!isFinished) {
      const nextStepDelayDays = Number(blueprint[nextStepIndex]?.delayDays) || 7;
      nextDueAt = new Date(Date.now() + nextStepDelayDays * 24 * 60 * 60 * 1000).toISOString();
    }

    await updateSubscriberStepAndSegment({
      subscriberId: sub.id,
      newStep: nextStepIndex,
      segment,
      nextDueAt,
      status: isFinished ? "completed" : "active",
      logMessage: sendRes.success
        ? `Tự động gửi Bước ${stepIndex + 1} (${stepData.weekTitle || `Tuần ${stepIndex + 1}`}) qua nhánh [${segment}].`
        : `Lỗi gửi Bước ${stepIndex + 1}: ${sendRes.error}`,
    });

    processedCount++;
    // Delay ngắn giữa các email trong tick
    await new Promise((r) => setTimeout(r, 1200));
  }

  return {
    success: true,
    message: `Đã xử lý xong ${processedCount} đối tượng đến hạn.`,
    processedCount,
    campaignId: campaign.id,
  };
}
