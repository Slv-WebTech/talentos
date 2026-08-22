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

### No automated tests for Auth, Job Posting, or Resume Upload
- Introduced: 2026-08-14, Auth feature. Widened: 2026-08-14, Job Posting feature. Widened again: 2026-08-22, Resume Upload + AI Parsing (third feature, same gap).
- Why: Prioritized real, thorough manual verification passes (12/17/14-case curl batteries, plus live browser walkthroughs where done — see [[PROJECT_PLAN]]) over writing test infrastructure under time pressure. Manual verification proved each feature genuinely works at the time it shipped; none is regression-proof.
- Risk: Three features deep now with zero automated coverage. A future change to any auth, job, or application file could silently break registration, login, role/ownership checks, or the upload→parse→persist pipeline, with nothing catching it before a manual re-check — and the manual re-check surface area keeps growing.
- Fix: Add integration tests per [[TESTING]]'s strategy (route-level tests against a test Postgres database) covering the cases already manually verified across all three features.
- Priority: high — was already flagged before Resume Upload landed; now the strongest case yet to address before a fourth feature (AI ranking) lands.

### AI service's `/parse-resume` has no request authentication
- Introduced: 2026-08-22, Resume Upload + AI Parsing.
- Why: Matches the existing `/health` precedent and [[ARCHITECTURE]]'s stated security boundary ("client never talks to the AI service directly") — relies on network topology (ai-service not publicly exposed), not application-level auth.
- Risk: If the ai-service is ever reachable from outside the private network it's meant to run in, anyone could call `/parse-resume` directly, bypassing Express's auth/role/ownership checks (though the AI service itself has no database access, so the blast radius is limited to unauthenticated resume parsing, not data exposure).
- Fix: A shared-secret header (Express → ai-service) checked on every ai-service route before deployment ever exposes it beyond localhost.
- Priority: medium — must land before any real deployment (see [[DEPLOYMENT]]), same urgency class as the existing rate-limiting gap.

### `.doc` resumes are accepted but never parsed
- Introduced: 2026-08-22, Resume Upload + AI Parsing.
- Why: No good free Python library reads legacy binary `.doc` without external binaries (`antiword` etc.) — see [[DECISIONS]].
- Risk: A candidate uploading a `.doc` resume gets no structured data at all; the recruiter sees a parse-error warning and must open the file manually via the resume link.
- Fix: Either integrate `antiword`/`textract` (adds a real external-binary deployment dependency) or explicitly block `.doc` client-side with a clear message steering candidates to PDF/DOCX instead.
- Priority: low — PDF/DOCX cover the large majority of real resumes; revisit only if `.doc` uploads prove common in practice.

### Regex-based phone/experience-years/education extraction are heuristics
- Introduced: 2026-08-22, Resume Upload + AI Parsing (`ai-service/skills_extractor.py`).
- Why: Per [[DECISIONS]]'s rule-based-extraction choice — no trained model, no labeled data.
- Risk: Unusual resume formats (international phone formats, non-standard experience phrasing, education listed as a table rather than lines) can produce `null`/incomplete fields even when a human reader would find them easily. A phone-extraction bug (regex matching across a paragraph break) was already caught and fixed during initial verification — similar edge cases likely remain undiscovered.
- Fix: Expand test coverage with a variety of real-world resume samples once available; tighten regexes as gaps are found.
- Priority: low — acceptable for v1 per the documented rule-based-extraction tradeoff; recruiters can always fall back to the resume link.

### A failed resume parse doesn't block the application, and recruiters must notice the warning
- Introduced: 2026-08-22, Resume Upload + AI Parsing.
- Why: Deliberate — see [[DECISIONS]]'s "parsing failure never blocks the application" entry.
- Risk: If a recruiter skims `JobApplicants.jsx` quickly, a parse-error warning banner could be missed, effectively hiding an applicant's real qualifications behind a "resume couldn't be parsed" message with no further nudge to open the file.
- Fix: Consider a visually stronger treatment for parse-error cards (e.g. sorting them first, or a persistent badge) if this proves to be a real usability problem once recruiters actually use it.
- Priority: low — the current warning is visible, not hidden; escalate only if real usage shows it's being missed.

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
