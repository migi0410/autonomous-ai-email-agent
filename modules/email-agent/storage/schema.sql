-- =========================================================================
-- MODULE: AI EMAIL AGENT DATABASE SCHEMA
-- Standalone PostgreSQL schema for Autonomous Multi-Week Email Sequences
-- =========================================================================

CREATE TABLE IF NOT EXISTS autonomous_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'running', -- 'running', 'paused', 'completed'
  total_weeks INT DEFAULT 3,
  current_week INT DEFAULT 1,
  channel_type VARCHAR(20) DEFAULT 'gmail', -- 'gmail', 'smtp'
  smtp_config JSONB NOT NULL,
  sequence_blueprint JSONB NOT NULL,
  tracking_config JSONB DEFAULT '{"openTracking": true, "clickTracking": true}'::jsonb,
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
  behavior_segment VARCHAR(50) DEFAULT 'pending', -- 'pending', 'clicked', 'opened', 'unopened'
  status VARCHAR(50) DEFAULT 'active',            -- 'active', 'completed', 'unsubscribed', 'failed'
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_due_at TIMESTAMP WITH TIME ZONE,
  logs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auto_campaigns_status ON autonomous_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_auto_subscribers_campaign ON autonomous_subscribers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_auto_subscribers_due ON autonomous_subscribers(next_due_at, status);
CREATE INDEX IF NOT EXISTS idx_auto_subscribers_email ON autonomous_subscribers(email);
