-- Full resume text for ranking (kept out of list payloads; never selected by list queries).
ALTER TABLE applications ADD COLUMN resume_text TEXT;

-- Audit trail for pipeline status changes.
CREATE TABLE application_status_history (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status application_status,
  to_status application_status NOT NULL,
  changed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_status_history_application ON application_status_history (application_id, created_at);

-- Candidate-facing job listing sorts open jobs by recency.
CREATE INDEX idx_jobs_status_created ON jobs (status, created_at DESC);
