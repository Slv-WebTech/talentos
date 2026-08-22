# Project Plan

Roadmap for the ATS system. Updated whenever a phase completes — see [[DEV_CONTEXT]] for the live "what's happening right now" view.

## Completed
- **Documentation baseline** (2026-08-14) — `/docs` established before any code was written.
- **Repo scaffold** (2026-08-14) — `git init`, `.gitignore`, `client/`, `server/`, `ai-service/` created per [[ARCHITECTURE]]'s folder structure. Postgres connection config exists (`server/config/db.js`, unused until Auth needs it).
  - Verified: `server` boots and `GET /api/health` returns `{status:"ok"}`; `ai-service` boots (in its own `venv/`) and `GET /health` returns `{status:"ok"}`; `client` installs and `npm run build` compiles cleanly, with `App.jsx` fetching the server's health route to confirm client↔server wiring.
  - Not included (deliberately deferred, not speculative): `resume_parser.py`/`ranking_model.py`/`skills_extractor.py` stubs, spaCy/sentence-transformers deps, and auth-related packages (`jsonwebtoken`, `bcrypt`) — these land with the features that actually need them, per [[PROJECT_STYLE]]'s "no speculative implementation."

- **Auth** (2026-08-14) — register/login for Recruiter and Candidate roles (Admin intentionally not self-registerable — see [[DECISIONS]]); JWT issuance; bcryptjs password hashing; Postgres `users` table via a hand-rolled migration runner.
  - Verified: 12-case curl battery (register, duplicate email, missing fields, blocked admin self-registration, weak password, login correct/wrong-password/unknown-email, `/api/auth/me` valid/missing/garbage token) all passed; real browser walkthrough of register → auto-login → dashboard → logout → protected-route redirect all confirmed working via browser automation.
  - Not included: automated test suite (manual verification only — tracked as a gap in [[TECHNICAL_DEBT]]), rate-limiting on login/register (also tracked), role-gated routes beyond `requireRole` existing as unused-so-far middleware (no protected business route exists until Job Posting).

- **Job Posting** (2026-08-14) — recruiters create/edit/close job postings (title, department, required skills, min experience, salary range, location); any authenticated user can list open jobs; recruiters can list their own (any status).
  - Verified: 17-case curl battery (create, role-block, auth-block, validation, list open/mine, get single/404, cross-recruiter ownership-block, role-block on edit, close, closed-job-disappears-from-open-listing) all passed; live browser walkthrough (recruiter posts a job → candidate sees it in the open list → candidate blocked from `/recruiter/jobs`) confirmed working.
  - Not included: job search/filtering, pagination, edit-via-UI (only status toggle exists in the recruiter UI; full edit form deferred), a dedicated job-detail page (folded into Resume Upload, since that's when "apply" needs somewhere to happen).

## In Progress
_None._

## Next
Ordered so each step produces something runnable before the next begins.

1. **Resume upload + AI parsing** — candidate uploads PDF/DOC/DOCX; file goes to cloud storage; AI service extracts name, email, phone, skills, experience, education.
   - Dependencies: job posting (done — applications attach to a job), a chosen file-storage provider (see open question in [[DECISIONS]]).
   - Acceptance: an uploaded resume produces a structured candidate record matching the shape in [[PROJECT_CONTEXT]].
2. **Basic AI ranking** — score a parsed resume against a job description via embedding similarity; show ranking % to the recruiter.
   - Dependencies: resume parsing.
   - Acceptance: recruiter sees applicants for a job sorted by ranking score.

## Later
- Interview scheduling (date, interviewer, invitations, status updates)
- Hiring dashboard (active jobs, total/shortlisted candidates, time-to-hire, pipeline view)
- Analytics + PDF/Excel export
- Notifications (shortlisted, interview scheduled, status change, offer, job closed)
- Bonus features — see [[FUTURE_FEATURES]]

## Blocked
_None currently._

## Notes
- Scope sequencing favors a working end-to-end vertical slice (auth → job → resume → ranking) over building every layer in parallel, since this is a single-developer project.
- File storage provider (Cloudinary vs S3) and exact deployment provider (Render vs Railway) are deferred until the step that needs them — see the open decision in [[DECISIONS]].
