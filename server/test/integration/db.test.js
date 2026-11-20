// Real-Postgres integration tests for the SQL layer. Opt-in: needs a reachable database and the
// CREATE privilege (it works inside a throwaway schema that is dropped afterwards).
//   npm run test:integration            (uses DATABASE_URL, or TEST_DATABASE_URL if set)
require('dotenv').config();
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const baseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const schema = `it_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const skip = !baseUrl;

let models;
let pool;

before(async () => {
  if (skip) return;
  const admin = new Client({ connectionString: baseUrl });
  await admin.connect();
  await admin.query(`CREATE SCHEMA ${schema}`);
  await admin.end();

  const url = new URL(baseUrl);
  url.searchParams.set('options', `-c search_path=${schema}`);
  process.env.DATABASE_URL = url.toString();
  pool = require('../../config/db');

  const dir = path.join(__dirname, '../../db/migrations');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    await pool.query(fs.readFileSync(path.join(dir, f), 'utf8'));
  }
  models = {
    user: require('../../models/userModel'),
    job: require('../../models/jobModel'),
    app: require('../../models/applicationModel'),
  };
});

after(async () => {
  if (skip) return;
  await pool.end();
  const admin = new Client({ connectionString: baseUrl });
  await admin.connect();
  await admin.query(`DROP SCHEMA ${schema} CASCADE`);
  await admin.end();
});

const opts = { skip: skip && 'no DATABASE_URL' };

test('users: case-insensitive lookup, id lookup returns role only', opts, async () => {
  const u = await models.user.createUser({ name: 'A', email: 'Mixed@Case.io', passwordHash: 'h', role: 'candidate' });
  assert.equal((await models.user.findUserByEmail('MIXED@case.IO')).id, u.id);
  assert.deepEqual(await models.user.findUserById(u.id), { id: u.id, role: 'candidate' });
  assert.equal(await models.user.findUserById(999999), null);
  await assert.rejects(models.user.createUser({ name: 'B', email: 'x@y.io', passwordHash: 'h', role: 'wizard' }));
});

test('applications: uniqueness, hidden columns, filters, ordering, history', opts, async () => {
  const rec = await models.user.createUser({ name: 'Rec', email: 'rec@x.io', passwordHash: 'h', role: 'recruiter' });
  const job = await models.job.createJob({ recruiterId: rec.id, title: 'J', requiredSkills: ['python'] });
  const mk = async (name, score, status) => {
    const u = await models.user.createUser({ name, email: `${name.replace(/\W/g, '')}@x.io`, passwordHash: 'h', role: 'candidate' });
    const a = await models.app.createApplication({
      jobId: job.id, candidateId: u.id, resumeUrl: 'https://u', resumePublicId: 'p', resumeText: 'secret resume text',
      parsedData: { skills: [] }, rankingScore: score, rankingDetails: null,
    });
    if (status) await models.app.updateApplicationStatus(a.id, status, rec.id);
    return { a, u };
  };
  const low = await mk('Low One', 10);
  const high = await mk('High One', 90, 'shortlisted');
  const none = await mk('Unscored', null);
  const pct = await mk('Per%cent', 50);

  // duplicate application -> unique violation code the controller maps to 409
  await assert.rejects(
    models.app.createApplication({ jobId: job.id, candidateId: low.u.id, resumeUrl: 'u', resumePublicId: 'p', parsedData: {} }),
    (e) => e.code === '23505'
  );

  const page = { limit: 10, offset: 0 };
  const byScore = await models.app.listApplicationsByJob(job.id, page);
  assert.deepEqual(byScore.map((r) => r.candidate_name), ['High One', 'Per%cent', 'Low One', 'Unscored']);
  assert.ok(!('resume_url' in byScore[0]) && !('resume_text' in byScore[0]) && !('resume_public_id' in byScore[0]));

  const newest = await models.app.listApplicationsByJob(job.id, { ...page, sort: 'newest' });
  assert.equal(newest[0].candidate_name, 'Per%cent');
  assert.deepEqual((await models.app.listApplicationsByJob(job.id, { ...page, status: 'shortlisted' })).map((r) => r.candidate_name), ['High One']);
  assert.deepEqual((await models.app.listApplicationsByJob(job.id, { ...page, q: 'high' })).map((r) => r.candidate_name), ['High One']);
  // LIKE wildcards in the search text are literal
  assert.deepEqual((await models.app.listApplicationsByJob(job.id, { ...page, q: '%' })).map((r) => r.candidate_name), ['Per%cent']);
  assert.equal((await models.app.listApplicationsByJob(job.id, { ...page, q: '_' })).length, 0);

  // limit + offset page through a stable order without duplicates
  const p1 = await models.app.listApplicationsByJob(job.id, { limit: 2, offset: 0 });
  const p2 = await models.app.listApplicationsByJob(job.id, { limit: 2, offset: 2 });
  assert.equal(p1.length, 3); // limit + 1 sentinel row
  assert.equal(new Set([...p1.slice(0, 2), ...p2].map((r) => r.id)).size, 4);

  // status history is written atomically with the update
  await models.app.updateApplicationStatus(none.a.id, 'rejected', rec.id);
  await models.app.updateApplicationStatus(none.a.id, 'applied', rec.id);
  const hist = await models.app.getStatusHistory(none.a.id);
  assert.deepEqual(hist.map((h) => [h.from_status, h.to_status]), [['applied', 'rejected'], ['rejected', 'applied']]);
  assert.equal(hist[0].changed_by_name, 'Rec');
  assert.equal(await models.app.updateApplicationStatus(999999, 'applied', rec.id), null);

  // ranking inputs include stored text
  const rows = await models.app.listAllForRanking(job.id);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].resume_text, 'secret resume text');
  await models.app.setRanking(low.a.id, 77, { matchedSkills: ['python'] });
  assert.equal((await models.app.listApplicationsByCandidate(low.u.id, page))[0].ranking_score, 77);
});

test('jobs: open listing order and pagination', opts, async () => {
  const rec = await models.user.createUser({ name: 'R2', email: 'r2@x.io', passwordHash: 'h', role: 'recruiter' });
  for (let i = 0; i < 5; i++) await models.job.createJob({ recruiterId: rec.id, title: `Job ${i}`, requiredSkills: [] });
  const closed = await models.job.createJob({ recruiterId: rec.id, title: 'Closed', requiredSkills: [] });
  await models.job.updateJob(closed.id, { status: 'closed' });
  const rows = await models.job.listOpenJobs({ limit: 3, offset: 0 });
  assert.equal(rows.length, 4);
  assert.ok(rows.every((j) => j.status === 'open'));
  assert.ok(new Date(rows[0].created_at) >= new Date(rows[1].created_at));
  const mine = await models.job.listJobsByRecruiter(rec.id, { limit: 100, offset: 0 });
  assert.equal(mine.length, 6); // 5 open + 1 closed (owner sees closed jobs)
});
