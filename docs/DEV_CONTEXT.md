# Dev Context

**This is the file to read first when picking this project back up — including when the user says "continue."**

## Current Objective
Stand up the AI-Powered ATS described in [[PROJECT_CONTEXT]], following the MVP-first sequencing in [[PROJECT_PLAN]].

## Current Development Phase
Job Posting (Phase 3) — just completed. Auth + Job Posting both work end-to-end; no resume/AI/interview/analytics features exist yet.

## Current Task
None in progress. Next task is queued (see below).

## Recently Completed Work
- 2026-08-14: `/docs` baseline, repo scaffold, local Postgres provisioning, Auth. See [[CHANGELOG]].
- 2026-08-14: Job Posting — create/edit/close for recruiters, open-jobs listing for any authenticated user, recruiter's-own listing. Fully verified (17-case curl battery + live browser walkthrough). See [[IMPLEMENTED_FEATURES]] for exact scope and [[DECISIONS]] for the choices made (auth-required listing, no separate close endpoint).

## Files Recently Changed
- `server/db/migrations/002_create_jobs.sql`
- `server/models/jobModel.js`, `server/controllers/jobController.js`, `server/routes/jobRoutes.js`
- `server/server.js` (mounts `/api/jobs`)
- `client/src/pages/{RecruiterJobs,CandidateJobs}.jsx`, `client/src/services/jobService.js`
- `client/src/components/ProtectedRoute.jsx` (added optional `role` prop)
- `client/src/pages/Dashboard.jsx` (role-conditional links to the new pages)
- `client/src/App.jsx` (two new routes)
- Repo is still git-initialized on `main` with **nothing committed** — everything above is sitting as untracked/new files, ready for review before the first commit.

## Important Implementation Details
- `GET /api/jobs` requires auth (any role) — not fully public. See [[DECISIONS]] for why.
- Editing a job checks **both** `requireRole('recruiter')` (role-level) **and** `job.recruiter_id === req.user.id` (resource-level, in `jobController.js`) — a recruiter can't edit another recruiter's posting. This was explicitly verified, not just written and assumed.
- No separate close endpoint — `PUT /api/jobs/:id` accepts a partial update including `status`.
- `required_skills` is a Postgres `TEXT[]`; the client sends/receives a plain JS array (comma-separated input parsed client-side in `RecruiterJobs.jsx`).
- Same carryover details from Auth still apply: `PUBLIC_ROLES` restriction, JWT payload shape, ports/env var names — see [[DECISIONS]] for the full history.

## Known Issues
None in the code. See the operating note below for a environment quirk on this specific dev machine.

## Current Blockers
None.

## Decisions Made Recently
Full entries in [[DECISIONS]]. Since the last "continue," added:
- Job listing requires authentication (not a public job board — yet)
- No separate close endpoint (status is just another updatable field)

Still **open**: file storage provider (Cloudinary vs S3), backend host (Render vs Railway).

## Things That Must NOT Be Changed
- Everything from the Auth phase (ports/env var names, JWT payload shape, `PUBLIC_ROLES`) still applies.
- The `?recruiter=me` query-param convention for "my jobs" — `jobController.js`'s `list` branches on it, and the client's `jobService.js` depends on this exact contract.

## Next Recommended Action
Start **Resume Upload + AI Parsing** in [[PROJECT_PLAN]]. This is the first feature touching `ai-service/` and external file storage — before writing code, the file-storage provider decision (Cloudinary vs S3, still open in [[DECISIONS]]) needs to be made. Surface that choice to the user at the start of that step rather than assuming.

## Commands
| Service | Install | Run (dev) | Build | Migrate |
|---|---|---|---|---|
| `client/` | `npm install` | `npm run dev` (→ Vite picks a port; see operating note below) | `npm run build` | — |
| `server/` | `npm install` | `npm run dev` (→ http://localhost:5000 by default, auto-reload) | — | `npm run migrate` |
| `ai-service/` | `python -m venv venv` then `venv/Scripts/pip install -r requirements.txt` | `venv/Scripts/python -m uvicorn main:app --reload --port 8000` | — | — |

No automated tests exist yet — see [[TESTING]] and [[TECHNICAL_DEBT]].

## Operating notes for this specific dev machine
Learned the hard way during Job Posting verification — not project bugs, just facts about this environment:
- **Ports 5000, 5050, and 5173–5175 are frequently already occupied** by unrelated processes on this machine (confirmed at least one is an unrelated "CRM System" app on 5173, and something running `node --watch src/index.js` on 5000 — neither is part of this project). Before assuming the server/client are reachable at their default ports, check `Get-NetTCPConnection -LocalPort <port>` or the actual Vite startup log (it auto-increments and prints the real port, e.g. `5176`) rather than assuming.
- **To stop a background dev process reliably:** find the real PID via `Get-NetTCPConnection -LocalPort <port> | Select-Object OwningProcess` and `Stop-Process -Id <that pid> -Force`. Neither Bash's `kill $!` nor `Stop-Process` by process name (e.g., all of `node`) reliably targets the right process on this machine — both have produced wrong results before.
- **If client and server run on non-default ports**, the server's CORS (`CLIENT_URL` env var) must match the client's *actual* port or the browser fails with a generic "Failed to fetch" (a CORS rejection, not a code bug) — this happened once during Job Posting verification.
- **Browser-automation clicks can silently fail to register** on this setup (seen twice: a logout button and a login submit button, both otherwise-correct) with no error and no network request — confirmed by checking `localStorage` / network requests, not by trusting the visual page state alone. A JS-dispatched `.click()` via `javascript_tool` reliably worked as a fallback both times. Don't conclude a feature is broken from one failed automated click without cross-checking via network requests or direct JS.

## Environment Requirements
Node v24.13.0, npm 11.10.1, Python 3.14.2, PostgreSQL 17 (running locally as a Windows service) all confirmed available. `server/.env` holds the real `DATABASE_URL`/`JWT_SECRET` (gitignored, not in this repo's history).
