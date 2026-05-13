-- Studio OS - Project Deliverables
-- Run after 001_initial_schema.sql.

CREATE TABLE IF NOT EXISTS project_deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  storage_path TEXT,
  file_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT project_deliverables_has_target CHECK (
    url IS NOT NULL OR storage_path IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_project_deliverables_project_id
  ON project_deliverables(project_id);

ALTER TABLE project_deliverables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read deliverables for accessible projects"
  ON project_deliverables;

CREATE POLICY "Users can read deliverables for accessible projects"
  ON project_deliverables FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects)
  );
