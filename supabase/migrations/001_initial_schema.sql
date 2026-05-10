-- ============================================================
-- Studio OS — Initial Schema Migration
-- ============================================================
-- Run this in the Supabase SQL Editor to create all MVP tables.
-- All price fields store CENTS (smallest currency unit).
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (synced from Clerk)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  clerk_org_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  agency_id UUID,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX idx_profiles_agency_id ON profiles(agency_id);

-- ============================================================
-- AGENCIES (synced from Clerk Organizations)
-- ============================================================
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  brand_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK from profiles to agencies (after agencies exists)
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_agency
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'proposal_sent', 'signed', 'awaiting_deposit',
    'active', 'completed', 'maintenance'
  )),
  current_phase INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projects_agency_id ON projects(agency_id);
CREATE INDEX idx_projects_client_profile_id ON projects(client_profile_id);

-- ============================================================
-- PROPOSALS
-- ============================================================
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  markdown_content TEXT,
  base_price BIGINT NOT NULL,
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_proposals_project_id ON proposals(project_id);

-- ============================================================
-- PROPOSAL ADD-ONS
-- ============================================================
CREATE TABLE proposal_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0
);

CREATE INDEX idx_proposal_addons_proposal_id ON proposal_addons(proposal_id);

-- ============================================================
-- CONTRACTS (signed agreements)
-- ============================================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proposal_snapshot JSONB NOT NULL,
  selected_addons JSONB NOT NULL DEFAULT '[]',
  total_price BIGINT NOT NULL,
  signature_data TEXT NOT NULL,
  signer_ip INET,
  signed_at TIMESTAMPTZ DEFAULT now(),
  pdf_storage_path TEXT
);

CREATE INDEX idx_contracts_project_id ON contracts(project_id);

-- ============================================================
-- PAYMENTS (DodoPayments)
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  dodo_checkout_session_id TEXT,
  dodo_payment_id TEXT,
  dodo_product_id TEXT,
  amount BIGINT NOT NULL,
  currency TEXT DEFAULT 'usd',
  type TEXT NOT NULL CHECK (type IN ('deposit', 'final')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  idempotency_key UUID UNIQUE DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_project_id ON payments(project_id);

-- ============================================================
-- DODO WEBHOOK EVENTS (idempotency / dedup)
-- ============================================================
CREATE TABLE dodo_events (
  webhook_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload_type TEXT,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ASSETS (file vault)
-- ============================================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assets_project_id ON assets(project_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dodo_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- PROFILES: service role can insert (Clerk webhook sync)
-- Note: service_role bypasses RLS, so no explicit policy needed for inserts from webhooks.

-- AGENCIES: members can read their agency
CREATE POLICY "Members can read own agency"
  ON agencies FOR SELECT
  USING (
    id IN (
      SELECT agency_id FROM profiles
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- PROJECTS: admins see agency projects, clients see their own
CREATE POLICY "Admins see agency projects"
  ON projects FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role = 'admin'
    )
  );

CREATE POLICY "Clients see own projects"
  ON projects FOR SELECT
  USING (
    client_profile_id IN (
      SELECT id FROM profiles
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- PROJECTS: admins can insert/update
CREATE POLICY "Admins can insert projects"
  ON projects FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role = 'admin'
    )
  );

-- PROPOSALS: follow project access
CREATE POLICY "Users can read proposals for accessible projects"
  ON proposals FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects)
  );

CREATE POLICY "Admins can manage proposals"
  ON proposals FOR ALL
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.agency_id = p.agency_id
      WHERE pr.clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND pr.role = 'admin'
    )
  );

-- PROPOSAL_ADDONS: follow proposal access
CREATE POLICY "Users can read addons for accessible proposals"
  ON proposal_addons FOR SELECT
  USING (
    proposal_id IN (SELECT id FROM proposals)
  );

CREATE POLICY "Admins can manage addons"
  ON proposal_addons FOR ALL
  USING (
    proposal_id IN (
      SELECT pr.id FROM proposals pr
      JOIN projects p ON p.id = pr.project_id
      JOIN profiles pf ON pf.agency_id = p.agency_id
      WHERE pf.clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND pf.role = 'admin'
    )
  );

-- CONTRACTS: follow project access
CREATE POLICY "Users can read contracts for accessible projects"
  ON contracts FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects)
  );

-- PAYMENTS: follow project access
CREATE POLICY "Users can read payments for accessible projects"
  ON payments FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects)
  );

-- DODO_EVENTS: only service role (webhooks) — no user access needed
CREATE POLICY "No direct user access to dodo_events"
  ON dodo_events FOR SELECT
  USING (false);

-- ASSETS: follow project access
CREATE POLICY "Users can read assets for accessible projects"
  ON assets FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects)
  );

CREATE POLICY "Users can upload assets to accessible projects"
  ON assets FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM projects)
  );

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
