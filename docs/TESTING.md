# Testing

Status: **planned strategy, not yet executed** — no tests exist because no code exists ([[IMPLEMENTED_FEATURES]]).

## Strategy
Test each service at the level appropriate to its role, added alongside the feature that needs it (per Phase 4 "Step 5 — Verify" of the standing dev protocol) — not retrofitted later.

## Unit Tests
- **client/**: component logic and utility functions (e.g., a ranking-score formatter) — Vitest + React Testing Library.
- **server/**: controller/middleware logic in isolation (e.g., JWT verification, validation) — Jest or Vitest.
- **ai-service/**: parsing and ranking functions in isolation (e.g., "does skill extraction find 'React' in this text") — pytest.

## Integration Tests
- **server/**: route-level tests against a real (test) Postgres database — e.g., "POST /api/jobs creates a row and returns it."
- **ai-service/**: end-to-end parse-a-sample-resume-file tests against `main.py`'s actual endpoints.

## End-to-End Tests
- Full flow through the client (register → login → post job → apply → view ranked candidates) — deferred until the core vertical slice in [[PROJECT_PLAN]] exists; likely Playwright.

## Test Commands
Not applicable yet — no `package.json`/`requirements.txt` exists. This section gets filled in with real commands (`npm test`, `pytest`, etc.) once the repo scaffold step lands, and mirrored into [[DEV_CONTEXT]].

## Coverage Expectations
No hard percentage target. Priority is covering the paths that are expensive to get wrong: auth, payment-adjacent flows (none currently), and the resume parsing/ranking pipeline (silent wrong output there is hard to notice).

## Critical Flows (must be tested before considered done)
1. Register/login for all three roles, including rejected/duplicate cases.
2. Job creation → visible to candidates only when open.
3. Resume upload → parsed data matches the shape in [[PROJECT_CONTEXT]].
4. Ranking score is deterministic for the same resume+job pair (no silent randomness).
5. Role-based access control — a Candidate token must not be able to hit Recruiter/Admin-only routes.

## Known Untested Areas
Everything — nothing is built yet.
