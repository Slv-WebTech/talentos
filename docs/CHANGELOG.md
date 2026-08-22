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
