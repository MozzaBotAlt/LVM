-- ============================================================================
-- Beyond the Beaker — payment & paywall schema (Neon Postgres)
-- ----------------------------------------------------------------------------
-- These tables have ALREADY been created in the connected Neon database.
-- This file is kept so you can recreate them on a fresh database:
--   psql "$DATABASE_URL" -f schema.sql
-- ============================================================================

-- People who have paid. This is your "user accounts of paid people" table.
CREATE TABLE IF NOT EXISTS paid_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  plan          TEXT NOT NULL,                       -- e.g. 'student_yearly'
  status        TEXT NOT NULL DEFAULT 'active',      -- 'active' | 'expired' | 'pending'
  amount_cents  INTEGER NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'MYR',
  bank          TEXT,                                -- FPX bank code chosen at checkout
  payment_ref   TEXT,                                -- gateway reference of the paying transaction
  starts_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,                         -- NULL = lifetime
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_paid_users_email ON paid_users (email);

-- Every payment attempt (pending, paid, or failed).
CREATE TABLE IF NOT EXISTS payments (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL,
  full_name     TEXT,
  plan          TEXT NOT NULL,
  amount_cents  INTEGER NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'MYR',
  bank          TEXT,
  gateway       TEXT NOT NULL DEFAULT 'manual',      -- 'toyyibpay' | 'billplz' | 'manual' ...
  gateway_ref   TEXT,                                -- id returned by the gateway
  bill_code     TEXT,                                -- bill/collection code at the gateway
  status        TEXT NOT NULL DEFAULT 'pending',     -- 'pending' | 'paid' | 'failed'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_email  ON payments (email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);

-- Free-run counters that power the paywall (3 free runs).
CREATE TABLE IF NOT EXISTS usage_counters (
  id           SERIAL PRIMARY KEY,
  client_id    TEXT UNIQUE NOT NULL,                 -- anonymous device id OR email
  email        TEXT,
  run_count    INTEGER NOT NULL DEFAULT 0,
  last_run_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usage_counters_client ON usage_counters (client_id);
