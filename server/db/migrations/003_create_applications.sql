CREATE TYPE application_status AS ENUM ('applied', 'shortlisted', 'interview_scheduled', 'selected', 'rejected');

CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  candidate_id INTEGER NOT NULL REFERENCES users(id),
  resume_url VARCHAR(1024) NOT NULL,
  parsed_data JSONB,
  ranking_score REAL,
  pipeline_status application_status NOT NULL DEFAULT 'applied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, candidate_id)
);

CREATE INDEX idx_applications_job_id ON applications (job_id);
CREATE INDEX idx_applications_candidate_id ON applications (candidate_id);
CREATE INDEX idx_applications_pipeline_status ON applications (pipeline_status);
