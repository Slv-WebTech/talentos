# Changelog

### 2026-08-14 — Documentation baseline created
No application code yet. Established `/docs` per the project's standing development protocol before any implementation begins:
- `PROJECT_CONTEXT.md`, `PROJECT_PLAN.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `PROJECT_STYLE.md`, `FEATURES.md`, `IMPLEMENTED_FEATURES.md`, `FUTURE_FEATURES.md`, `SITE_MAP.md`, `PROJECT_SCORE.md`, `TECHNICAL_DEBT.md`, `TESTING.md`, `DEPLOYMENT.md`, `DEV_CONTEXT.md`, `INTERVIEW_GUIDE.md`, `README.md`.
- Key decisions recorded: PostgreSQL as the database, rule-based extraction + embedding-similarity ranking for the AI service (no trained classifier — no labeled data available), MVP-first feature sequencing. Full reasoning in [[DECISIONS]].
- Next up: repo scaffold (`git init`, `client/`/`server/`/`ai-service/` folders) — see [[PROJECT_PLAN]].

### 2026-08-14 — Repo scaffold
`git init` (branch `main`, nothing committed yet) plus a minimal skeleton for all three services:
- `client/` — Vite + React, `App.jsx` calls the server's health route to prove client↔server wiring.
- `server/` — Express, `GET /api/health`, CORS configured for the Vite dev origin, `config/db.js` (Postgres pool, not yet used by any route).
- `ai-service/` — FastAPI, `GET /health`, dependencies isolated in `ai-service/venv/`.
- Verified all three actually boot (installed, ran, curled, stopped) rather than assuming — see [[DEV_CONTEXT]] for exact commands.
- Deliberately not included: `resume_parser.py`/`ranking_model.py`/`skills_extractor.py`, spaCy/sentence-transformers, `jsonwebtoken`/`bcrypt` — deferred to the features that need them.
- Next up: Auth (Postgres `users` table, register/login, JWT) — see [[PROJECT_PLAN]].

### 2026-08-14 — Local PostgreSQL provisioned
Created a dedicated `ats_app` role and `ats` database on the existing local Postgres 17 install (not using the `postgres` superuser for the app). Credentials in `server/.env` (gitignored).

### 2026-08-14 — Auth
Register/login for Recruiter and Candidate roles, end to end:
- `server/`: `users` table migration + runner, `userModel.js`, `authController.js` (register/login/duplicate-email/validation), `authMiddleware.js` (`verifyToken`/`requireRole`), `GET /api/auth/me`, centralized `errorHandler.js`.
- `client/`: `react-router-dom` added; `Login`/`Register`/`Dashboard` pages, `ProtectedRoute`, `authService.js` (JWT in `localStorage`).
- Deliberate scope decisions: admin role not self-registerable (security), bcryptjs instead of native bcrypt (Windows compat), raw SQL migrations instead of an ORM — full reasoning in [[DECISIONS]].
- Verified with a 12-case curl battery covering every success/failure path, plus a live browser walkthrough (register → dashboard → logout → protected-route redirect).
- Known gaps tracked in [[TECHNICAL_DEBT]]: no automated tests, no rate-limiting, no admin provisioning path.
- Next up: Job Posting — see [[PROJECT_PLAN]].

### 2026-08-14 — Job Posting
Recruiters create/edit/close job postings; any authenticated user can browse open jobs; recruiters can see their own (any status):
- `server/`: `jobs` table migration, `jobModel.js`, `jobController.js` (create/update/list/get with role + ownership checks), `jobRoutes.js` mounted at `/api/jobs`.
- `client/`: `RecruiterJobs.jsx` (create form + own-jobs list with open/close toggle), `CandidateJobs.jsx` (open-jobs list), `jobService.js`, `ProtectedRoute` extended with a `role` prop for role-gated routes.
- API shape matches what [[SITE_MAP]] had already documented before this was built (`GET /api/jobs`, `GET /api/jobs?recruiter=me`, `POST/PUT /api/jobs[/:id]`).
- Verified with a 17-case curl battery plus a live browser walkthrough (recruiter posts → candidate sees it, closed jobs correctly excluded from the open listing, role- and ownership-based access control all confirmed).
- This dev machine turned out to have several unrelated services already bound to common ports (5000, 5050, 5173–5175) — verification had to route around them with explicit port overrides; see [[DEV_CONTEXT]] for the resulting operating note.
- Next up: Resume upload + AI parsing — see [[PROJECT_PLAN]].

### 2026-08-22 — Client design system & premium redesign
The client had zero CSS through Auth and Job Posting (plain unstyled HTML, inline `fontFamily` only). Built a full design system and applied it to every existing page:
- Design tokens (`client/src/styles/tokens.css`, dark-mode support via `prefers-color-scheme`), a CSS Modules component library, a hand-written icon set, a responsive authenticated app shell and auth layout — full inventory in [[PROJECT_STYLE]].
- Every page redesigned: `Home`, `Login`, `Register`, `Dashboard`, `RecruiterJobs`, `CandidateJobs`, plus a new `NotFound` page and catch-all route.
- Real `<label>` elements on every form field, resolving the placeholder-as-label accessibility gap tracked in [[TECHNICAL_DEBT]] since Auth.
- Fixed a real bug: job listings previously flashed "no jobs" before their initial fetch resolved (missing loading state) — both `RecruiterJobs.jsx` and `CandidateJobs.jsx` fixed.
- CSS Modules chosen over Tailwind/CSS-in-JS — see [[DECISIONS]].
- Verified: `npm run build` clean. No automated visual regression coverage (tracked in [[TECHNICAL_DEBT]]).
- Next up: Resume upload + AI parsing — see [[PROJECT_PLAN]].

### 2026-08-22 — Resume Upload + AI Parsing
Candidates can now apply to a job with a resume upload; the AI service extracts structured data:
- `server/`: `applications` table + migration, `applicationModel.js`/`applicationController.js`/`applicationRoutes.js` (`/api/applications`), Cloudinary integration (`config/cloudinary.js`, new `server/services/` folder), `multer`-based upload middleware (5MB cap, PDF/DOC/DOCX).
- `ai-service/`: first real dependencies beyond FastAPI — spaCy (`en_core_web_sm`), `pdfplumber`, `python-docx`. `resume_parser.py` (text extraction) + `skills_extractor.py` (name/email/phone/skills/experience/education) + `POST /parse-resume`.
- `client/`: `JobDetail`, `CandidateApplications`, `JobApplicants` pages; a new `FileUpload` component; `apiClient.js` extended for file uploads.
- Cloudinary chosen as the file storage provider (resolves the open decision from 2026-08-14); a failed AI parse never blocks an application (surfaced to the recruiter instead); `.doc` files accepted but not parsed by design — full reasoning in [[DECISIONS]].
- Verified: 14-case curl battery on `/api/applications` (validation, auth, role, ownership, all list-access branches); `ai-service`'s `/parse-resume` verified standalone against a generated sample resume, catching and fixing a phone-extraction regex bug along the way; `npm run build` clean.
- Not yet verified: the real Cloudinary success path and the duplicate-application (409) case — this environment has no Cloudinary credentials configured yet; no live browser walkthrough yet. See [[DEV_CONTEXT]] for what's needed to finish verification.
- Next up: Basic AI ranking — see [[PROJECT_PLAN]].

### 2026-08-22 — Project named "TalentOS"
The project ran under the generic working name "ats-system" through Auth, Job Posting, the client redesign, and Resume Upload. The client UI already used the brand "TalentOS" throughout (from the redesign — logo, page titles, meta tags, landing copy); this pass made the project's actual name match everywhere else:
- GitHub repo renamed `Slv-WebTech/ats-system` → `Slv-WebTech/talentos` (GitHub redirects the old URL; `origin` remote updated explicitly regardless — see [[DEV_CONTEXT]]).
- `README.md` and `docs/PROJECT_CONTEXT.md`'s Project Name field updated.
- `client/package.json`/`server/package.json` renamed to `talentos-client`/`talentos-server` (lockfiles resynced via `npm install`, dependency versions unchanged).
- `ai-service/main.py`'s FastAPI title and `server/server.js`'s startup log message updated to match.
- No functional/API changes — naming and metadata only.

## Review hardening pass
- Security: helmet, rate limiting, 100kb body limit, JWT_SECRET startup check, upload magic-byte validation, optional ai-service shared secret, case-insensitive emails, input type/length checks, duplicate-apply race returns 409, orphaned Cloudinary uploads cleaned up.
- Features: `PATCH /api/applications/:id/status` (recruiter-owner only) with a status selector on the applicants page; closed jobs hidden from non-owners.
- Tests: server and ai-service suites; `docker-compose.yml` for local Postgres.

## Private resumes, pagination, ranking
- Migration `004`: `resume_public_id`, `ranking_details`. Resumes now upload as authenticated assets; `GET /api/applications/:id/resume-url` returns a 5-minute signed URL. List endpoints no longer return `resume_url`.
- Pagination: `?limit` (1-100, default 50) and `?offset` on jobs and applications lists; responses include `meta: { limit, offset, hasMore }`.
- AI ranking: ai-service `POST /rank` (deterministic: 70% skill overlap, 30% experience fit). Scores are stored on apply, applicants are ordered best-first, and `POST /api/applications/rerank?job=:id` rescoring is available (UI: "Re-score all").

## QA follow-up pass
- Ranking now uses the full resume text (stored in `applications.resume_text`, never returned by list queries); job edits trigger a background re-rank (5 workers).
- Auth: every request re-reads the account (deleted users 401, DB role wins); login limiter ignores successful logins; hourly register limiter; `JWT_EXPIRES_IN`.
- Pipeline: transition rules, `application_status_history` (migration 005), history endpoint, confirmation + feedback in the UI.
- Applicants: search / status filter / sort, filtered empty state, popup-safe resume opening.
- A11y/UI: tap targets, `aria-controls`, dashboard copy. Tooling: client Vitest suite, real-DB integration tests, GitHub Actions CI, `npm run create-admin`.
