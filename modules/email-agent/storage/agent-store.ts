import { getDb } from "@/lib/db";
import fs from "fs";
import path from "path";
import {
  AutonomousCampaign,
  AutonomousSubscriber,
  ChannelType,
  SegmentCounts,
  SequenceStep,
  SmtpConfig,
} from "../types";

const FALLBACK_DIR = path.join(process.cwd(), "data");
const FALLBACK_CAMPAIGNS_FILE = path.join(FALLBACK_DIR, "autonomous_campaigns.json");
const FALLBACK_SUBSCRIBERS_FILE = path.join(FALLBACK_DIR, "autonomous_subscribers.json");

function ensureFallbackFiles() {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    if (!fs.existsSync(FALLBACK_CAMPAIGNS_FILE)) {
      fs.writeFileSync(FALLBACK_CAMPAIGNS_FILE, JSON.stringify([]), "utf-8");
    }
    if (!fs.existsSync(FALLBACK_SUBSCRIBERS_FILE)) {
      fs.writeFileSync(FALLBACK_SUBSCRIBERS_FILE, JSON.stringify([]), "utf-8");
    }
  } catch (err) {
    console.warn("[AgentStore] Fallback filesystem warning:", err);
  }
}

function readFallbackData<T>(file: string): T[] {
  try {
    ensureFallbackFiles();
    const content = fs.readFileSync(file, "utf-8");
    return JSON.parse(content) || [];
  } catch {
    return [];
  }
}

function writeFallbackData<T>(file: string, data: T[]) {
  try {
    ensureFallbackFiles();
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[AgentStore] Write fallback data error:", err);
  }
}

let isInitialized = false;

export async function ensureAgentTables(): Promise<boolean> {
  if (isInitialized) return true;
  try {
    const pool = getDb();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS autonomous_campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'running',
        total_weeks INT DEFAULT 3,
        current_week INT DEFAULT 1,
        channel_type VARCHAR(20) DEFAULT 'gmail',
        smtp_config JSONB NOT NULL,
        sequence_blueprint JSONB NOT NULL,
        tracking_config JSONB,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        next_run_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS autonomous_subscribers (
        id SERIAL PRIMARY KEY,
        campaign_id INT REFERENCES autonomous_campaigns(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        contact_name VARCHAR(255),
        current_step INT DEFAULT 1,
        behavior_segment VARCHAR(50) DEFAULT 'pending',
        status VARCHAR(50) DEFAULT 'active',
        last_sent_at TIMESTAMP WITH TIME ZONE,
        next_due_at TIMESTAMP WITH TIME ZONE,
        logs JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_auto_campaigns_status ON autonomous_campaigns(status);
      CREATE INDEX IF NOT EXISTS idx_auto_subscribers_campaign ON autonomous_subscribers(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_auto_subscribers_due ON autonomous_subscribers(next_due_at, status);
      CREATE INDEX IF NOT EXISTS idx_auto_subscribers_email ON autonomous_subscribers(email);
    `);
    isInitialized = true;
    return true;
  } catch (err) {
    console.warn("[AgentStore] PostgreSQL unavailable, using JSON fallback:", (err as Error).message);
    ensureFallbackFiles();
    return false;
  }
}

export async function createAutonomousCampaign(data: {
  name: string;
  total_weeks: number;
  channel_type: ChannelType;
  smtp_config: SmtpConfig;
  sequence_blueprint: SequenceStep[];
  tracking_config?: { openTracking: boolean; clickTracking: boolean };
  subscribers: Array<{ email: string; company_name: string; contact_name: string }>;
}): Promise<{ campaign: AutonomousCampaign; subscriberCount: number }> {
  const hasPg = await ensureAgentTables();
  const now = new Date();

  const step2DelayDays = Number(data.sequence_blueprint?.[1]?.delayDays) || 7;
  const nextRun = new Date(now.getTime() + step2DelayDays * 24 * 60 * 60 * 1000);

  if (hasPg) {
    try {
      const pool = getDb();
      const campRes = await pool.query(
        `INSERT INTO autonomous_campaigns (
          name, status, total_weeks, current_week, channel_type, smtp_config, sequence_blueprint, tracking_config, started_at, next_run_at
        ) VALUES ($1, 'running', $2, 1, $3, $4, $5, $6, $7, $8) RETURNING *;`,
        [
          data.name,
          data.total_weeks,
          data.channel_type,
          JSON.stringify(data.smtp_config),
          JSON.stringify(data.sequence_blueprint),
          JSON.stringify(data.tracking_config || { openTracking: true, clickTracking: true }),
          now.toISOString(),
          nextRun.toISOString(),
        ]
      );

      const campaign: AutonomousCampaign = campRes.rows[0];

      if (data.subscribers.length > 0) {
        const values: string[] = [];
        const params: any[] = [];
        let pIdx = 1;

        for (const sub of data.subscribers) {
          values.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, 1, 'pending', 'active', $${pIdx + 4}, '[]'::jsonb)`);
          params.push(campaign.id, sub.email.toLowerCase().trim(), sub.company_name, sub.contact_name, now.toISOString());
          pIdx += 5;
        }

        await pool.query(
          `INSERT INTO autonomous_subscribers (
            campaign_id, email, company_name, contact_name, current_step, behavior_segment, status, next_due_at, logs
          ) VALUES ${values.join(", ")};`,
          params
        );
      }

      return { campaign, subscriberCount: data.subscribers.length };
    } catch (err) {
      console.error("[AgentStore] PG insert failed, falling back to JSON:", err);
    }
  }

  // Fallback JSON
  const campaigns = readFallbackData<AutonomousCampaign>(FALLBACK_CAMPAIGNS_FILE);
  const subscribers = readFallbackData<AutonomousSubscriber>(FALLBACK_SUBSCRIBERS_FILE);

  const newId = campaigns.length > 0 ? Math.max(...campaigns.map((c) => c.id)) + 1 : 1;
  const newCampaign: AutonomousCampaign = {
    id: newId,
    name: data.name,
    status: "running",
    total_weeks: data.total_weeks,
    current_week: 1,
    channel_type: data.channel_type,
    smtp_config: data.smtp_config,
    sequence_blueprint: data.sequence_blueprint,
    tracking_config: data.tracking_config || { openTracking: true, clickTracking: true },
    started_at: now.toISOString(),
    next_run_at: nextRun.toISOString(),
    completed_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
  campaigns.unshift(newCampaign);
  writeFallbackData(FALLBACK_CAMPAIGNS_FILE, campaigns);

  let subId = subscribers.length > 0 ? Math.max(...subscribers.map((s) => s.id)) + 1 : 1;
  const newSubs: AutonomousSubscriber[] = data.subscribers.map((s) => ({
    id: subId++,
    campaign_id: newId,
    email: s.email.toLowerCase().trim(),
    company_name: s.company_name,
    contact_name: s.contact_name,
    current_step: 1,
    behavior_segment: "pending",
    status: "active",
    last_sent_at: null,
    next_due_at: now.toISOString(),
    logs: [],
    created_at: now.toISOString(),
  }));
  subscribers.push(...newSubs);
  writeFallbackData(FALLBACK_SUBSCRIBERS_FILE, subscribers);

  return { campaign: newCampaign, subscriberCount: newSubs.length };
}

export async function getActiveAutonomousCampaign(): Promise<{
  campaign: AutonomousCampaign | null;
  subscribers: AutonomousSubscriber[];
  segmentCounts: SegmentCounts;
}> {
  const hasPg = await ensureAgentTables();

  if (hasPg) {
    try {
      const pool = getDb();
      const campRes = await pool.query(
        `SELECT * FROM autonomous_campaigns ORDER BY id DESC LIMIT 1;`
      );
      if (campRes.rows.length === 0) {
        return {
          campaign: null,
          subscribers: [],
          segmentCounts: { clicked: 0, opened: 0, unopened: 0, pending: 0, total: 0 },
        };
      }
      const rawCamp = campRes.rows[0];
      const campaign: AutonomousCampaign = {
        ...rawCamp,
        smtp_config: typeof rawCamp.smtp_config === "string" ? JSON.parse(rawCamp.smtp_config) : rawCamp.smtp_config,
        sequence_blueprint: typeof rawCamp.sequence_blueprint === "string" ? JSON.parse(rawCamp.sequence_blueprint) : rawCamp.sequence_blueprint,
        tracking_config: typeof rawCamp.tracking_config === "string" ? JSON.parse(rawCamp.tracking_config) : rawCamp.tracking_config,
      };

      const subRes = await pool.query(
        `SELECT * FROM autonomous_subscribers WHERE campaign_id = $1 ORDER BY id ASC;`,
        [campaign.id]
      );
      const subscribers: AutonomousSubscriber[] = subRes.rows.map((r: any) => ({
        ...r,
        logs: typeof r.logs === "string" ? JSON.parse(r.logs) : r.logs || [],
      }));

      const segmentCounts: SegmentCounts = {
        clicked: subscribers.filter((s) => s.behavior_segment === "clicked").length,
        opened: subscribers.filter((s) => s.behavior_segment === "opened").length,
        unopened: subscribers.filter((s) => s.behavior_segment === "unopened").length,
        pending: subscribers.filter((s) => s.behavior_segment === "pending").length,
        total: subscribers.length,
      };

      return { campaign, subscribers, segmentCounts };
    } catch (err) {
      console.warn("[AgentStore] PG getActiveAutonomousCampaign failed, using fallback:", err);
    }
  }

  // Fallback JSON
  const campaigns = readFallbackData<AutonomousCampaign>(FALLBACK_CAMPAIGNS_FILE);
  const allSubscribers = readFallbackData<AutonomousSubscriber>(FALLBACK_SUBSCRIBERS_FILE);

  const campaign = campaigns[0] || null;
  const subscribers = campaign ? allSubscribers.filter((s) => s.campaign_id === campaign.id) : [];

  const segmentCounts: SegmentCounts = {
    clicked: subscribers.filter((s) => s.behavior_segment === "clicked").length,
    opened: subscribers.filter((s) => s.behavior_segment === "opened").length,
    unopened: subscribers.filter((s) => s.behavior_segment === "unopened").length,
    pending: subscribers.filter((s) => s.behavior_segment === "pending").length,
    total: subscribers.length,
  };

  return { campaign, subscribers, segmentCounts };
}

export async function updateSubscriberStepAndSegment(params: {
  subscriberId: number;
  newStep: number;
  segment: "clicked" | "opened" | "unopened" | "pending";
  nextDueAt: string | null;
  status?: "active" | "completed" | "failed";
  logMessage: string;
}) {
  const { subscriberId, newStep, segment, nextDueAt, status = "active", logMessage } = params;
  const now = new Date().toISOString();
  const hasPg = await ensureAgentTables();

  const newLog = {
    timestamp: now,
    step: newStep,
    segment,
    status: status === "failed" ? "error" : "success",
    message: logMessage,
  };

  if (hasPg) {
    try {
      const pool = getDb();
      await pool.query(
        `UPDATE autonomous_subscribers 
         SET current_step = $1,
             behavior_segment = $2,
             last_sent_at = $3,
             next_due_at = $4,
             status = $5,
             logs = logs || $6::jsonb
         WHERE id = $7;`,
        [newStep, segment, now, nextDueAt, status, JSON.stringify([newLog]), subscriberId]
      );
      return;
    } catch (err) {
      console.warn("[AgentStore] Update subscriber PG failed, fallback to JSON:", err);
    }
  }

  const subscribers = readFallbackData<AutonomousSubscriber>(FALLBACK_SUBSCRIBERS_FILE);
  const idx = subscribers.findIndex((s) => s.id === subscriberId);
  if (idx !== -1) {
    subscribers[idx].current_step = newStep;
    subscribers[idx].behavior_segment = segment;
    subscribers[idx].last_sent_at = now;
    subscribers[idx].next_due_at = nextDueAt;
    subscribers[idx].status = status;
    subscribers[idx].logs = subscribers[idx].logs || [];
    subscribers[idx].logs.push(newLog as any);
    writeFallbackData(FALLBACK_SUBSCRIBERS_FILE, subscribers);
  }
}

export async function updateCampaignProgress(campaignId: number, currentWeek: number, isCompleted = false) {
  const now = new Date().toISOString();
  const hasPg = await ensureAgentTables();

  if (hasPg) {
    try {
      const pool = getDb();
      await pool.query(
        `UPDATE autonomous_campaigns
         SET current_week = $1,
             status = $2,
             completed_at = $3,
             updated_at = $4
         WHERE id = $5;`,
        [currentWeek, isCompleted ? "completed" : "running", isCompleted ? now : null, now, campaignId]
      );
      return;
    } catch (err) {
      console.warn("[AgentStore] Update campaign PG failed:", err);
    }
  }

  const campaigns = readFallbackData<AutonomousCampaign>(FALLBACK_CAMPAIGNS_FILE);
  const idx = campaigns.findIndex((c) => c.id === campaignId);
  if (idx !== -1) {
    campaigns[idx].current_week = currentWeek;
    campaigns[idx].status = isCompleted ? "completed" : "running";
    if (isCompleted) campaigns[idx].completed_at = now;
    campaigns[idx].updated_at = now;
    writeFallbackData(FALLBACK_CAMPAIGNS_FILE, campaigns);
  }
}

export async function pauseAutonomousCampaign(campaignId: number): Promise<boolean> {
  const hasPg = await ensureAgentTables();
  if (hasPg) {
    try {
      const pool = getDb();
      await pool.query(`UPDATE autonomous_campaigns SET status = 'paused', updated_at = NOW() WHERE id = $1`, [campaignId]);
      return true;
    } catch (err) {
      console.error("[AgentStore] Pause PG error:", err);
    }
  }
  const campaigns = readFallbackData<AutonomousCampaign>(FALLBACK_CAMPAIGNS_FILE);
  const camp = campaigns.find((c) => c.id === campaignId);
  if (camp) {
    camp.status = "paused";
    camp.updated_at = new Date().toISOString();
    writeFallbackData(FALLBACK_CAMPAIGNS_FILE, campaigns);
    return true;
  }
  return false;
}

export async function resumeAutonomousCampaign(campaignId: number): Promise<boolean> {
  const hasPg = await ensureAgentTables();
  if (hasPg) {
    try {
      const pool = getDb();
      await pool.query(`UPDATE autonomous_campaigns SET status = 'running', updated_at = NOW() WHERE id = $1`, [campaignId]);
      return true;
    } catch (err) {
      console.error("[AgentStore] Resume PG error:", err);
    }
  }
  const campaigns = readFallbackData<AutonomousCampaign>(FALLBACK_CAMPAIGNS_FILE);
  const camp = campaigns.find((c) => c.id === campaignId);
  if (camp) {
    camp.status = "running";
    camp.updated_at = new Date().toISOString();
    writeFallbackData(FALLBACK_CAMPAIGNS_FILE, campaigns);
    return true;
  }
  return false;
}

export async function resetAutonomousCampaign(campaignId?: number): Promise<boolean> {
  const hasPg = await ensureAgentTables();
  if (hasPg) {
    try {
      const pool = getDb();
      if (campaignId) {
        await pool.query(`DELETE FROM autonomous_campaigns WHERE id = $1`, [campaignId]);
      } else {
        await pool.query(`DELETE FROM autonomous_campaigns`);
      }
      return true;
    } catch (err) {
      console.error("[AgentStore] Reset PG error:", err);
    }
  }
  if (campaignId) {
    let campaigns = readFallbackData<AutonomousCampaign>(FALLBACK_CAMPAIGNS_FILE);
    campaigns = campaigns.filter((c) => c.id !== campaignId);
    writeFallbackData(FALLBACK_CAMPAIGNS_FILE, campaigns);

    let subs = readFallbackData<AutonomousSubscriber>(FALLBACK_SUBSCRIBERS_FILE);
    subs = subs.filter((s) => s.campaign_id !== campaignId);
    writeFallbackData(FALLBACK_SUBSCRIBERS_FILE, subs);
  } else {
    writeFallbackData(FALLBACK_CAMPAIGNS_FILE, []);
    writeFallbackData(FALLBACK_SUBSCRIBERS_FILE, []);
  }
  return true;
}
