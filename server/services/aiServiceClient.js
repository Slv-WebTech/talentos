const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function parseResume(buffer, filename, mimetype) {
  try {
    const form = new FormData();
    form.append('resume', new Blob([buffer], { type: mimetype }), filename);
    const headers = process.env.AI_SERVICE_SECRET ? { 'X-Internal-Secret': process.env.AI_SERVICE_SECRET } : {};
    const res = await fetch(`${AI_SERVICE_URL}/parse-resume`, { method: 'POST', body: form, headers });
    const payload = await res.json();
    if (!res.ok) {
      return { parsedData: { parseError: payload.error?.message || 'resume parsing failed' } };
    }
    return { parsedData: payload.data, resumeText: typeof payload.text === 'string' ? payload.text : null };
  } catch {
    return { parsedData: { parseError: 'AI service is unreachable' } };
  }
}

async function rankCandidate({ requiredSkills, minExperienceYears, parsedData, resumeText }) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.AI_SERVICE_SECRET) headers['X-Internal-Secret'] = process.env.AI_SERVICE_SECRET;
    const res = await fetch(`${AI_SERVICE_URL}/rank`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ requiredSkills, minExperienceYears, parsedData, resumeText: resumeText || null }),
    });
    if (!res.ok) return null;
    return (await res.json()).data || null;
  } catch {
    return null; // ranking is best-effort; never blocks an application
  }
}

module.exports = { parseResume, rankCandidate };
