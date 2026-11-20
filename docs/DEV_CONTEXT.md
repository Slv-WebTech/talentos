# Dev Context

**This is the file to read first when picking this project back up — including when the user says "continue."**

## Current Objective
Ship TalentOS's core hiring slice (auth → jobs → resumes → scoring → pipeline) with production-grade hygiene, then add interview scheduling and analytics ([[PROJECT_PLAN]]).

## Current Development Phase
Core slice complete and hardened (review + QA passes done, see [QA-REPORT](QA-REPORT.md)). Waiting on a PR review of the hardening / branding branch; the next feature is interview scheduling.

## Current State
- **Implemented and tested:** everything in [[IMPLEMENTED_FEATURES]] — 54 automated tests (server 24, real-Postgres 3, ai-service 15, client 12) plus a live Chrome pass; CI workflow in `.github/workflows/ci.yml`.
- **Not verified:** the real Cloudinary upload path (no credentials in the dev environment), light theme, non-Chrome browsers, screen readers, load at scale.

## Important Implementation Details
- One application per `(job_id, candidate_id)` (DB unique) → duplicate apply is `409`.
- `aiServiceClient.parseResume` / `rankCandidate` **never throw**: failures become `{ parseError }` / `null`, and the application is still created (see [[DECISIONS]]).
- Resumes are private Cloudinary assets (`type: authenticated`); only `GET /api/applications/:id/resume-url` hands out a 5-minute signed URL. List queries select explicit columns and never return `resume_url`, `resume_public_id` or `resume_text`.
- `verifyToken` re-reads the user each request; handlers must use `req.user.role` (DB role), not token claims.
- IDs, pagination and job fields go through `utils/ids.js`, `utils/pagination.js` and `jobController.validateJobFields` — keep new endpoints on the same helpers.
- Pipeline transition table lives in `applicationController.js` and is mirrored in `client/src/services/applicationService.js` — change both.
- Multipart field name is `resume` end to end (client → multer → ai-service).
- `GET /api/applications` branches on `?candidate=me` vs `?job=:id`; `GET /api/jobs` on `?recruiter=me`.

## Known Issues / Open Items
See [QA-REPORT](QA-REPORT.md) ("Remaining — and why") and [[TECHNICAL_DEBT]]. Headlines: JWT in `localStorage`, no refresh tokens, register reveals account existence, offset pagination, rule-based (not semantic) matching, no admin UI.

## Current Blockers
Cloudinary credentials are needed to verify the real upload path. Backend host choice (Render vs Railway) is deferred until deployment.

## Next Recommended Action
Merge the hardening / branding PR, add Cloudinary credentials and run the full apply flow once, then start interview scheduling.

## Commands
| Service | Install | Run (dev) | Test | Migrate |
|---|---|---|---|---|
| `client/` | `npm install` | `npm run dev` | `npm test`, `npm run build` | — |
| `server/` | `npm install` | `npm run dev` (port 5000) | `npm test`, `npm run test:integration` | `npm run migrate` |
| `ai-service/` | `python -m venv venv` + `pip install -r requirements.txt -r requirements-dev.txt` | `python -m uvicorn main:app --reload --port 8000` | `python -m pytest tests` | — |

Admin account: `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run create-admin` (in `server/`).

## GitHub
`https://github.com/Slv-WebTech/talentos` (private). Work happens on feature branches with Conventional-Commit messages and PRs into `main`; `main` is protected by a ruleset (PR required, no force-push / deletion, linear history).

## Operating notes for this dev machine
- Ports 5000, 5173–5175 are often occupied by unrelated processes — check before starting, and make sure `CLIENT_URL` matches the client's real port or the browser shows a generic "Failed to fetch" (CORS).
- Stop background dev processes via the real PID (`Get-NetTCPConnection -LocalPort <port>` → `Stop-Process`), not by killing shells.
- The dev database user may not have `CREATEDB`; integration tests therefore use a throw-away **schema**, not a database.
- Files saved from some tools may have mixed line endings; Git normalises them (`LF will be replaced by CRLF` warnings are harmless).

## Environment Requirements
Node 20+ (tested on 24), Python 3.11+ (tested on 3.14), PostgreSQL 14+ (tested on 17; CI uses 16). `server/.env` holds real values and is git-ignored; copy `server/.env.example`.
