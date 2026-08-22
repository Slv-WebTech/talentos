const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${SERVER_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload.error?.message || `request failed: ${res.status}`);
  }
  return payload.data;
}
