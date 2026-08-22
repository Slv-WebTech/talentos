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

- **Client design system & premium redesign** (2026-08-22) — the client had zero CSS (plain unstyled HTML) through Auth and Job Posting; this pass built a full design system and applied it to every existing page.
  - Delivered: design tokens (`client/src/styles/tokens.css`, incl. dark-mode support), a CSS Modules component library (`Button`/`Card`/`Badge`/`Alert`/`Skeleton`/`EmptyState`/`Field`/`FileUpload`/`RoleOption`/`Logo`), a hand-written icon set, a responsive authenticated app shell + auth layout, and every page (`Home`, `Login`, `Register`, `Dashboard`, `RecruiterJobs`, `CandidateJobs`, `NotFound`) redesigned on top of it. Fixed a real bug along the way: job listings no longer flash "no jobs" before their initial fetch resolves. See [[PROJECT_STYLE]] for the full system and [[DECISIONS]] for why CSS Modules over Tailwind/CSS-in-JS.
  - Verified: production build clean (`npm run build`); no automated visual regression tests (see [[TECHNICAL_DEBT]]).
  - Not included: dark-mode *toggle* UI (the token layer supports it via `prefers-color-scheme`, no in-app switch); no design work yet for the pages this step also shipped (`JobDetail`, `CandidateApplications`, `JobApplicants` — built directly on the same system as part of Resume Upload, below).

- **Resume upload + AI parsing** (2026-08-22) — candidates upload a resume (PDF/DOC/DOCX) when applying to a job; the AI service extracts structured data (name, email, phone, skills, experience years, education) via spaCy NER + regex/keyword matching (no trained classifier, no LLM call — see [[DECISIONS]]).
  - `server/`: `applications` table migration (one application per job/candidate pair, unique constraint), `applicationModel.js`, `applicationController.js`, `applicationRoutes.js` mounted at `/api/applications`; `server/config/cloudinary.js`, `server/middleware/uploadMiddleware.js` (multer, memory storage, 5MB cap, PDF/DOC/DOCX only), new `server/services/` (`uploadService.js`, `aiServiceClient.js`).
  - `ai-service/`: `resume_parser.py` (PDF via `pdfplumber`, DOCX via `python-docx`), `skills_extractor.py` (spaCy `en_core_web_sm` NER for name, regex for email/phone/experience-years, curated keyword list for skills, keyword pass for education), `POST /parse-resume` in `main.py`.
  - `client/`: `JobDetail.jsx` (job info + apply, or "already applied" state) at `/candidate/jobs/:id`, `CandidateApplications.jsx` at `/candidate/applications`, `JobApplicants.jsx` (unranked applicant list) at `/recruiter/jobs/:id`; `FileUpload` component (drag-and-drop + click-to-browse, client-side validation); `apiClient.js` extended to support `FormData` bodies.
  - Verified: 14-case curl battery on `/api/applications` (missing file, invalid type, missing/invalid/closed jobId, role-block, auth-block, all four list-access-control branches, missing-query-param) all passed; `ai-service`'s `/parse-resume` verified standalone against a generated sample resume (all six fields extracted correctly, including a phone-extraction regex bug caught and fixed) plus its error paths (unsupported type, empty file, `.doc` rejection); `npm run build` clean. **Not yet verified**: the full success path through a real Cloudinary upload (`POST /api/applications` with a real file) and the 409 duplicate-application case — both need real Cloudinary credentials, which this session doesn't have (see [[DEV_CONTEXT]]); no live browser walkthrough yet.
  - Not included: AI ranking (next item below), certifications/projects extraction (present in [[FEATURES]]'s broader description, narrower than this phase's acceptance criterion), auth on the ai-service's `/parse-resume` (network-isolation only, tracked in [[TECHNICAL_DEBT]]).

## In Progress
_None._

## Next
Ordered so each step produces something runnable before the next begins.

1. **Basic AI ranking** — score a parsed resume against a job description via embedding similarity; show ranking % to the recruiter.
   - Dependencies: resume parsing (done).
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
