import { getDb } from "@/lib/db";
import { BehaviorSegment } from "../types";

export async function evaluateSubscriberBehavior(
  email: string,
  campaignName: string
): Promise<BehaviorSegment> {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const pool = getDb();

    // 1. Kiểm tra click (Ưu tiên cao nhất)
    const clickRes = await pool.query(
      `SELECT id FROM email_tracking_logs 
       WHERE LOWER(email) = $1 AND event_type = 'click'
       LIMIT 1;`,
      [cleanEmail]
    );
    if (clickRes.rows.length > 0) return "clicked";

    // 2. Kiểm tra open
    const openRes = await pool.query(
      `SELECT id FROM email_tracking_logs 
       WHERE LOWER(email) = $1 AND event_type = 'open'
       LIMIT 1;`,
      [cleanEmail]
    );
    if (openRes.rows.length > 0) return "opened";

    return "unopened";
  } catch (err) {
    console.warn("[Evaluator] Error evaluating tracking logs, defaulting to unopened:", err);
    return "unopened";
  }
}

export function adaptSubjectForSegment(
  baseSubject: string,
  segment: BehaviorSegment
): string {
  switch (segment) {
    case "clicked":
      return `⚡ [Ưu Đãi 1-1 Riêng] ${baseSubject.replace(/^⚡\s*|\[Ưu Đãi 1-1 Riêng\]\s*/gi, "")}`;
    case "opened":
      return `🔍 [Góc Nhìn Thực Tế] ${baseSubject.replace(/^🔍\s*|\[Góc Nhìn Thực Tế\]\s*/gi, "")}`;
    case "unopened":
      return `📌 [Quan Trọng] ${baseSubject.replace(/^📌\s*|\[Quan Trọng\]\s*/gi, "")}`;
    default:
      return baseSubject;
  }
}
