const {
  createJob,
  listOpenJobs,
  listJobsByRecruiter,
  getJobById,
  updateJob,
} = require('../models/jobModel');
const { parsePagination, paginate } = require('../utils/pagination');
const { parseId, MAX_INT32 } = require('../utils/ids');
const { rerankJob } = require('../services/rankingService');

const VALID_STATUSES = ['open', 'closed'];

const MAX_TEXT = 255;
const MAX_SKILLS = 50;
const MAX_SKILL_LENGTH = 100;
const MAX_EXPERIENCE_YEARS = 80;

function optionalText(body, key, errors, fields) {
  if (body[key] === undefined) return;
  if (body[key] === null || body[key] === '') {
    fields[key] = null;
  } else if (typeof body[key] !== 'string' || body[key].trim().length > MAX_TEXT) {
    errors.push(`${key} must be a string of at most ${MAX_TEXT} characters`);
  } else {
    fields[key] = body[key].trim();
  }
}

function optionalInt(body, key, max, errors, fields) {
  if (body[key] === undefined) return;
  const n = Number(body[key]);
  if (body[key] === null || body[key] === '' || !Number.isInteger(n) || n < 0 || n > max) {
    errors.push(`${key} must be an integer between 0 and ${max}`);
  } else {
    fields[key] = n;
  }
}

// `existing` is the stored job on update, so partial updates can't break cross-field rules.
function validateJobFields(body, { partial, existing }) {
  const errors = [];
  const fields = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      errors.push('title is required');
    } else if (body.title.trim().length > MAX_TEXT) {
      errors.push(`title must be at most ${MAX_TEXT} characters`);
    } else {
      fields.title = body.title.trim();
    }
  }

  optionalText(body, 'department', errors, fields);
  optionalText(body, 'location', errors, fields);

  if (body.requiredSkills !== undefined) {
    const skills = body.requiredSkills;
    if (
      !Array.isArray(skills) ||
      skills.length > MAX_SKILLS ||
      !skills.every((s) => typeof s === 'string' && s.trim().length > 0 && s.trim().length <= MAX_SKILL_LENGTH)
    ) {
      errors.push(`requiredSkills must be an array of up to ${MAX_SKILLS} non-empty strings (max ${MAX_SKILL_LENGTH} chars each)`);
    } else {
      fields.requiredSkills = skills.map((s) => s.trim());
    }
  } else if (!partial) {
    fields.requiredSkills = [];
  }

  optionalInt(body, 'minExperienceYears', MAX_EXPERIENCE_YEARS, errors, fields);
  optionalInt(body, 'salaryMin', MAX_INT32, errors, fields);
  optionalInt(body, 'salaryMax', MAX_INT32, errors, fields);

  const min = fields.salaryMin !== undefined ? fields.salaryMin : existing && existing.salary_min;
  const max = fields.salaryMax !== undefined ? fields.salaryMax : existing && existing.salary_max;
  if (min != null && max != null && min > max) {
    errors.push('salaryMin must not exceed salaryMax');
  }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    } else {
      fields.status = body.status;
    }
  }

  return { errors, fields };
}

async function create(req, res, next) {
  try {
    const { errors, fields } = validateJobFields(req.body || {}, { partial: false });
    if (errors.length > 0) {
      return res.status(400).json({ error: { message: errors.join('; ') } });
    }

    const job = await createJob({ recruiterId: req.user.id, ...fields });
    res.status(201).json({ data: job });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { message: 'job id must be a valid integer' } });
    }
    const job = await getJobById(id);
    if (!job) {
      return res.status(404).json({ error: { message: 'job not found' } });
    }
    if (job.recruiter_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'you do not own this job posting' } });
    }

    const { errors, fields } = validateJobFields(req.body || {}, { partial: true, existing: job });
    if (errors.length > 0) {
      return res.status(400).json({ error: { message: errors.join('; ') } });
    }

    const updated = await updateJob(id, fields);
    // Scores depend on the job's criteria; refresh them in the background when those change.
    if (updated && (fields.requiredSkills !== undefined || fields.minExperienceYears !== undefined)) {
      rerankJob(updated).catch((err) => console.error('background re-rank failed:', err.message));
    }
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const page = parsePagination(req.query);
    if (page.error) {
      return res.status(400).json({ error: { message: page.error } });
    }
    if (req.query.recruiter === 'me') {
      if (!req.user || req.user.role !== 'recruiter') {
        return res.status(403).json({ error: { message: 'only recruiters can list their own jobs' } });
      }
      const jobs = await listJobsByRecruiter(req.user.id, page);
      return res.json(paginate(jobs, page.limit, page.offset));
    }

    const jobs = await listOpenJobs(page);
    res.json(paginate(jobs, page.limit, page.offset));
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { message: 'job id must be a valid integer' } });
    }
    const job = await getJobById(id);
    if (!job) {
      return res.status(404).json({ error: { message: 'job not found' } });
    }
    if (job.status !== 'open' && job.recruiter_id !== req.user.id) {
      return res.status(404).json({ error: { message: 'job not found' } });
    }
    res.json({ data: job });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, update, list, getOne };
