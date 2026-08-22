# Technical Debt

Log entries here as soon as a shortcut, hack, or known-imperfect solution lands, in this form:

```
### <short description>
- Introduced: <date>, in <feature/commit>
- Why: <what forced the shortcut — deadline, unknown requirement, etc.>
- Risk: <what breaks if this isn't addressed>
- Fix: <what the proper fix looks like>
- Priority: <high/medium/low>
```

Do not let this file go stale — it's reviewed every time [[PROJECT_SCORE]] is updated.

---

### No automated tests for Auth or Job Posting
- Introduced: 2026-08-14, Auth feature. Widened: 2026-08-14, Job Posting feature (same gap, second feature).
- Why: Prioritized real, thorough manual verification passes (12-case + 17-case curl batteries, plus live browser walkthroughs — see [[PROJECT_PLAN]]) over writing test infrastructure under time pressure. Manual verification proved both features genuinely work; neither is regression-proof.
- Risk: Two features deep now with zero automated coverage. A future change to any auth or job file could silently break registration, login, token verification, role checks, or ownership checks, with nothing catching it before a manual re-check — and the manual re-check surface area only grows with each feature.
- Fix: Add integration tests per [[TESTING]]'s strategy (route-level tests against a test Postgres database) covering the cases already manually verified for both features.
- Priority: high — raise before a third feature (Resume Upload) lands on top of an already-untested Auth + Job Posting.

### Forms use placeholder text as the only label (accessibility)
- Introduced: 2026-08-14, Auth feature (`Login`/`Register`). Repeated: 2026-08-14, Job Posting feature (`RecruiterJobs`' create form).
- Why: Fastest way to get a working form; no accessibility pass has happened yet (see [[PROJECT_STYLE]]'s still-TBD UI tokens).
- Risk: Placeholder-as-label is a known anti-pattern — placeholder text disappears once a field has a value and isn't reliably announced by all screen readers. Now present in two forms, not one.
- Fix: Add real `<label htmlFor>` elements (visually hidden if needed) across all forms in one pass, once real UI styling starts — fixing it form-by-form as each is touched is the wrong order (inconsistent in the meantime).
- Priority: medium — not urgent alone, but tracked so it doesn't silently become five forms' worth of rework instead of two.

### No rate-limiting on `/api/auth/login` or `/api/auth/register`
- Introduced: 2026-08-14, Auth feature.
- Why: Out of scope for getting the core flow working; not part of the Auth acceptance criteria in [[PROJECT_PLAN]].
- Risk: Login is brute-forceable and register is spammable — no throttling exists.
- Fix: Add a rate-limiting middleware (e.g. `express-rate-limit`) scoped to `/api/auth/*` before this is ever exposed outside local development.
- Priority: high — must land before any real deployment (see [[DEPLOYMENT]]).

### No admin account provisioning path
- Introduced: 2026-08-14, Auth feature.
- Why: Deliberate — see the "Admin role is not self-registerable" entry in [[DECISIONS]]. This is a documented security decision, not an oversight, but it currently has no resolution.
- Risk: There's no way to create an admin user except a manual database `INSERT`. Not a security risk itself, but blocks any Admin-facing feature.
- Fix: Either a one-time seed script, or an admin-only `POST /api/admin/users` endpoint gated by `requireRole('admin')` once at least one admin exists.
- Priority: low — no feature needs an admin account yet.

### JWT stored in `localStorage`
- Introduced: 2026-08-14, Auth feature.
- Why: Simplest correct MVP approach — see the full reasoning in [[DECISIONS]].
- Risk: Readable by any injected/XSS script; not currently a real exposure since the client runs no third-party JS, but that assumption could stop being true.
- Fix: Migrate to an httpOnly cookie + CSRF protection if/when third-party scripts are ever added to the client.
- Priority: low, revisit if the risk factor changes.
