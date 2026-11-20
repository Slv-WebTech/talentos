ALTER TABLE applications
  ADD COLUMN resume_public_id VARCHAR(1024),
  ADD COLUMN ranking_details JSONB;

CREATE INDEX idx_applications_job_ranking ON applications (job_id, ranking_score DESC NULLS LAST);
