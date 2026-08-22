# Implemented Features

Only features that are verifiably working belong here: code exists, it's integrated, the behavior actually works, and it's been checked. Do not add an entry from a plan or an intention — see [[FEATURES]] for planned work and [[PROJECT_PLAN]] for what's next.

---

### User Authentication (Recruiter / Candidate)
- **Status:** `PARTIALLY_IMPLEMENTED` — Recruiter and Candidate register/login fully working; Admin has no account-creation path (deliberate, see [[DECISIONS]]).
- **Where:**
  - Schema: `server/db/migrations/001_create_users.sql`, applied via `server/db/migrate.js`
  - Model: `server/models/userModel.js`
  - Controller: `server/controllers/authController.js`
  - Routes: `server/routes/authRoutes.js` (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`)
  - Middleware: `server/middleware/authMiddleware.js` (`verifyToken`, `requireRole` — `requireRole` has no consumer yet; nothing to protect until Job Posting)
  - Client: `client/src/pages/{Register,Login,Dashboard}.jsx`, `client/src/components/ProtectedRoute.jsx`, `client/src/services/authService.js`
- **Depends on:** PostgreSQL (`ats` database, `ats_app` role — see `server/.env`, gitignored), `JWT_SECRET` env var.
- **Testing status:** No automated tests (tracked in [[TECHNICAL_DEBT]]). Manually verified:
  - 12-case curl battery: register (success/duplicate-email/missing-fields/blocked-admin-role/weak-password), login (success/wrong-password/unknown-email), `/api/auth/me` (valid/missing/garbage token) — all returned expected status codes and payloads.
  - Live browser walkthrough: register → auto-login → redirect to `/dashboard` showing correct name/role → logout → redirect to `/login` → direct navigation to `/dashboard` while logged out correctly redirects to `/login` (`ProtectedRoute` working).
- **Known limitations:**
  - No admin account provisioning path yet.
  - No rate-limiting on login/register.
  - JWT stored in `localStorage` (documented tradeoff, see [[DECISIONS]]).
  - No password-reset flow.
  - No email verification.

---

### Job Management (Posting, Editing, Listing)
- **Status:** `PARTIALLY_IMPLEMENTED` — create/edit/close and both listing views working; "view applicants" not yet possible (no applications exist until Resume Upload).
- **Where:**
  - Schema: `server/db/migrations/002_create_jobs.sql`
  - Model: `server/models/jobModel.js`
  - Controller: `server/controllers/jobController.js`
  - Routes: `server/routes/jobRoutes.js` (`POST /api/jobs`, `PUT /api/jobs/:id`, `GET /api/jobs`, `GET /api/jobs?recruiter=me`, `GET /api/jobs/:id`) — all behind `verifyToken`; create/edit additionally behind `requireRole('recruiter')` + ownership check
  - Client: `client/src/pages/{RecruiterJobs,CandidateJobs}.jsx`, `client/src/services/jobService.js`, `ProtectedRoute` extended with an optional `role` prop
- **Depends on:** Auth (JWT, `users` table).
- **Testing status:** No automated tests (same gap as Auth, tracked in [[TECHNICAL_DEBT]]). Manually verified:
  - 17-case curl battery: create (success/role-blocked/unauthenticated/missing-title), listing (open-jobs/own-jobs/candidate-blocked-from-own), get (found/404), edit (cross-recruiter-ownership-blocked/role-blocked/success), close-then-disappears-from-open-listing, closed-job-still-in-owner's-own-listing.
  - Live browser walkthrough: recruiter logs in → posts a job via the real form → job appears in "My Job Postings" → candidate logs in → sees the job in "Open Jobs" with correct details → candidate blocked from `/recruiter/jobs` (redirected to `/dashboard`).
- **Known limitations:**
  - No edit-via-UI beyond the open/closed toggle (title/skills/etc. aren't editable from the client yet, though the API supports it).
  - No job search, filtering, or pagination.

---

### Resume Upload + AI Parsing
- **Status:** `PARTIALLY_IMPLEMENTED` — full code path built and unit-verified; the real Cloudinary success path isn't yet verified in this environment (no credentials configured). AI ranking is a separate, not-yet-built feature.
- **Where:**
  - Schema: `server/db/migrations/003_create_applications.sql` (one application per job/candidate pair — unique constraint)
  - Model: `server/models/applicationModel.js`
  - Controller: `server/controllers/applicationController.js`
  - Routes: `server/routes/applicationRoutes.js` (`POST /api/applications`, `GET /api/applications?candidate=me`, `GET /api/applications?job=:id`) — all behind `verifyToken`; apply additionally behind `requireRole('candidate')`
  - Services: `server/config/cloudinary.js`, `server/middleware/uploadMiddleware.js` (multer, memory storage, 5MB cap), `server/services/uploadService.js` (Cloudinary raw upload), `server/services/aiServiceClient.js` (calls the AI service, never throws — see [[DECISIONS]])
  - AI service: `ai-service/resume_parser.py` (text extraction), `ai-service/skills_extractor.py` (name/email/phone/skills/experience/education extraction), `POST /parse-resume` in `ai-service/main.py`
  - Client: `client/src/pages/{JobDetail,CandidateApplications,JobApplicants}.jsx` at `/candidate/jobs/:id`, `/candidate/applications`, `/recruiter/jobs/:id`; `client/src/components/ui/FileUpload.jsx`; `client/src/services/applicationService.js`; `apiClient.js` extended for `FormData` bodies
- **Depends on:** Job Posting (done), a Cloudinary account (credentials not yet added to `server/.env` in this environment — see [[DEV_CONTEXT]]).
- **Testing status:** No automated tests (same gap as Auth/Job Posting, see [[TECHNICAL_DEBT]]). Manually verified:
  - 14-case curl battery on `/api/applications`: no file/invalid type/missing jobId/nonexistent job/closed job/role-blocked/unauthenticated (all 400/401/403/404 as expected), all four `GET` access-control branches (`?candidate=me` as candidate/recruiter, `?job=:id` as owner/non-owner/candidate, missing query param).
  - `ai-service`'s `/parse-resume` verified standalone via a real spaCy `en_core_web_sm` install and a generated sample DOCX resume — all six fields (name, email, phone, skills, experienceYears, education) extracted correctly; a phone-extraction regex bug (matched across a paragraph break) was caught and fixed during this verification. Error paths verified: unsupported file type, empty file, `.doc` rejection.
  - `npm run build` (client) clean.
  - **Not yet verified:** `POST /api/applications` success path with a real file (needs real Cloudinary credentials), the 409 duplicate-application case, and a live browser walkthrough of the full apply → view-applicants flow.
- **Known limitations:**
  - AI ranking not built — `JobApplicants.jsx` lists applicants unranked, newest-first.
  - Certifications/projects extraction not built (narrower than [[FEATURES]]'s full description).
  - `.doc` files are accepted but never actually parsed by design — recruiters must review them manually (see [[DECISIONS]]).
  - A parse failure (any reason) doesn't block the application — it's surfaced to the recruiter as a warning instead of parsed fields, by design (see [[DECISIONS]]).
  - AI service's `/parse-resume` has no request authentication (network-isolation only, matches the existing `/health` precedent).
  - Regex-based phone/experience-years/education extraction are heuristics with known edge cases on unusually formatted resumes.
