# Project Style Guide

Status: **initial defaults**, established before any UI/code exists. Follow these once implementation starts; revise here (don't drift silently) if a convention proves wrong.

## UI Style
Not yet established — no components exist. Visual tokens (color system, typography, spacing scale, radii, shadows) should be defined when the first UI work begins (client scaffold + login/register screens), not invented speculatively now. When that happens, this section gets filled in and this note removed.

## UX Style
General principles to follow once screens exist:
- **Interaction patterns:** optimistic UI only where failure is rare and recoverable (e.g., not for resume upload); otherwise show explicit loading state.
- **Navigation:** role-based — Admin/Recruiter/Candidate each land on a dashboard scoped to their role; no shared nav items that 404 for a role.
- **Feedback:** every mutating action (create job, upload resume, schedule interview) gets a visible success/error state — no silent failures.
- **Error handling UX:** surface the actual problem (e.g., "resume must be PDF/DOC/DOCX") rather than a generic "something went wrong".
- **Confirmation:** destructive actions (closing a job, rejecting a candidate) require explicit confirmation.
- **Mobile:** every screen must be usable at a 768px breakpoint and below (see the spec's responsive requirement in [[PROJECT_CONTEXT]]).

## Code Style

### Naming Conventions
- **Components (React):** PascalCase (`JobCard.jsx`, `CandidateRankingTable.jsx`).
- **Files (server):** camelCase for JS modules (`jobController.js`, `authMiddleware.js`).
- **Files (AI service):** snake_case per Python convention (`resume_parser.py`, already matches the spec).
- **Functions/variables:** camelCase in JS, snake_case in Python.
- **Constants:** UPPER_SNAKE_CASE.
- **Database:** snake_case table and column names (`required_skills`, `ranking_score`).

### Folder Conventions
Follow the structure in [[ARCHITECTURE]] exactly — `client/{components,dashboard,pages,services}`, `server/{controllers,routes,middleware,models}`, `ai-service/` flat (small enough not to need subfolders yet).

### API Patterns
- REST, resource-based routes (`/api/jobs/:id`, not `/api/getJob`).
- Request/response bodies are JSON; consistent envelope: `{ data }` on success, `{ error: { message } }` on failure — established in `server/controllers/authController.js`, follow this for every new route.
  - Exception: `/api/health` (and `/health` on the AI service) return a flat, unwrapped body — standard practice for health/readiness checks consumed by infra tooling, not application clients.
- Auth via `Authorization: Bearer <jwt>` header, verified in Express middleware (`server/middleware/authMiddleware.js`'s `verifyToken`) — no auth logic inside controllers. Role gating via the same file's `requireRole(...role)`.

### Error Handling
- Controllers throw/catch and pass to a single Express error-handling middleware — no ad-hoc `res.status(500)` scattered per-route.
- AI service uses FastAPI's exception handlers for consistent error JSON shape.
- Validate at the boundary (request body, file upload) — don't defensively re-validate internal function calls.

### Comments
- No comments explaining *what* code does — names should carry that.
- A comment is justified only for a non-obvious *why* (a workaround, a subtle constraint) — matches the general engineering default for this project.

### Testing Conventions
See [[TESTING]] for the full strategy. In short: co-locate unit tests next to the code they test (`jobController.test.js` beside `jobController.js`), integration tests per service under a `tests/` folder.

## When existing patterns exist
Once real code exists, prefer the established pattern over inventing a new one — this file should be updated to reflect what's actually in use, not aspirational rules nobody follows.
