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

### Open decision: Backend hosting (Render vs Railway)
**Date:** 2026-08-14
**Status:** Not yet decided — deferred until deployment, see [[DEPLOYMENT]].

---

### Decision: Cloudinary as the file storage provider (resolves the earlier open decision)
**Date:** 2026-08-22
**Context:** Resume Upload needed a cloud storage provider for candidate resume files, deferred since 2026-08-14 (see the now-superseded "Open decision" entry this replaces).
**Options considered:** Cloudinary (simple SDK, API-key auth, generous free tier) vs S3 (more "enterprise standard," needs an AWS account + IAM setup) vs local disk (fastest but doesn't survive a redeploy).
**Decision:** Cloudinary, chosen by the user. Resumes are uploaded with `resource_type: 'raw'` (not `image`) via `cloudinary.uploader.upload_stream`, stored under a `resumes/` folder with a `candidate-{id}-job-{id}-{timestamp}.{ext}` public ID.
**Reason:** Simplest correct option for a single-developer, portfolio-scale project — API-key auth only, no IAM/bucket-policy setup before the first upload works.
**Consequences:** `server/.env` needs `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (real account required — not created by this session, added to `server/.env.example` as placeholders). The `cloudinary` npm package is a new server dependency, alongside `multer` for multipart parsing — both justified the same way `pg`/`bcryptjs`/`jsonwebtoken` were: added when a real feature needed them, not speculatively.

### Decision: Node forwards the raw upload buffer to both Cloudinary and the AI service — no second round trip
**Date:** 2026-08-22
**Context:** ARCHITECTURE.md's data-flow section describes Express receiving the file, storing it, then calling the AI service. The AI service module `resume_parser.py` was always meant to own PDF/DOC/DOCX text extraction, not the Node server.
**Decision:** `server/middleware/uploadMiddleware.js` uses `multer` with **memory storage** (not disk), so `req.file.buffer` is available in the controller. `applicationController.js` uploads that same buffer to Cloudinary (`uploadService.js`) and separately forwards it as `multipart/form-data` to the ai-service's `POST /parse-resume` (`aiServiceClient.js`, using Node's native `fetch`/`FormData`/`Blob` — no new npm dependency).
**Reason:** Avoids downloading the file back from Cloudinary just to hand it to the AI service. Keeps `resume_parser.py` as the sole owner of text-extraction logic, per the existing architecture doc.
**Consequences:** The full resume file briefly exists in server memory during a request — acceptable at the enforced 5MB cap; would need streaming if that cap were ever raised significantly.

### Decision: A failed AI parse never blocks the application from being created
**Date:** 2026-08-22
**Context:** The AI service can legitimately fail to produce structured data — a scanned-image PDF with no extractable text, a corrupted upload, or the ai-service being temporarily down. The naive implementation would `throw` and fail the whole `POST /api/applications` request.
**Decision:** `aiServiceClient.js`'s `parseResume` never throws. On any non-2xx response or network failure, it resolves to `{ parsedData: { parseError: "<message>" } }`, and the controller always proceeds to insert the application row with that as `parsed_data`.
**Reason:** A candidate's ability to apply for a job shouldn't depend on a best-effort parsing step succeeding — that would contradict the "low-friction application process" goal in [[FEATURES]] and the "no silent failures" principle in this file's UX Style section (the failure is visible to the recruiter, in `JobApplicants.jsx`, as a warning banner instead of parsed data — not hidden, but also not blocking).
**Consequences:** Recruiters must manually review any applicant whose card shows a parse-error warning — tracked in [[TECHNICAL_DEBT]].

### Decision: Legacy `.doc` is accepted at upload but never actually parsed
**Date:** 2026-08-22
**Context:** Pre-2007 binary Word `.doc` has no good free-library support in Python without external binaries (e.g. `antiword`) that add real deployment complexity for a format that's now rare in practice.
**Decision:** `.doc` is not blocked client-side or at the Express upload-validation layer (a candidate can still pick one). `ai-service/resume_parser.py`'s `extract_text` immediately raises `ResumeExtractionError` for `.doc` with a clear message — no extraction is actually attempted. The upload still succeeds (per the decision above); the recruiter sees a parse-error warning instead of parsed fields.
**Reason:** Honest about what "best effort" actually means here rather than pretending partial support exists. PDF and DOCX cover the overwhelming majority of real resumes.
**Consequences:** Any candidate who uploads a `.doc` resume gets zero structured data — recruiters must open the file manually via the "View resume" link. Tracked in [[TECHNICAL_DEBT]].

### Decision: CSS Modules (not Tailwind/styled-components) for the client design system
**Date:** 2026-08-22
**Context:** The client redesign needed a real design system (tokens, reusable components) — [[PROJECT_STYLE]]'s UI Style section had been an explicit placeholder since scaffold.
**Options considered:** Tailwind CSS (utility-first, widely used, but a new dependency plus a build-config layer); styled-components/Emotion (CSS-in-JS, runtime cost, another dependency); plain CSS Modules (native to Vite, zero new dependency, real per-component style scoping).
**Decision:** CSS Modules, with a single `client/src/styles/tokens.css` defining design tokens as CSS custom properties that every component's `.module.css` references.
**Reason:** Vite supports `*.module.css` with zero configuration — no new dependency, matches this project's general "don't introduce unnecessary dependencies" stance the same way `bcryptjs`/raw-SQL-migrations decisions did. Token-driven theming (including free dark-mode support via `prefers-color-scheme`) works the same as it would with any other approach.
**Consequences:** No utility-class shorthand — every component owns an explicit stylesheet. Acceptable at this project's scale; revisit only if the component count grows large enough that hand-written CSS becomes the bottleneck.

### Decision: New `server/services/` folder for outbound-integration code
**Date:** 2026-08-22
**Context:** `uploadService.js` (Cloudinary) and `aiServiceClient.js` (calling the AI service) are neither SQL access (the existing `models/` convention) nor request/response handling (`controllers/`) — [[ARCHITECTURE]]'s folder list didn't have a place for this.
**Decision:** Added `server/services/` for outbound calls to external systems. `ARCHITECTURE.md`'s folder structure section is updated to include it.
**Reason:** Precedent already existed for a folder outside the original four (`server/config/db.js`); outbound-integration code deserves the same treatment rather than being crammed into a controller.
**Consequences:** None — purely additive to the existing structure.

### Decision: Re-check the account on every authenticated request
**Date:** 2026-11
**Context:** QA showed a deleted or demoted user kept their token's privileges for up to 7 days.
**Decision:** `verifyToken` verifies the JWT, then loads the user by id; missing user → 401, and `req.user.role` comes from the database rather than the token claim.
**Reason:** Immediate revocation without a token blocklist or refresh flow; one primary-key lookup per request is cheap.
**Consequences:** One extra query per request. Refresh tokens / httpOnly cookies remain an open product decision ([QA-REPORT](QA-REPORT.md)).

### Decision: Rule-based scoring over the full resume text
**Date:** 2026-11
**Context:** Scores based only on parser-extracted skills could never match skills outside the ~60-term vocabulary (e.g. Figma, SAP).
**Decision:** The AI service returns the resume text, the server stores it in `applications.resume_text` (never in list payloads), and `/rank` matches required skills against the extracted skills **or** whole words in the text. Weights (70 % skills / 30 % experience) re-normalise over the criteria a job sets.
**Reason:** Deterministic, explainable, no model download; fixes the structural false-negative. Embeddings remain a roadmap item.
**Consequences:** Larger rows (text capped at 50 000 chars); scores are refreshed in the background when a job's criteria change.

### Decision: Enforced pipeline transitions with an audit trail
**Date:** 2026-11
**Context:** Any status could jump to any other (`rejected → selected`) and nothing recorded who changed it.
**Decision:** A transition table (applied → shortlisted/rejected; shortlisted → applied/interview/rejected; interview → shortlisted/selected/rejected; selected → interview; rejected → applied/shortlisted) is enforced server-side; every change writes `application_status_history` in the same transaction. The UI offers only valid moves and confirms Selected / Rejected.
**Reason:** Prevents accidental or inconsistent outcomes and gives recruiters accountability.
**Consequences:** The table is a product assumption — edit `TRANSITIONS` in `applicationController.js` and the client service together.

### Decision: Private resume storage with short-lived signed links
**Date:** 2026-11
**Context:** Public Cloudinary URLs let anyone with a link read a resume.
**Decision:** Upload as `authenticated` assets, store only the public id, and expose resumes through `GET /api/applications/:id/resume-url` (5-minute signed URL, owner only).
**Reason:** Candidate PII stays behind the API's authorisation checks.
**Consequences:** Cloudinary signed links can't be bound to a user; legacy rows keep their old URL.
