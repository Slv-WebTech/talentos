import { apiRequest, apiRequestPage } from './apiClient';

export const STATUS_TONE = {
  applied: 'brand',
  shortlisted: 'success',
  interview_scheduled: 'warning',
  selected: 'success',
  rejected: 'danger',
};

export function formatStatusLabel(status) {
  const words = status.split('_');
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export function applyToJob(token, { jobId, resumeFile }) {
  const form = new FormData();
  form.append('jobId', jobId);
  form.append('resume', resumeFile);
  return apiRequest('/api/applications', { method: 'POST', token, body: form });
}

export function listMyApplications(token) {
  return apiRequest('/api/applications?candidate=me', { token });
}

export const PIPELINE_STATUSES = Object.keys(STATUS_TONE);

export function updateApplicationStatus(token, applicationId, status) {
  return apiRequest(`/api/applications/${applicationId}/status`, { method: 'PATCH', token, body: { status } });
}

export function listApplicationsPage(token, jobId, { offset = 0, limit = 20, q = '', status = '', sort = 'score' } = {}) {
  const params = new URLSearchParams({ job: String(jobId), limit: String(limit), offset: String(offset), sort });
  if (q) params.set('q', q);
  if (status) params.set('status', status);
  return apiRequestPage(`/api/applications?${params}`, { token });
}

export function getStatusHistory(token, applicationId) {
  return apiRequest(`/api/applications/${applicationId}/history`, { token });
}

// Mirrors the server's transition rules (server/controllers/applicationController.js).
const TRANSITIONS = {
  applied: ['shortlisted', 'rejected'],
  shortlisted: ['applied', 'interview_scheduled', 'rejected'],
  interview_scheduled: ['shortlisted', 'selected', 'rejected'],
  selected: ['interview_scheduled'],
  rejected: ['applied', 'shortlisted'],
};

export function allowedNextStatuses(status) {
  return TRANSITIONS[status] || [];
}

// Outcomes that deserve a confirmation before they are applied.
export const CONFIRM_STATUSES = ['selected', 'rejected'];

export function getResumeUrl(token, applicationId) {
  return apiRequest(`/api/applications/${applicationId}/resume-url`, { token });
}

export function rerankJob(token, jobId) {
  return apiRequest(`/api/applications/rerank?job=${jobId}`, { method: 'POST', token });
}
