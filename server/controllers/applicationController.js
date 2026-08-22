const { getJobById } = require('../models/jobModel');
const {
  createApplication,
  findApplicationByJobAndCandidate,
  listApplicationsByCandidate,
  listApplicationsByJob,
} = require('../models/applicationModel');
const { uploadResumeToCloudinary } = require('../services/uploadService');
const { parseResume } = require('../services/aiServiceClient');

async function apply(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'resume file is required' } });
    }
    if (req.file.size === 0) {
      return res.status(400).json({ error: { message: 'resume file is empty' } });
    }

    const jobId = Number(req.body.jobId);
    if (!Number.isInteger(jobId) || jobId <= 0) {
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

    const resumeUrl = await uploadResumeToCloudinary(req.file.buffer, {
      candidateId: req.user.id,
      jobId,
      originalName: req.file.originalname,
    });

    const { parsedData } = await parseResume(req.file.buffer, req.file.originalname, req.file.mimetype);

    const application = await createApplication({ jobId, candidateId: req.user.id, resumeUrl, parsedData });
    res.status(201).json({ data: application });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    if (req.query.candidate === 'me') {
      if (!req.user || req.user.role !== 'candidate') {
        return res.status(403).json({ error: { message: 'only candidates can list their own applications' } });
      }
      return res.json({ data: await listApplicationsByCandidate(req.user.id) });
    }

    if (req.query.job !== undefined) {
      const jobId = Number(req.query.job);
      if (!Number.isInteger(jobId) || jobId <= 0) {
        return res.status(400).json({ error: { message: 'job must be a valid integer id' } });
      }
      const job = await getJobById(jobId);
      if (!job) {
        return res.status(404).json({ error: { message: 'job not found' } });
      }
      if (job.recruiter_id !== req.user.id) {
        return res.status(403).json({ error: { message: 'you do not own this job posting' } });
      }
      return res.json({ data: await listApplicationsByJob(jobId) });
    }

    return res.status(400).json({ error: { message: 'must specify either ?candidate=me or ?job=:id' } });
  } catch (err) {
    next(err);
  }
}

module.exports = { apply, list };
