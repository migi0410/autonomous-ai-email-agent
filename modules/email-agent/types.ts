export type DesignStyle = "modern_saas" | "minimal_apple" | "luxury_premium" | "warm_friendly";
export type Tone = "professional" | "friendly" | "persuasive" | "urgent" | "concise";
export type Language = "vi" | "en" | "zh" | "ko";
export type ChannelType = "gmail" | "smtp";
export type BehaviorSegment = "pending" | "clicked" | "opened" | "unopened";
export type SubscriberStatus = "active" | "completed" | "unsubscribed" | "failed";

export interface BrandPreset {
  id: string;
  name: string;
  badge: string;
  brandName: string;
  brandColor: string;
  senderInfo: string;
  logoUrl: string;
  websiteUrl: string;
  designStyle: DesignStyle;
  tone: Tone;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
}

export interface SmtpPreset {
  id: string;
  name: string;
  badge: string;
  config: SmtpConfig;
}

export interface SequenceStep {
  step: number;
  weekTitle: string;
  delayDays: number;
  condition: "all" | "opened_prev" | "not_opened_prev" | "clicked_prev";
  subject: string;
  preheader: string;
  html: string;
  strategyNote?: string;
}

export interface RecipientContact {
  email: string;
  companyName: string;
  contactName?: string;
  phone?: string;
  country?: string;
}

export interface SubscriberLog {
  timestamp: string;
  step: number;
  segment?: string;
  status: "success" | "error" | "sending" | "pending";
  message: string;
}

export interface AutonomousSubscriber {
  id: number;
  campaign_id: number;
  email: string;
  company_name: string;
  contact_name: string;
  current_step: number;
  behavior_segment: BehaviorSegment;
  status: SubscriberStatus;
  last_sent_at: string | null;
  next_due_at: string | null;
  logs: SubscriberLog[];
  created_at: string;
}

export interface AutonomousCampaign {
  id: number;
  name: string;
  status: "running" | "paused" | "completed";
  total_weeks: number;
  current_week: number;
  channel_type: ChannelType;
  smtp_config: SmtpConfig;
  sequence_blueprint: SequenceStep[];
  tracking_config: {
    openTracking: boolean;
    clickTracking: boolean;
  };
  started_at: string;
  next_run_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SegmentCounts {
  clicked: number;
  opened: number;
  unopened: number;
  pending: number;
  total: number;
}
