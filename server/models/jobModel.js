const pool = require('../config/db');

const UPDATABLE_FIELDS = {
  title: 'title',
  department: 'department',
  requiredSkills: 'required_skills',
  minExperienceYears: 'min_experience_years',
  salaryMin: 'salary_min',
  salaryMax: 'salary_max',
  location: 'location',
  status: 'status',
};

async function createJob({
  recruiterId,
  title,
  department,
  requiredSkills,
  minExperienceYears,
  salaryMin,
  salaryMax,
  location,
}) {
  const result = await pool.query(
    `INSERT INTO jobs
       (recruiter_id, title, department, required_skills, min_experience_years, salary_min, salary_max, location)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [recruiterId, title, department, requiredSkills, minExperienceYears, salaryMin, salaryMax, location]
  );
  return result.rows[0];
}

async function listOpenJobs() {
  const result = await pool.query(
    `SELECT * FROM jobs WHERE status = 'open' ORDER BY created_at DESC`
  );
  return result.rows;
}

async function listJobsByRecruiter(recruiterId) {
  const result = await pool.query(
    `SELECT * FROM jobs WHERE recruiter_id = $1 ORDER BY created_at DESC`,
    [recruiterId]
  );
  return result.rows;
}

async function getJobById(id) {
  const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function updateJob(id, fields) {
  const setClauses = [];
  const values = [];

  for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      setClauses.push(`${column} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return getJobById(id);
  }

  setClauses.push('updated_at = now()');
  values.push(id);

  const result = await pool.query(
    `UPDATE jobs SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

module.exports = { createJob, listOpenJobs, listJobsByRecruiter, getJobById, updateJob };
