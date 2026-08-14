/*
  # javari Unified Dashboard - Initial Schema
  
  Complete database schema for the unified dashboard system including:
  - Identity & Access (Users, Orgs, Memberships, Roles)
  - Billing (Plans, Subscriptions, Invoices)
  - Credits System (Wallets, Transactions, Meters, Price Maps)
  - Apps & Plugins (Apps, Versions, Installs, Permissions)
  - Assets & Content
  - Operations (Audit Logs, Webhooks, Feature Flags)
*/

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for NextAuth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  email_verified TIMESTAMPTZ,
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Accounts table (for NextAuth OAuth)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

-- Sessions table (for NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  session_token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

-- Verification tokens (for NextAuth)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  UNIQUE(identifier, token)
);

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Memberships (user-org relationships with roles)
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Invites
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Plans
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  code TEXT UNIQUE NOT NULL CHECK (code IN ('STARTER', 'PRO', 'SCALE')),
  name TEXT NOT NULL,
  monthly_usd INTEGER DEFAULT 0,
  included_credits INTEGER DEFAULT 0,
  discount_pct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'PAUSED')),
  provider TEXT NOT NULL CHECK (provider IN ('STRIPE', 'PAYPAL')),
  external_id TEXT,
  external_customer_id TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount_usd INTEGER NOT NULL,
  description TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('STRIPE', 'PAYPAL')),
  external_id TEXT,
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,
  receipt_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Credit Wallets
CREATE TABLE IF NOT EXISTS credit_wallets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  scope TEXT NOT NULL CHECK (scope IN ('ORG', 'USER')),
  org_id TEXT UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT,
  balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Credit Transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  wallet_id TEXT NOT NULL REFERENCES credit_wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('TOPUP', 'BONUS', 'SPEND', 'REFUND', 'ADJUST')),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  meter_id TEXT,
  app_id TEXT,
  task_type TEXT,
  user_id TEXT,
  correlation_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_wallet ON credit_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_correlation ON credit_transactions(correlation_id);

-- Auto Recharge
CREATE TABLE IF NOT EXISTS auto_recharges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  wallet_id TEXT NOT NULL REFERENCES credit_wallets(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  threshold INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Apps
CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  app_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Meters (for pricing)
CREATE TABLE IF NOT EXISTS meters (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  app_id TEXT REFERENCES apps(id),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Price Maps (plan-specific pricing)
CREATE TABLE IF NOT EXISTS price_maps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  meter_id TEXT NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, meter_id)
);

-- App Versions
CREATE TABLE IF NOT EXISTS app_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  manifest JSONB NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app_id, version)
);

-- App Installs
CREATE TABLE IF NOT EXISTS app_installs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  version_id TEXT NOT NULL REFERENCES app_versions(id),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, app_id)
);

-- App Permissions
CREATE TABLE IF NOT EXISTS app_permissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  label TEXT NOT NULL,
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- App Task Types
CREATE TABLE IF NOT EXISTS app_task_types (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app_id, code)
);

-- Assets
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('LOGO', 'BRAND_KIT', 'NEWSLETTER_RSS', 'OTHER')),
  url TEXT NOT NULL,
  name TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Newsletter Subscriptions
CREATE TABLE IF NOT EXISTS newsletter_subs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, email)
);

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, key)
);

-- Webhook Events
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('STRIPE', 'PAYPAL')),
  event_type TEXT NOT NULL,
  event_id TEXT UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider, processed);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT,
  target_id TEXT,
  meta JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Add foreign keys that reference meters and apps
ALTER TABLE credit_transactions 
  ADD CONSTRAINT fk_credit_transactions_meter 
  FOREIGN KEY (meter_id) REFERENCES meters(id) ON DELETE SET NULL;

ALTER TABLE credit_transactions 
  ADD CONSTRAINT fk_credit_transactions_app 
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE SET NULL;
