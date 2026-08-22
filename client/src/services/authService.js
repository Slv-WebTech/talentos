import { apiRequest } from './apiClient';

const TOKEN_KEY = 'ats_token';
const USER_KEY = 'ats_user';

export async function register({ name, email, password, role }) {
  const data = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: { name, email, password, role },
  });
  persistSession(data);
  return data;
}

export async function login({ email, password }) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  persistSession(data);
  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  return token && user ? { token, user: JSON.parse(user) } : null;
}

function persistSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
