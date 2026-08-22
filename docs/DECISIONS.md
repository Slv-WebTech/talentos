# Decisions

Architecture Decision Record. Append new entries; never edit history — if a decision is reversed, add a new entry that supersedes the old one and note that in both.

---

### Decision: Use PostgreSQL as the primary database
**Date:** 2026-08-14
**Context:** The spec allowed PostgreSQL or MongoDB. Core domain data (users, jobs, applications, interviews) is inherently relational — an application belongs to exactly one job and one candidate, an interview belongs to exactly one application.
**Options considered:**
- MongoDB — schema-flexible, convenient for nested/varied resume-parsed data (skills arrays, education arrays) without migrations.
- PostgreSQL — relational, strong fit for foreign-key relationships between jobs/applications/interviews/users; JSONB columns available for the variable parsed-resume payload where flexibility is still needed.
**Decision:** PostgreSQL.
**Reason:** The pipeline relationships (job → applications → interviews, users → roles) are the core of the app and benefit from real foreign keys and joins (e.g., "all applications for a job, joined with candidate and interview data"). JSONB on a `parsed_data` column covers the cases where MongoDB's flexibility would otherwise be the deciding factor, so Postgres gets both without giving up relational integrity.
**Consequences:** Schema migrations are needed as the data model evolves (acceptable trade-off for a single-developer project at this stage). ORM choice (Prisma/Sequelize) still open, to be decided when the "Repo scaffold" step in [[PROJECT_PLAN]] is implemented.

---

### Decision: Rule-based extraction + embedding-similarity ranking instead of a trained ML classifier
**Date:** 2026-08-14
**Context:** The spec mentions spaCy, Transformers, and Scikit-learn for resume parsing/ranking, but no labeled training dataset exists (and sourcing/labeling one is itself a separate project).
**Options considered:**
- Trained scikit-learn classifier (e.g., TF-IDF + logistic regression) — closest to the spec's literal wording, but requires a labeled resume dataset before it can produce meaningful scores.
- LLM-based extraction/ranking via an external API — likely higher accuracy on messy/unusual resume formats, but adds a paid external dependency and network-call latency to a core flow.
- Rule-based extraction (spaCy NER + regex/keyword matching for name/email/phone/skills) + embedding cosine similarity (sentence-transformers) between resume text and job description for ranking.
**Decision:** Rule-based extraction + embedding similarity.
**Reason:** Works immediately with no training data or external API dependency, runs locally/offline, and is straightforward to reason about and debug (a ranking score is just a cosine similarity, not a black-box classifier's output). Still satisfies the spec's "spaCy" and "Transformers"-adjacent mention (sentence-transformers is a Transformers-based library).
**Consequences:** Ranking quality is bounded by embedding similarity's ability to capture "skill match" — it won't reason about years-of-experience thresholds or certifications the way a hand-tuned or trained model might. Acceptable for v1; revisit if ranking quality proves insufficient once real resumes are tested against it.

---

### Decision: MVP-first feature sequencing
**Date:** 2026-08-14
**Context:** The full spec covers auth, job management, resume upload/parsing, ranking, interview scheduling, hiring dashboard, analytics, notifications, and ten bonus features. Building all of it before anything runs end-to-end would leave no working software for a long stretch.
**Options considered:**
- Build every module in parallel across all layers before wiring anything end-to-end.
- Build one vertical slice (auth → job posting → resume upload → parsing → ranking) fully working first, then layer on interviews/analytics/notifications/bonus features.
**Decision:** Vertical slice first, per the `Next`/`Later` split in [[PROJECT_PLAN]].
**Reason:** A working end-to-end slice surfaces integration problems (auth-to-API, file upload-to-AI-service, AI-service-to-database) early, when they're cheapest to fix, rather than after every layer has been built in isolation.
**Consequences:** Interview scheduling, the hiring dashboard, analytics, and notifications are deliberately deferred — they depend on data (applications, statuses) that only exists once the core slice works.

---

### Decision: bcryptjs instead of native bcrypt
**Date:** 2026-08-14
**Context:** The spec names bcrypt for password hashing. Native `bcrypt` requires a compiled addon (node-gyp + a C++ toolchain), which isn't guaranteed to be present on a given machine — this dev environment (Windows) has no verified build toolchain.
**Decision:** Use `bcryptjs`, a pure-JS implementation of the same algorithm.
**Reason:** Identical hashing behavior and API, zero native compilation risk. Avoids an install failing on a contributor's machine for a reason unrelated to the actual feature.
**Consequences:** Slightly slower than native bcrypt (pure JS vs. compiled C++), irrelevant at this project's scale.

### Decision: Hand-rolled SQL migrations instead of an ORM
**Date:** 2026-08-14
**Context:** The Auth step needed a `users` table. [[DECISIONS]]'s earlier open question ("ORM choice still open") had to be resolved to write the first schema.
**Options considered:**
- Prisma/Sequelize — more tooling (type generation, migration CLI), but a new dependency and a learning-curve layer between the code and the actual SQL.
- Raw `pg` queries + a small custom migration runner (`server/db/migrate.js` applies `.sql` files in order, tracked in a `schema_migrations` table).
**Decision:** Raw SQL + custom runner.
**Reason:** `pg` was already a dependency from the scaffold step; no new dependency needed. Full visibility into the exact SQL running against the database — useful both for debugging and for explaining the schema in an interview context. The runner is ~30 lines and covers what's needed (idempotent, ordered, transactional per-file).
**Consequences:** No auto-generated types or query builder — model functions (`server/models/userModel.js`) write parameterized SQL directly. Revisit if the schema grows complex enough that this becomes a real cost (e.g., many-table joins hand-written repeatedly).

### Decision: Admin role is not self-registerable via the public API
**Date:** 2026-08-14
**Context:** `POST /api/auth/register` accepts a `role` field. If `admin` were an accepted value, anyone could grant themselves admin access — a broken-access-control vulnerability, not a hypothetical one.
**Decision:** `server/controllers/authController.js` only accepts `role: 'recruiter' | 'candidate'` at registration; requesting `admin` returns `400`. Verified in the curl test battery (see [[PROJECT_PLAN]]).
**Reason:** Admin accounts should be provisioned deliberately (direct DB insert for now), not handed out to anyone who calls the endpoint.
**Consequences:** There is currently no way to create an admin account except a manual `INSERT` (or a future admin-only provisioning endpoint, itself gated by an existing admin's token). Tracked as a gap in [[FUTURE_FEATURES]] / [[TECHNICAL_DEBT]] until Admin-facing features actually need it.

### Decision: JWT stored in `localStorage` on the client
**Date:** 2026-08-14
**Context:** The client needs to persist the JWT across page reloads to keep a session.
**Options considered:**
- `localStorage` — simple, works with a plain `Authorization: Bearer` header, no server-side session state.
- httpOnly cookie — not readable by JS (safer against XSS token theft), but requires CSRF protection and cookie-specific CORS config.
**Decision:** `localStorage`, via `client/src/services/authService.js`.
**Reason:** Matches the stateless JWT-in-header approach already used by `authMiddleware.js`; simplest correct option for an MVP with no other client-side JS running that would introduce XSS risk yet.
**Consequences:** If third-party scripts are ever added to the client, `localStorage`-stored tokens are readable by any injected script (XSS → token theft). Revisit as an httpOnly-cookie migration if/when that risk becomes real — tracked in [[TECHNICAL_DEBT]].

### Decision: Job listing requires authentication (not fully public)
**Date:** 2026-08-14
**Context:** `GET /api/jobs` could be fully public (typical for job boards) or require login. [[SITE_MAP]] had already documented `/candidate/jobs` with Access="Candidate" before this feature was built.
**Decision:** All `/api/jobs` routes (including the open-jobs listing) sit behind `verifyToken` — no anonymous access. Recruiter-only actions additionally use `requireRole('recruiter')`; editing additionally checks resource ownership (`job.recruiter_id === req.user.id`) in the controller, since `requireRole` only checks role, not which recruiter owns which job.
**Reason:** Matches what was already documented in [[SITE_MAP]] before any code existed. Avoids building an "optional auth" middleware variant (accept a token if present, don't require one) for a single route — not needed yet, and would be speculative until there's an actual reason to let anonymous visitors browse jobs.
**Consequences:** Anyone browsing jobs must have an account first (candidate or recruiter). If public job browsing becomes a real product requirement later, this needs an explicit optional-auth path — not a given, tracked as a future consideration rather than debt.

### Decision: No separate "close job" endpoint
**Date:** 2026-08-14
**Context:** Closing a job posting could be its own endpoint (`PATCH /api/jobs/:id/close`) or just a field update.
**Decision:** `PUT /api/jobs/:id` accepts a partial update including `status` (`'open' | 'closed'`) — no separate close route.
**Reason:** Matches the API surface already documented in [[SITE_MAP]] (`PUT /api/jobs/:id` for "edit job"). One endpoint, one ownership check, one validation path, instead of duplicating both across two routes.

### Open decision: File storage provider (Cloudinary vs S3)
**Date:** 2026-08-14
**Status:** Not yet decided — deferred until the "Resume upload + AI parsing" step in [[PROJECT_PLAN]], since it doesn't block anything before that.

### Open decision: Backend hosting (Render vs Railway)
**Date:** 2026-08-14
**Status:** Not yet decided — deferred until deployment, see [[DEPLOYMENT]].
