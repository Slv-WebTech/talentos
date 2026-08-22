const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export async function getServerHealth() {
  const res = await fetch(`${SERVER_URL}/api/health`);
  if (!res.ok) {
    throw new Error(`Server health check failed: ${res.status}`);
  }
  return res.json();
}
