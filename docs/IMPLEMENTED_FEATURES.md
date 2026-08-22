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
  - No job-detail page yet (deferred to Resume Upload, where "apply" needs a place to happen).
