// Route-level tests using node:test. DB-backed models are stubbed via the require cache,
// so no Postgres is needed. Run: npm test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function stub(rel, exports) {
  const file = require.resolve(path.join('..', rel));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
}

const users = [];
const jobs = [
  { id: 1, recruiter_id: 10, title: 'Open job', status: 'open' },
  { id: 2, recruiter_id: 10, title: 'Closed job', status: 'closed' },
];
const applications = [
  { id: 5, job_id: 1, candidate_id: 20, pipeline_status: 'applied', resume_public_id: 'resumes/r5' },
];
const ranked = [];
const history = [];
let lastListOpts = null;
const reranked = [];
const ROLES = { 1: 'candidate', 10: 'recruiter', 11: 'recruiter', 20: 'candidate', 21: 'candidate', 22: 'recruiter' };

stub('models/userModel.js', {
  // id 22 is stored as a candidate although its token will claim recruiter; id 999 does not exist
  findUserById: async (id) => {
    const found = users.find((u) => u.id === id);
    if (found) return { id: found.id, role: found.role };
    return ROLES[id] ? { id, role: ROLES[id] } : null;
  },
  findUserByEmail: async (email) => users.find((u) => u.email === email.toLowerCase()) || null,
  createUser: async ({ name, email, passwordHash, role }) => {
    const u = { id: users.length + 1, name, email: email.toLowerCase(), password_hash: passwordHash, role };
    users.push(u);
    return { id: u.id, name, email: u.email, role };
  },
});
stub('models/jobModel.js', {
  getJobById: async (id) => jobs.find((j) => j.id === Number(id)) || null,
  listOpenJobs: async () => jobs.filter((j) => j.status === 'open'),
  listJobsByRecruiter: async (id) => jobs.filter((j) => j.recruiter_id === id),
  createJob: async (f) => ({ id: 99, ...f }),
  updateJob: async (id, f) => ({ id: Number(id), ...f }),
});
stub('models/applicationModel.js', {
  createApplication: async () => ({}),
  findApplicationByJobAndCandidate: async () => null,
  listApplicationsByCandidate: async () => [],
  listApplicationsByJob: async (jobId, opts) => { lastListOpts = opts; return []; },
  getApplicationById: async (id) => applications.find((a) => a.id === id) || null,
  setRanking: async (id, score) => { ranked.push([id, score]); },
  listAllForRanking: async () => [{ id: 5, parsed_data: { skills: ['python'] }, resume_text: 'figma and python' }],
  updateApplicationStatus: async (id, s, by) => {
    history.push([id, s, by]);
    return { ...applications.find((a) => a.id === id), pipeline_status: s };
  },
  getStatusHistory: async () => [{ id: 1, from_status: 'applied', to_status: 'shortlisted' }],
});
stub('services/uploadService.js', {
  uploadResumeToCloudinary: async () => ({}),
  deleteResume: async () => {},
  getSignedResumeUrl: (id) => `https://signed.example/${id}`,
});
stub('services/aiServiceClient.js', {
  parseResume: async () => ({ parsedData: {} }),
  rankCandidate: async (args) => {
    reranked.push(args);
    return { score: 80, matchedSkills: ['python'], missingSkills: [] };
  },
});

const app = require('../server');
const { hasValidSignature } = require('../middleware/uploadMiddleware');
let server;
let base;

const token = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET);
const call = (p, { method = 'GET', body, tok } = {}) =>
  fetch(base + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

before(async () => {
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('auth: register validates, normalises email, rejects admin and duplicates', async () => {
  const good = { name: ' Ann ', email: 'Ann@Example.com', password: 'longenough', role: 'candidate' };
  assert.equal((await call('/api/auth/register', { method: 'POST', body: { ...good, role: 'admin' } })).status, 400);
  assert.equal((await call('/api/auth/register', { method: 'POST', body: { ...good, password: 'short' } })).status, 400);
  assert.equal((await call('/api/auth/register', { method: 'POST', body: { ...good, email: 123 } })).status, 400);
  const ok = await call('/api/auth/register', { method: 'POST', body: good });
  assert.equal(ok.status, 201);
  assert.equal((await ok.json()).data.user.email, 'ann@example.com');
  assert.equal((await call('/api/auth/register', { method: 'POST', body: { ...good, email: 'ann@example.com' } })).status, 409);
});

test('auth: login succeeds case-insensitively and rejects bad password', async () => {
  users.push({ id: 50, email: 'bob@example.com', password_hash: await bcrypt.hash('password1', 4), role: 'recruiter' });
  const ok = await call('/api/auth/login', { method: 'POST', body: { email: 'BOB@example.com', password: 'password1' } });
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.ok(body.data.token);
  assert.equal(body.data.user.password_hash, undefined);
  assert.equal((await call('/api/auth/login', { method: 'POST', body: { email: 'bob@example.com', password: 'nope' } })).status, 401);
});

test('protected routes require a valid token', async () => {
  assert.equal((await call('/api/jobs')).status, 401);
  assert.equal((await call('/api/jobs', { tok: 'garbage' })).status, 401);
  assert.equal((await call('/api/jobs', { tok: token(1, 'candidate') })).status, 200);
});

test('role checks: candidate cannot create jobs or update status', async () => {
  const cand = token(20, 'candidate');
  assert.equal((await call('/api/jobs', { method: 'POST', body: { title: 'x' }, tok: cand })).status, 403);
  assert.equal((await call('/api/applications/5/status', { method: 'PATCH', body: { status: 'selected' }, tok: cand })).status, 403);
});

test('jobs: closed jobs hidden from non-owners, visible to owner', async () => {
  assert.equal((await call('/api/jobs/2', { tok: token(20, 'candidate') })).status, 404);
  assert.equal((await call('/api/jobs/2', { tok: token(10, 'recruiter') })).status, 200);
  assert.equal((await call('/api/jobs/1', { tok: token(20, 'candidate') })).status, 200);
});

test('jobs: only the owner can update', async () => {
  const r = await call('/api/jobs/1', { method: 'PUT', body: { title: 'New' }, tok: token(11, 'recruiter') });
  assert.equal(r.status, 403);
});

test('applications: pipeline status update is owner-only and validated', async () => {
  const owner = token(10, 'recruiter');
  const other = token(11, 'recruiter');
  const patch = (tok, body, id = 5) => call(`/api/applications/${id}/status`, { method: 'PATCH', body, tok });
  assert.equal((await patch(owner, { status: 'bogus' })).status, 400);
  assert.equal((await patch(owner, { status: 'shortlisted' }, 999)).status, 404);
  assert.equal((await patch(other, { status: 'shortlisted' })).status, 403);
  const ok = await patch(owner, { status: 'shortlisted' });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).data.pipeline_status, 'shortlisted');
});

test('resume url: signed for the owning candidate and recruiter only', async () => {
  const get = (tok) => call('/api/applications/5/resume-url', { tok });
  const ok = await get(token(20, 'candidate'));
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).data.url, 'https://signed.example/resumes/r5');
  assert.equal((await get(token(10, 'recruiter'))).status, 200);
  assert.equal((await get(token(21, 'candidate'))).status, 403);
  assert.equal((await get(token(11, 'recruiter'))).status, 403);
});

test('rerank: owner-only, rescoring every application for the job', async () => {
  const post = (tok, q) => call(`/api/applications/rerank?job=${q}`, { method: 'POST', tok });
  assert.equal((await post(token(11, 'recruiter'), 1)).status, 403);
  assert.equal((await post(token(20, 'candidate'), 1)).status, 403);
  const ok = await post(token(10, 'recruiter'), 1);
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).data.updated, 1);
  assert.deepEqual(ranked[0], [5, 80]);
});

test('pagination: validates params and returns meta', async () => {
  const tok = token(20, 'candidate');
  assert.equal((await call('/api/jobs?limit=0', { tok })).status, 400);
  assert.equal((await call('/api/jobs?limit=101', { tok })).status, 400);
  assert.equal((await call('/api/jobs?offset=-1', { tok })).status, 400);
  const ok = await call('/api/jobs?limit=10&offset=0', { tok });
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.deepEqual(body.meta, { limit: 10, offset: 0, hasMore: false });
  const { paginate } = require('../utils/pagination');
  assert.deepEqual(paginate([1, 2, 3], 2, 0).data, [1, 2]);
  assert.equal(paginate([1, 2, 3], 2, 0).meta.hasMore, true);
});

test('ids: non-numeric or out-of-range ids return 400, never 500', async () => {
  const tok = token(10, 'recruiter');
  for (const id of ['abc', '1.5', '99999999999', '0', '1;DROP']) {
    assert.equal((await call(`/api/jobs/${encodeURIComponent(id)}`, { tok })).status, 400, `GET job ${id}`);
    assert.equal((await call(`/api/jobs/${encodeURIComponent(id)}`, { method: 'PUT', body: { title: 'x' }, tok })).status, 400);
  }
  assert.equal((await call('/api/applications/1099511627776/status', { method: 'PATCH', body: { status: 'applied' }, tok })).status, 400);
  assert.equal((await call('/api/applications/rerank?job=abc', { method: 'POST', tok })).status, 400);
});

test('pagination: absurd offsets are rejected', async () => {
  const tok = token(20, 'candidate');
  assert.equal((await call('/api/jobs?offset=1e20', { tok })).status, 400);
  assert.equal((await call('/api/jobs?offset=1000001', { tok })).status, 400);
});

test('job validation: lengths, types, ranges and trimming', async () => {
  const tok = token(10, 'recruiter');
  const post = (body) => call('/api/jobs', { method: 'POST', body, tok });
  assert.equal((await post({ title: 'a'.repeat(256) })).status, 400);
  assert.equal((await post({ title: '   ' })).status, 400);
  assert.equal((await post({ title: 't', location: 'l'.repeat(256) })).status, 400);
  assert.equal((await post({ title: 't', department: { a: 1 } })).status, 400);
  assert.equal((await post({ title: 't', requiredSkills: Array(51).fill('x') })).status, 400);
  assert.equal((await post({ title: 't', requiredSkills: [''] })).status, 400);
  assert.equal((await post({ title: 't', minExperienceYears: 81 })).status, 400);
  assert.equal((await post({ title: 't', salaryMin: 1e12 })).status, 400);
  assert.equal((await post({ title: 't', salaryMin: 10, salaryMax: 5 })).status, 400);
  const ok = await post({ title: '  Trimmed  ', requiredSkills: [' Python '] });
  assert.equal(ok.status, 201);
  const data = (await ok.json()).data;
  assert.equal(data.title, 'Trimmed');
  assert.deepEqual(data.requiredSkills, ['Python']);
});

test('job update: partial salary change is checked against the stored range', async () => {
  jobs.push({ id: 7, recruiter_id: 10, title: 'Sal', status: 'open', salary_min: 10, salary_max: 20 });
  const put = (body) => call('/api/jobs/7', { method: 'PUT', body, tok: token(10, 'recruiter') });
  assert.equal((await put({ salaryMin: 500 })).status, 400);
  assert.equal((await put({ salaryMax: 5 })).status, 400);
  assert.equal((await put({ salaryMin: 15 })).status, 200);
});

test('unknown /api routes return JSON 404', async () => {
  const r = await call('/api/nope');
  assert.equal(r.status, 404);
  assert.match(r.headers.get('content-type'), /json/);
});

test('auth: tokens of deleted users are rejected and DB role wins over token role', async () => {
  assert.equal((await call('/api/jobs', { tok: token(999, 'recruiter') })).status, 401);
  // token claims recruiter, database says candidate -> no access
  assert.equal((await call('/api/jobs', { method: 'POST', body: { title: 'x' }, tok: token(20, 'recruiter') })).status, 403);
  // token claims candidate, database says recruiter -> database wins
  assert.equal((await call('/api/jobs', { method: 'POST', body: { title: 'x' }, tok: token(10, 'candidate') })).status, 201);
});

test('status transitions: invalid jumps are 409, no-ops are 200, valid moves record the actor', async () => {
  applications.push({ id: 6, job_id: 1, candidate_id: 21, pipeline_status: 'rejected' });
  applications.push({ id: 7, job_id: 1, candidate_id: 21, pipeline_status: 'shortlisted' });
  const owner = token(10, 'recruiter');
  const patch = (id, status) => call(`/api/applications/${id}/status`, { method: 'PATCH', body: { status }, tok: owner });
  assert.equal((await patch(6, 'selected')).status, 409);
  assert.equal((await patch(6, 'rejected')).status, 200);
  const before = history.length;
  assert.equal((await patch(7, 'selected')).status, 409);
  assert.equal((await patch(7, 'interview_scheduled')).status, 200);
  assert.equal(history.length, before + 1);
  assert.deepEqual(history.at(-1), [7, 'interview_scheduled', 10]);
});

test('status history endpoint is owner-only', async () => {
  assert.equal((await call('/api/applications/5/history', { tok: token(11, 'recruiter') })).status, 403);
  assert.equal((await call('/api/applications/5/history', { tok: token(20, 'candidate') })).status, 403);
  const ok = await call('/api/applications/5/history', { tok: token(10, 'recruiter') });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).data.length, 1);
});

test('applicant list filters are validated and passed to the model', async () => {
  const owner = token(10, 'recruiter');
  const get = (q) => call(`/api/applications?job=1${q}`, { tok: owner });
  assert.equal((await get('&status=bogus')).status, 400);
  assert.equal((await get('&sort=oldest')).status, 400);
  assert.equal((await get('&q=' + 'a'.repeat(101))).status, 400);
  assert.equal((await get('&status=shortlisted&q=%20ann%20&sort=newest')).status, 200);
  assert.deepEqual({ s: lastListOpts.status, q: lastListOpts.q, sort: lastListOpts.sort }, { s: 'shortlisted', q: 'ann', sort: 'newest' });
});

test('ranking passes stored resume text; editing job criteria triggers a background re-rank', async () => {
  reranked.length = 0;
  const owner = token(10, 'recruiter');
  const r = await call('/api/applications/rerank?job=1', { method: 'POST', tok: owner });
  assert.equal(r.status, 200);
  assert.equal(reranked[0].resumeText, 'figma and python');
  reranked.length = 0;
  assert.equal((await call('/api/jobs/1', { method: 'PUT', body: { requiredSkills: ['Figma'] }, tok: owner })).status, 200);
  await new Promise((res) => setTimeout(res, 50));
  assert.equal(reranked.length, 1);
  reranked.length = 0;
  assert.equal((await call('/api/jobs/1', { method: 'PUT', body: { title: 'Renamed' }, tok: owner })).status, 200);
  await new Promise((res) => setTimeout(res, 50));
  assert.equal(reranked.length, 0);
});

test('successful logins do not consume the login rate limit', async () => {
  users.push({ id: 60, email: 'ok@example.com', password_hash: await bcrypt.hash('password1', 4), role: 'candidate' });
  for (let i = 0; i < 25; i++) {
    const r = await call('/api/auth/login', { method: 'POST', body: { email: 'ok@example.com', password: 'password1' } });
    assert.equal(r.status, 200, `login ${i}`);
  }
});

test('malformed JSON returns 400 and security headers are present', async () => {
  const r = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad',
  });
  assert.equal(r.status, 400);
  assert.ok(r.headers.get('x-content-type-options'));
});

test('upload signature check matches file type', () => {
  const f = (name, bytes) => ({ originalname: name, buffer: Buffer.from(bytes) });
  assert.ok(hasValidSignature(f('a.pdf', '%PDF-1.7')));
  assert.ok(!hasValidSignature(f('a.pdf', 'MZ\x90\x00')));
  assert.ok(hasValidSignature(f('a.docx', [0x50, 0x4b, 0x03, 0x04, 0])));
  assert.ok(!hasValidSignature(f('a.docx', '%PDF')));
});

test('auth endpoints are rate limited (keep last: exhausts the limiter)', async () => {
  let last;
  for (let i = 0; i < 25; i++) {
    last = await call('/api/auth/login', { method: 'POST', body: { email: 'x@y.co', password: 'zzzzzzzz' } });
  }
  assert.equal(last.status, 429);
});
