-- Migration: Search, Comparison & Subscription Tier Schema
-- Project: Real Estate Deal Evaluator
-- Database: postgresql
-- Depends on: 00-auth-schema.sql (users table)

-- ========================================
-- PROPERTY SEARCH & LISTINGS
-- ========================================

CREATE TABLE IF NOT EXISTS property_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  query VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(10),
  property_type VARCHAR(50),
  min_price DECIMAL(12,2),
  max_price DECIMAL(12,2),
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_property_searches_user ON property_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_property_searches_location ON property_searches(state, city, zip);
COMMENT ON TABLE property_searches IS 'User search history for property discovery. user_id nullable for anonymous searches.';

CREATE TABLE IF NOT EXISTS extracted_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source VARCHAR(50),
  source_url VARCHAR(1000),
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(10),
  price DECIMAL(12,2),
  beds INTEGER,
  baths DECIMAL(4,1),
  sqft INTEGER,
  lot_size DECIMAL(10,2),
  year_built INTEGER,
  property_type VARCHAR(50),
  tax_amount DECIMAL(10,2),
  hoa DECIMAL(10,2),
  listing_status VARCHAR(50),
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_extracted_listings_user ON extracted_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_extracted_listings_location ON extracted_listings(state, city, zip);
CREATE INDEX IF NOT EXISTS idx_extracted_listings_source ON extracted_listings(source);
COMMENT ON TABLE extracted_listings IS 'Properties extracted from NLS/MLS listing sites via Chrome extension or search import.';

-- ========================================
-- MULTI-PROPERTY COMPARISON
-- ========================================

CREATE TABLE IF NOT EXISTS comparison_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  share_token VARCHAR(64) UNIQUE,
  share_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comparison_sets_user ON comparison_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_comparison_sets_share ON comparison_sets(share_token);
COMMENT ON TABLE comparison_sets IS 'Named sets of properties for side-by-side metric comparison.';

CREATE TABLE IF NOT EXISTS comparison_set_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES comparison_sets(id) ON DELETE CASCADE,
  saved_property_id UUID NOT NULL REFERENCES saved_properties(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(set_id, saved_property_id)
);

CREATE INDEX IF NOT EXISTS idx_comparison_items_set ON comparison_set_items(set_id);
COMMENT ON TABLE comparison_set_items IS 'Properties within a comparison set. Max 3 (free) or 10 (paid) per set.';

-- ========================================
-- SUBSCRIPTION TIER
-- ========================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS evaluations_this_month INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS evaluation_month_reset DATE DEFAULT CURRENT_DATE;

-- ========================================
-- RECORD SCHEMA VERSION
-- ========================================

INSERT INTO _schema_version (schema_hash, version, source) VALUES ('a2f3b8c901d4e567', 2, 'migration');
