const pool = require('../config/db');

// Never select resume_url / resume_public_id: resumes are served via short-lived signed URLs.
const PUBLIC_COLUMNS = `applications.id, applications.job_id, applications.candidate_id,
  applications.parsed_data, applications.ranking_score, applications.ranking_details,
  applications.pipeline_status, applications.created_at, applications.updated_at`;

async function createApplication({ jobId, candidateId, resumeUrl, resumePublicId, resumeText, parsedData, rankingScore, rankingDetails }) {
  const result = await pool.query(
    `INSERT INTO applications
       (job_id, candidate_id, resume_url, resume_public_id, resume_text, parsed_data, ranking_score, ranking_details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, job_id, candidate_id, parsed_data, ranking_score, ranking_details, pipeline_status, created_at, updated_at`,
    [jobId, candidateId, resumeUrl, resumePublicId, resumeText ?? null, parsedData, rankingScore ?? null, rankingDetails ?? null]
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

async function listApplicationsByCandidate(candidateId, { limit, offset }) {
  const result = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, jobs.title AS job_title, jobs.department AS job_department, jobs.location AS job_location
     FROM applications
     JOIN jobs ON jobs.id = applications.job_id
     WHERE applications.candidate_id = $1
     ORDER BY applications.created_at DESC
     LIMIT $2 OFFSET $3`,
    [candidateId, limit + 1, offset]
  );
  return result.rows;
}

const likeEscape = (text) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

async function listApplicationsByJob(jobId, { limit, offset, status, q, sort }) {
  const params = [jobId];
  let where = 'applications.job_id = $1';
  if (status) {
    params.push(status);
    where += ` AND applications.pipeline_status = $${params.length}`;
  }
  if (q) {
    params.push(`%${likeEscape(q)}%`);
    where += ` AND (users.name ILIKE $${params.length} OR users.email ILIKE $${params.length})`;
  }
  const order =
    sort === 'newest'
      ? 'applications.created_at DESC, applications.id DESC'
      : 'applications.ranking_score DESC NULLS LAST, applications.created_at DESC, applications.id DESC';
  params.push(limit + 1, offset);
  const result = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, users.name AS candidate_name, users.email AS candidate_email
     FROM applications
     JOIN users ON users.id = applications.candidate_id
     WHERE ${where}
     ORDER BY ${order}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return result.rows;
}

async function getApplicationById(id) {
  const result = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function updateApplicationStatus(id, pipelineStatus, changedBy) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT pipeline_status FROM applications WHERE id = $1 FOR UPDATE', [id]);
    if (current.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const fromStatus = current.rows[0].pipeline_status;
    const result = await client.query(
      `UPDATE applications SET pipeline_status = $1, updated_at = now() WHERE id = $2
       RETURNING id, job_id, candidate_id, parsed_data, ranking_score, ranking_details, pipeline_status, created_at, updated_at`,
      [pipelineStatus, id]
    );
    await client.query(
      'INSERT INTO application_status_history (application_id, from_status, to_status, changed_by) VALUES ($1, $2, $3, $4)',
      [id, fromStatus, pipelineStatus, changedBy ?? null]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getStatusHistory(applicationId) {
  const result = await pool.query(
    `SELECT h.id, h.from_status, h.to_status, h.created_at, u.name AS changed_by_name
     FROM application_status_history h
     LEFT JOIN users u ON u.id = h.changed_by
     WHERE h.application_id = $1
     ORDER BY h.created_at, h.id`,
    [applicationId]
  );
  return result.rows;
}

async function setRanking(id, rankingScore, rankingDetails) {
  await pool.query(
    'UPDATE applications SET ranking_score = $1, ranking_details = $2, updated_at = now() WHERE id = $3',
    [rankingScore, rankingDetails, id]
  );
}

async function listAllForRanking(jobId) {
  const result = await pool.query('SELECT id, parsed_data, resume_text FROM applications WHERE job_id = $1', [jobId]);
  return result.rows;
}

module.exports = {
  getStatusHistory,
  setRanking,
  listAllForRanking,
  getApplicationById,
  updateApplicationStatus,
  createApplication,
  findApplicationByJobAndCandidate,
  listApplicationsByCandidate,
  listApplicationsByJob,
};
