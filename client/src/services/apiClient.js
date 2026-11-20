const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

async function request(path, { method = 'GET', body, token } = {}) {
  const isFormData = body instanceof FormData;
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${SERVER_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload.error?.message || `request failed: ${res.status}`);
  }
  return payload;
}

export async function apiRequest(path, options) {
  return (await request(path, options)).data;
}

// For paginated endpoints: resolves to { data, meta: { limit, offset, hasMore } }.
export function apiRequestPage(path, options) {
  return request(path, options);
}
