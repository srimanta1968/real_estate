-- Subscription & Billing Schema
-- Extends users table with Stripe subscription fields and adds credit tracking

-- Add subscription columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_used_this_period INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_limit INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_report_used BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Credit Usage Tracking
-- Each row represents credits consumed for a single report or comparison property
CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_address VARCHAR(500),
  report_type VARCHAR(20) NOT NULL DEFAULT 'single',
  comparison_set_id UUID,
  credits_consumed INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_usage_user ON credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created ON credit_usage(created_at);

COMMENT ON TABLE credit_usage IS 'Tracks per-property credit consumption for billing. report_type: single or comparison';

-- Billing Events Audit Log
-- Stores all Stripe webhook events for debugging and audit
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_events_user ON billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe ON billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);

COMMENT ON TABLE billing_events IS 'Stripe webhook event audit log for subscription lifecycle tracking';
