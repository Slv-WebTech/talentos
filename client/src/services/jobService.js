import { apiRequest } from './apiClient';

export function listOpenJobs(token) {
  return apiRequest('/api/jobs', { token });
}

export function listMyJobs(token) {
  return apiRequest('/api/jobs?recruiter=me', { token });
}

export function getJob(token, id) {
  return apiRequest(`/api/jobs/${id}`, { token });
}

export function createJob(token, job) {
  return apiRequest('/api/jobs', { method: 'POST', token, body: job });
}

export function updateJob(token, id, fields) {
  return apiRequest(`/api/jobs/${id}`, { method: 'PUT', token, body: fields });
}
