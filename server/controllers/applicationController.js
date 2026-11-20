const { getJobById } = require('../models/jobModel');
const {
  createApplication,
  findApplicationByJobAndCandidate,
  listApplicationsByCandidate,
  listApplicationsByJob,
  getApplicationById,
  updateApplicationStatus,
  getStatusHistory,
} = require('../models/applicationModel');
const { rerankJob, toDetails } = require('../services/rankingService');
const { parsePagination, paginate } = require('../utils/pagination');
const { parseId } = require('../utils/ids');
const { uploadResumeToCloudinary, deleteResume, getSignedResumeUrl } = require('../services/uploadService');
const { parseResume, rankCandidate } = require('../services/aiServiceClient');

async function apply(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'resume file is required' } });
    }
    if (req.file.size === 0) {
      return res.status(400).json({ error: { message: 'resume file is empty' } });
    }

    const jobId = parseId(req.body.jobId);
    if (!jobId) {
      return res.status(400).json({ error: { message: 'jobId is required and must be a valid integer' } });
    }

    const job = await getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: { message: 'job not found' } });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ error: { message: 'this job is not accepting applications' } });
    }

    const existing = await findApplicationByJobAndCandidate(jobId, req.user.id);
    if (existing) {
      return res.status(409).json({ error: { message: 'you have already applied to this job' } });
    }

    let uploaded;
    try {
      uploaded = await uploadResumeToCloudinary(req.file.buffer, {
        candidateId: req.user.id,
        jobId,
        originalName: req.file.originalname,
      });
    } catch (err) {
      console.error('resume upload failed:', err.message);
      return res.status(503).json({ error: { message: 'resume storage is unavailable, please try again later' } });
    }
    const { url: resumeUrl, publicId } = uploaded;

    const { parsedData, resumeText } = await parseResume(req.file.buffer, req.file.originalname, req.file.mimetype);

    const ranking = await rankCandidate({
      requiredSkills: job.required_skills,
      minExperienceYears: job.min_experience_years,
      parsedData,
      resumeText,
    });

    let application;
    try {
      application = await createApplication({
        jobId,
        candidateId: req.user.id,
        resumeUrl,
        resumePublicId: publicId,
        resumeText,
        parsedData,
        rankingScore: ranking ? ranking.score : null,
        rankingDetails: toDetails(ranking),
      });
    } catch (err) {
      await deleteResume(publicId);
      if (err.code === '23505') {
        return res.status(409).json({ error: { message: 'you have already applied to this job' } });
      }
      throw err;
    }
    res.status(201).json({ data: application });
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
    if (req.query.candidate === 'me') {
      if (!req.user || req.user.role !== 'candidate') {
        return res.status(403).json({ error: { message: 'only candidates can list their own applications' } });
      }
      return res.json(paginate(await listApplicationsByCandidate(req.user.id, page), page.limit, page.offset));
    }

    if (req.query.job !== undefined) {
      const jobId = parseId(req.query.job);
      if (!jobId) {
        return res.status(400).json({ error: { message: 'job must be a valid integer id' } });
      }
      const job = await getJobById(jobId);
      if (!job) {
        return res.status(404).json({ error: { message: 'job not found' } });
      }
      if (job.recruiter_id !== req.user.id) {
        return res.status(403).json({ error: { message: 'you do not own this job posting' } });
      }
      const filters = parseApplicantFilters(req.query);
      if (filters.error) {
        return res.status(400).json({ error: { message: filters.error } });
      }
      return res.json(paginate(await listApplicationsByJob(jobId, { ...page, ...filters }), page.limit, page.offset));
    }

    return res.status(400).json({ error: { message: 'must specify either ?candidate=me or ?job=:id' } });
  } catch (err) {
    next(err);
  }
}

const PIPELINE_STATUSES = ['applied', 'shortlisted', 'interview_scheduled', 'selected', 'rejected'];

// Allowed pipeline moves. Terminal states (selected/rejected) can be reopened one step, but
// rejected -> selected and selected -> rejected must go through the pipeline.
const TRANSITIONS = {
  applied: ['shortlisted', 'rejected'],
  shortlisted: ['applied', 'interview_scheduled', 'rejected'],
  interview_scheduled: ['shortlisted', 'selected', 'rejected'],
  selected: ['interview_scheduled'],
  rejected: ['applied', 'shortlisted'],
};

function parseApplicantFilters(query) {
  const filters = {};
  if (query.status !== undefined) {
    if (!PIPELINE_STATUSES.includes(query.status)) {
      return { error: `status must be one of: ${PIPELINE_STATUSES.join(', ')}` };
    }
    filters.status = query.status;
  }
  if (query.q !== undefined) {
    if (typeof query.q !== 'string' || query.q.length > 100) {
      return { error: 'q must be a string of at most 100 characters' };
    }
    if (query.q.trim()) filters.q = query.q.trim();
  }
  if (query.sort !== undefined) {
    if (!['score', 'newest'].includes(query.sort)) {
      return { error: 'sort must be one of: score, newest' };
    }
    filters.sort = query.sort;
  }
  return filters;
}

async function updateStatus(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { message: 'application id must be a valid integer' } });
    }
    const { status } = req.body;
    if (!PIPELINE_STATUSES.includes(status)) {
      return res.status(400).json({ error: { message: `status must be one of: ${PIPELINE_STATUSES.join(', ')}` } });
    }

    const application = await getApplicationById(id);
    if (!application) {
      return res.status(404).json({ error: { message: 'application not found' } });
    }
    const job = await getJobById(application.job_id);
    if (!job || job.recruiter_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'you do not own this job posting' } });
    }

    if (status === application.pipeline_status) {
      return res.json({ data: application });
    }
    if (!TRANSITIONS[application.pipeline_status].includes(status)) {
      return res.status(409).json({
        error: {
          message: `cannot move an application from ${application.pipeline_status} to ${status}; allowed: ${TRANSITIONS[application.pipeline_status].join(', ')}`,
        },
      });
    }

    res.json({ data: await updateApplicationStatus(id, status, req.user.id) });
  } catch (err) {
    next(err);
  }
}

async function resumeUrl(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { message: 'application id must be a valid integer' } });
    }
    const application = await getApplicationById(id);
    if (!application) {
      return res.status(404).json({ error: { message: 'application not found' } });
    }
    const job = await getJobById(application.job_id);
    const isCandidateOwner = application.candidate_id === req.user.id;
    const isRecruiterOwner = job && job.recruiter_id === req.user.id;
    if (!isCandidateOwner && !isRecruiterOwner) {
      return res.status(403).json({ error: { message: 'you do not have access to this resume' } });
    }
    if (!application.resume_public_id) {
      // legacy rows uploaded before private storage still have a direct URL
      return res.json({ data: { url: application.resume_url } });
    }
    res.json({ data: { url: getSignedResumeUrl(application.resume_public_id), expiresInSeconds: 300 } });
  } catch (err) {
    next(err);
  }
}

// Re-scores every application for a job (e.g. after the recruiter edits required skills).
async function rerank(req, res, next) {
  try {
    const jobId = parseId(req.query.job);
    if (!jobId) {
      return res.status(400).json({ error: { message: 'job must be a valid integer id' } });
    }
    const job = await getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: { message: 'job not found' } });
    }
    if (job.recruiter_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'you do not own this job posting' } });
    }

    const updated = await rerankJob(job);
    res.json({ data: { updated } });
  } catch (err) {
    next(err);
  }
}

async function statusHistory(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { message: 'application id must be a valid integer' } });
    }
    const application = await getApplicationById(id);
    if (!application) {
      return res.status(404).json({ error: { message: 'application not found' } });
    }
    const job = await getJobById(application.job_id);
    if (!job || job.recruiter_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'you do not own this job posting' } });
    }
    res.json({ data: await getStatusHistory(id) });
  } catch (err) {
    next(err);
  }
}

module.exports = { apply, list, updateStatus, resumeUrl, rerank, statusHistory };
