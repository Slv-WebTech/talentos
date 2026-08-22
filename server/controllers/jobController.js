const {
  createJob,
  listOpenJobs,
  listJobsByRecruiter,
  getJobById,
  updateJob,
} = require('../models/jobModel');

const VALID_STATUSES = ['open', 'closed'];

function validateJobFields(body, { partial }) {
  const errors = [];
  const fields = {};

  if (!partial || body.title !== undefined) {
    if (!body.title || typeof body.title !== 'string') {
      errors.push('title is required');
    } else {
      fields.title = body.title;
    }
  }

  if (body.department !== undefined) fields.department = body.department;
  if (body.location !== undefined) fields.location = body.location;

  if (body.requiredSkills !== undefined) {
    if (!Array.isArray(body.requiredSkills) || !body.requiredSkills.every((s) => typeof s === 'string')) {
      errors.push('requiredSkills must be an array of strings');
    } else {
      fields.requiredSkills = body.requiredSkills;
    }
  } else if (!partial) {
    fields.requiredSkills = [];
  }

  if (body.minExperienceYears !== undefined) {
    const years = Number(body.minExperienceYears);
    if (!Number.isInteger(years) || years < 0) {
      errors.push('minExperienceYears must be a non-negative integer');
    } else {
      fields.minExperienceYears = years;
    }
  }

  if (body.salaryMin !== undefined) {
    const min = Number(body.salaryMin);
    if (!Number.isInteger(min) || min < 0) errors.push('salaryMin must be a non-negative integer');
    else fields.salaryMin = min;
  }
  if (body.salaryMax !== undefined) {
    const max = Number(body.salaryMax);
    if (!Number.isInteger(max) || max < 0) errors.push('salaryMax must be a non-negative integer');
    else fields.salaryMax = max;
  }
  if (fields.salaryMin !== undefined && fields.salaryMax !== undefined && fields.salaryMin > fields.salaryMax) {
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
    const { errors, fields } = validateJobFields(req.body, { partial: false });
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
    const job = await getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: { message: 'job not found' } });
    }
    if (job.recruiter_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'you do not own this job posting' } });
    }

    const { errors, fields } = validateJobFields(req.body, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({ error: { message: errors.join('; ') } });
    }

    const updated = await updateJob(req.params.id, fields);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    if (req.query.recruiter === 'me') {
      if (!req.user || req.user.role !== 'recruiter') {
        return res.status(403).json({ error: { message: 'only recruiters can list their own jobs' } });
      }
      const jobs = await listJobsByRecruiter(req.user.id);
      return res.json({ data: jobs });
    }

    const jobs = await listOpenJobs();
    res.json({ data: jobs });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const job = await getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: { message: 'job not found' } });
    }
    res.json({ data: job });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, update, list, getOne };
