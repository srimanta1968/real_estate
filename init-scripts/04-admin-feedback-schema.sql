-- Admin & Feedback schema
-- Adds feedback table for customers and onboarding email log for admin

-- Customer feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'general',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Onboarding email log
CREATE TABLE IF NOT EXISTS admin_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  recipient_user_id UUID NOT NULL REFERENCES users(id),
  email_type VARCHAR(50) NOT NULL DEFAULT 'onboarding',
  subject VARCHAR(255),
  body TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_email_log_recipient ON admin_email_log(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_email_log_type ON admin_email_log(email_type);

-- Trial credit grants log
CREATE TABLE IF NOT EXISTS admin_credit_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID NOT NULL REFERENCES users(id),
  credits_granted INTEGER NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_credit_grants_target ON admin_credit_grants(target_user_id);
