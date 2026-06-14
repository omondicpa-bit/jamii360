-- ============================================================
-- GroupYetu360 v3e Migration
-- Run in Supabase SQL Editor → New tab → paste → Run
-- Safe to re-run (uses IF NOT EXISTS / DO blocks)
-- ============================================================

-- 1. Per-org Daraja fields on organisations table
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS daraja_consumer_key    TEXT,
  ADD COLUMN IF NOT EXISTS daraja_consumer_secret TEXT,
  ADD COLUMN IF NOT EXISTS daraja_shortcode       TEXT,
  ADD COLUMN IF NOT EXISTS daraja_passkey         TEXT,
  ADD COLUMN IF NOT EXISTS daraja_enabled         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS daraja_env             TEXT DEFAULT 'sandbox';

-- 2. Bank balance auto-update fields (may already exist from v3d — safe)
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS bank_balance         NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS bank_balance_updated DATE,
  ADD COLUMN IF NOT EXISTS bank_balance_locked  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_balance_to_members BOOLEAN DEFAULT FALSE;

-- 3. Welfare events active/closed toggle
ALTER TABLE welfare_events
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Set all existing welfare events to active (open) by default
UPDATE welfare_events SET is_active = TRUE WHERE is_active IS NULL;

-- 4. Index for welfare_events is_active queries
CREATE INDEX IF NOT EXISTS idx_welfare_events_is_active
  ON welfare_events(org_id, is_active);

-- 5. Verify columns were added
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('organisations','welfare_events')
  AND column_name IN (
    'daraja_consumer_key','daraja_consumer_secret','daraja_shortcode',
    'daraja_passkey','daraja_enabled','daraja_env',
    'bank_balance','bank_balance_updated','bank_balance_locked',
    'show_balance_to_members','is_active'
  )
ORDER BY table_name, column_name;
