# Project Score

Baseline evaluation, last updated 2026-08-14 after the Job Posting feature. Re-run and update after each major milestone in [[PROJECT_PLAN]].

| Category | Score | Reasoning |
|---|---|---|
| Architecture | 5/10 | A second real feature (beyond auth) proves the layered pattern generalizes — controller/model/route/middleware held up for a genuine domain resource with its own ownership rules. Still no AI-service data flow, no cross-feature data (applications linking jobs to candidates). |
| Code Quality | 5/10 | The dynamic-field-update pattern in `jobModel.js` and the shared validation style across two controllers now show a consistent approach, not a one-off. Still no lint/format tooling wired up. |
| Maintainability | 5/10 | Pattern proven twice (Auth, Job Posting) without needing rework. |
| UI/UX | 2/10 | Same as last update — functional, unstyled. No regression, no improvement. |
| Accessibility | 1/10 | Same gap as last update (placeholder-as-label) — the job forms repeat the pattern rather than fixing it. Still worth addressing in one pass once real styling starts, rather than piecemeal. |
| Performance | N/A | Nothing meaningful to measure yet. |
| Security | 5/10 | Now proven at two levels: role-based (`requireRole`) and resource-level (job ownership check) — verified a recruiter genuinely cannot edit another recruiter's posting, not just that the code looks like it should prevent it. Still missing: rate-limiting (tracked, high priority), no HTTPS/deployment hardening. |
| Testing | 0/10 | Still no automated tests. Both features so far verified thoroughly but manually. This is now two features' worth of manual-only coverage — the case for adding real tests before a third feature lands is getting stronger (see [[TECHNICAL_DEBT]]). |
| Documentation | 6/10 | Stayed in sync (this update, plus new [[DECISIONS]] entries for the API-shape choices made). |
| Scalability | N/A | No system exists to evaluate. |
| Developer Experience | 6/10 | Unchanged from last update — no new tooling added this round. |
| Error Handling | 5/10 | Validation + centralized error handling now proven across two different resource types with different shapes (arrays, enums, numeric ranges), not just auth's simpler string fields. |
| Responsive Design | 1/10 | Unchanged — still no actual responsive work done. |
| Feature Completeness | 2/10 | 2 of 9 features in [[FEATURES]] partially implemented (Auth, Job Management). |

## Overall Project Health Score: 4/10
Up from 3/10: a second feature landed cleanly on the same architecture, and this one proved a meaningfully harder security property (resource ownership, not just role checks) — both genuinely verified, not assumed. The gaps that matter most now are the ones that get more expensive to fix the longer they're deferred: no automated tests (two features deep with only manual coverage) and no accessibility pass (now two sets of forms repeating the same anti-pattern). Both are honestly tracked, not hidden.

## Do not inflate this
Per the standing protocol for this project: scores here must reflect verified, working code — never a plan, an intention, or a partial attempt. Re-score honestly after each milestone.
