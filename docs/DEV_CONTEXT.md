# Dev Context

**This is the file to read first when picking this project back up — including when the user says "continue."**

## Current Objective
Stand up the AI-Powered ATS described in [[PROJECT_CONTEXT]], following the MVP-first sequencing in [[PROJECT_PLAN]].

## Current Development Phase
Resume Upload + AI Parsing — code complete and unit-verified; final end-to-end verification blocked on real Cloudinary credentials (see Current Blockers).

## Current Task
Finish verifying Resume Upload + AI Parsing once Cloudinary credentials are available: run the full `POST /api/applications` success path (real file → Cloudinary → parsed data persisted) and the 409 duplicate-application case, then do a live browser walkthrough (apply as a candidate → view applicants as the owning recruiter).

## Recently Completed Work
- 2026-08-14: `/docs` baseline, repo scaffold, local Postgres provisioning, Auth, Job Posting. See [[CHANGELOG]].
- 2026-08-22: Client design system & premium redesign — every page rebuilt on a new CSS Modules component system (tokens, dark-mode support, responsive app shell). See [[PROJECT_STYLE]] and [[CHANGELOG]].
- 2026-08-22: Resume Upload + AI Parsing — candidates apply to a job with a resume upload; ai-service extracts structured data via spaCy + regex. Code complete, curl battery + ai-service verification passed; real-Cloudinary success path still pending. See [[IMPLEMENTED_FEATURES]], [[DECISIONS]], [[CHANGELOG]].
- 2026-08-22: Repo pushed to GitHub for the first time (`Slv-WebTech/ats-system`, private) — see the GitHub section below.

## Files Recently Changed
- `server/db/migrations/003_create_applications.sql`
- `server/models/applicationModel.js`, `server/controllers/applicationController.js`, `server/routes/applicationRoutes.js`
- `server/config/cloudinary.js`, `server/middleware/uploadMiddleware.js`, `server/services/{uploadService,aiServiceClient}.js` (new `server/services/` folder)
- `server/server.js` (mounts `/api/applications`), `server/.env.example` (Cloudinary keys added, values blank)
- `ai-service/resume_parser.py`, `ai-service/skills_extractor.py`, `ai-service/main.py` (new `/parse-resume`), `ai-service/requirements.txt` (spaCy + `en_core_web_sm` + pdfplumber + python-docx + python-multipart, all version-pinned and verified installable on this machine's Python 3.14)
- `client/src/pages/{JobDetail,CandidateApplications,JobApplicants}.jsx` (+ their `.module.css`), `client/src/components/ui/FileUpload.jsx` (+ `.module.css`)
- `client/src/services/applicationService.js`, `client/src/services/apiClient.js` (FormData support), `client/src/App.jsx` (3 new routes), `client/src/components/layout/AppShell.jsx` (nav updated), `client/src/pages/{CandidateJobs,RecruiterJobs}.jsx` (link into the new detail pages)
- Entire client redesign (2026-08-22, same session): `client/src/styles/{tokens,base}.css`, `client/src/components/ui/*`, `client/src/components/icons/Icons.jsx`, `client/src/components/layout/*`, every existing page rewritten, plus `client/src/pages/NotFound.jsx`.
- All of the above is now **committed and pushed** — see the GitHub section below. Any further changes are new commits on top.

## Important Implementation Details
- Applications: one per `(job_id, candidate_id)` pair (DB unique constraint) — a second apply attempt returns `409`.
- `aiServiceClient.js`'s `parseResume` **never throws** — a parse failure (bad file, ai-service down) resolves to `{ parsedData: { parseError: "..." } }` and the application is still created. This is deliberate, not a bug — see [[DECISIONS]].
- `.doc` uploads are accepted (not blocked) but `resume_parser.py` immediately rejects them with a clear error — no actual `.doc` parsing exists. See [[DECISIONS]].
- Multer uses **memory storage** (`req.file.buffer`), not disk — the same buffer is uploaded to Cloudinary (`resource_type: 'raw'`) and forwarded to the ai-service, no second round trip.
- `GET /api/applications` branches on query param exactly like `GET /api/jobs` does: `?candidate=me` (candidate-only) or `?job=:id` (recruiter, ownership-checked). No query param → `400`.
- Same carryover details from Auth/Job Posting still apply: `PUBLIC_ROLES` restriction, JWT payload shape, `?recruiter=me` convention — see [[DECISIONS]] for the full history.

## Known Issues
- The real Cloudinary upload success path (`POST /api/applications` with a real file, actually reaching Cloudinary) has not been exercised — this environment has no Cloudinary account/credentials. All validation-layer behavior (14 cases) and the entire ai-service parsing pipeline are independently verified; only the Cloudinary leg itself is unverified.
- No live browser walkthrough yet for the apply → view-applicants flow (code-level review + curl + ai-service verification only so far).

## Current Blockers
**Cloudinary credentials needed to finish verification.** `server/.env` needs real `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (placeholders already in `server/.env.example`) — create a free account at cloudinary.com, grab the three values from its dashboard, add them to `server/.env`, restart the server, then run the success-path + 409 curl cases and the browser walkthrough described in [[PROJECT_PLAN]]'s Resume Upload entry.

## Decisions Made Recently
Full entries in [[DECISIONS]]. Since the last "continue," added:
- Cloudinary as the file storage provider (resolves the open decision from 2026-08-14)
- Node forwards the raw upload buffer to both Cloudinary and the AI service (no second round trip)
- A failed AI parse never blocks the application from being created
- Legacy `.doc` is accepted at upload but never actually parsed
- New `server/services/` folder for outbound-integration code (added to [[ARCHITECTURE]]'s folder structure)
- CSS Modules (not Tailwind/CSS-in-JS) for the client design system

Still **open**: backend host (Render vs Railway) — deferred until deployment.

## Things That Must NOT Be Changed
- Everything from Auth/Job Posting (ports/env var names, JWT payload shape, `PUBLIC_ROLES`, `?recruiter=me`) still applies.
- The multipart field name `resume` for the upload — used end-to-end: client `FormData` → multer's `upload.single('resume')` → the ai-service's own `FormData` field → FastAPI's `resume: UploadFile`. Renaming it anywhere breaks the chain silently (wrong field name just means `req.file`/`resume` is `undefined`, not an error).
- The `?candidate=me` / `?job=:id` query-param convention on `GET /api/applications` — `applicationController.js`'s `list` branches on it, same pattern as jobs.

## Next Recommended Action
Once Cloudinary credentials are added and the remaining verification above passes, start **Basic AI ranking** (see [[PROJECT_PLAN]]) — score a parsed resume against a job description via sentence-transformers embedding similarity (no trained classifier, per [[DECISIONS]]), surfaced as a ranking % on `JobApplicants.jsx`. This is the first ai-service feature needing `sentence-transformers` (not yet in `ai-service/requirements.txt`) — verify it installs cleanly on this machine's Python 3.14 the same way spaCy was verified, before writing the ranking code.

## Commands
| Service | Install | Run (dev) | Build | Migrate |
|---|---|---|---|---|
| `client/` | `npm install` | `npm run dev` (→ Vite picks a port; see operating note below) | `npm run build` | — |
| `server/` | `npm install` | `npm run dev` (→ http://localhost:5000 by default, auto-reload) | — | `npm run migrate` |
| `ai-service/` | `python -m venv venv` then `venv/Scripts/pip install -r requirements.txt` | `venv/Scripts/python -m uvicorn main:app --reload --port 8000` | — | — |

No automated tests exist yet — see [[TESTING]] and [[TECHNICAL_DEBT]].

## GitHub
Repo pushed 2026-08-22: `https://github.com/Slv-WebTech/ats-system` (private). This machine has multiple SSH identities configured (`~/.ssh/config`): `github-personal` → `Slv-WebTech` account, `github-work` → a different account, and the **bare `github.com` host defaults to the work key** — always use the explicit `git@github-personal:...` remote URL for this repo, not `git@github.com:...`, or pushes silently authenticate as the wrong account. `gh` CLI is authenticated as both accounts; check `gh auth status`'s "Active account" line before running `gh` commands that create/modify repos.

## Operating notes for this specific dev machine
Learned the hard way during verification passes — not project bugs, just facts about this environment:
- **Ports 5000, 5050, and 5173–5175 are frequently already occupied** by unrelated processes on this machine (confirmed: an unrelated "CRM System" app on 5173, something running `node --watch src/index.js` on 5000, and — new as of 2026-08-22 — this machine runs *many* concurrent Claude Code sessions on unrelated projects simultaneously, so "something on port 5000" may be a live dev server from a completely different project, not a stale process). Before assuming the server/client are reachable at their default ports, check `Get-NetTCPConnection -LocalPort <port>` or the actual Vite startup log (it auto-increments and prints the real port, e.g. `5176`) rather than assuming.
- **`/tmp` is shared across concurrent sessions on this machine** — redirecting command output to a generic path like `/tmp/server.log` can silently mix content from another session's process into the same file. Use the session-scoped background-task output (or a session-specific scratch directory) instead of hand-rolled `/tmp/*.log` redirects.
- **To stop a background dev process reliably:** find the real PID via `Get-NetTCPConnection -LocalPort <port> | Select-Object OwningProcess` and `Stop-Process -Id <that pid> -Force`. Neither Bash's `kill $!` nor `Stop-Process` by process name (e.g., all of `node`) reliably targets the right process on this machine — both have produced wrong results before.
- **If client and server run on non-default ports**, the server's CORS (`CLIENT_URL` env var) must match the client's *actual* port or the browser fails with a generic "Failed to fetch" (a CORS rejection, not a code bug) — this happened once during Job Posting verification.
- **Browser-automation clicks can silently fail to register** on this setup (seen twice: a logout button and a login submit button, both otherwise-correct) with no error and no network request — confirmed by checking `localStorage` / network requests, not by trusting the visual page state alone. A JS-dispatched `.click()` via `javascript_tool` reliably worked as a fallback both times. Don't conclude a feature is broken from one failed automated click without cross-checking via network requests or direct JS.
- **spaCy installs cleanly on this machine's Python 3.14** (confirmed 2026-08-22: `spacy==3.8.13` + the `en_core_web_sm-3.8.0` model wheel both installed via pip with no source build) — this was a real risk going in (compiled-dependency wheels don't always exist yet for a brand-new Python version) and turned out fine. Worth re-verifying the same way (`pip install --dry-run` first) before adding the next ai-service dependency (`sentence-transformers`, needed for AI ranking).

## Environment Requirements
Node v24.13.0, npm 11.10.1, Python 3.14.2, PostgreSQL 17 (running locally as a Windows service) all confirmed available. `server/.env` holds the real `DATABASE_URL`/`JWT_SECRET`/`AI_SERVICE_URL` (gitignored, not in this repo's history) — `CLOUDINARY_*` keys still need to be added, see Current Blockers.
