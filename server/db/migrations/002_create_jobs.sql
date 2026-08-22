CREATE TYPE job_status AS ENUM ('open', 'closed');

CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  recruiter_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  min_experience_years INTEGER,
  salary_min INTEGER,
  salary_max INTEGER,
  location VARCHAR(255),
  status job_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_status ON jobs (status);
CREATE INDEX idx_jobs_recruiter_id ON jobs (recruiter_id);
