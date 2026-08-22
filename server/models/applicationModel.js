const pool = require('../config/db');

async function createApplication({ jobId, candidateId, resumeUrl, parsedData }) {
  const result = await pool.query(
    `INSERT INTO applications (job_id, candidate_id, resume_url, parsed_data)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [jobId, candidateId, resumeUrl, parsedData]
  );
  return result.rows[0];
}

async function findApplicationByJobAndCandidate(jobId, candidateId) {
  const result = await pool.query(
    `SELECT * FROM applications WHERE job_id = $1 AND candidate_id = $2`,
    [jobId, candidateId]
  );
  return result.rows[0] || null;
}

async function listApplicationsByCandidate(candidateId) {
  const result = await pool.query(
    `SELECT applications.*, jobs.title AS job_title, jobs.department AS job_department, jobs.location AS job_location
     FROM applications
     JOIN jobs ON jobs.id = applications.job_id
     WHERE applications.candidate_id = $1
     ORDER BY applications.created_at DESC`,
    [candidateId]
  );
  return result.rows;
}

async function listApplicationsByJob(jobId) {
  const result = await pool.query(
    `SELECT applications.*, users.name AS candidate_name, users.email AS candidate_email
     FROM applications
     JOIN users ON users.id = applications.candidate_id
     WHERE applications.job_id = $1
     ORDER BY applications.created_at DESC`,
    [jobId]
  );
  return result.rows;
}

module.exports = {
  createApplication,
  findApplicationByJobAndCandidate,
  listApplicationsByCandidate,
  listApplicationsByJob,
};
