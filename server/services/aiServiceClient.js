const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function parseResume(buffer, filename, mimetype) {
  try {
    const form = new FormData();
    form.append('resume', new Blob([buffer], { type: mimetype }), filename);
    const res = await fetch(`${AI_SERVICE_URL}/parse-resume`, { method: 'POST', body: form });
    const payload = await res.json();
    if (!res.ok) {
      return { parsedData: { parseError: payload.error?.message || 'resume parsing failed' } };
    }
    return { parsedData: payload.data };
  } catch {
    return { parsedData: { parseError: 'AI service is unreachable' } };
  }
}

module.exports = { parseResume };
