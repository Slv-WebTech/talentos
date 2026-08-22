import { apiRequest } from './apiClient';

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

export function listApplicationsForJob(token, jobId) {
  return apiRequest(`/api/applications?job=${jobId}`, { token });
}
