# QA Report — TalentOS (ats-system)

Scope: live end-to-end pass in Chrome (server + client + ai-service on the dev Postgres), ~95 automated API security/contract checks, business-logic review, performance spot checks, plus unit/integration tests. This file was updated after a second pass that worked through every open item. Nothing is committed.

**Test status:** server unit 24/24, server real-Postgres integration 3/3, ai-service 15/15, client 12/12, client build OK.

## Status of every finding

### Fixed in pass 1
| # | Sev | Issue | Change |
|---|---|---|---|
| 1 | High | Non-numeric/huge ids returned 500 | `utils/ids.js` `parseId`; 400 everywhere |
| 2 | High | Job fields unvalidated (length, overflow, types, blank title) → 500/junk | Validation + trimming in `jobController` |
| 3 | High | `?offset=1e20` → 500 | offset capped at 1,000,000 |
| 4 | Med | Partial `PUT` could break `salaryMin ≤ salaryMax` | Cross-check against stored job |
| 5 | Med | Unknown `/api/*` returned HTML 404 | JSON 404 handler |
| 6 | High | Dark-theme primary button/skip link contrast 2.1–3.2:1 | `--text-on-brand`; skip link uses token |
| 7 | Med | Tertiary text < AA on dark | token lightened |
| 8 | High | Unstyled status select / buttons | styled; uses `Button` |
| 9 | Med | Parser false positives (go, excel, "25 years ago") | contextual matching, caps |
| 10 | Med | Single-criterion ranking capped/inflated | weights re-normalised |
| 11 | Med | Generic 500 on upload failure | 503 with clear message |
| 12 | Low | Name extraction spanned lines | first line only |

### Fixed in pass 2 (previously open)
| Sev | Item | Status | Change / verification |
|---|---|---|---|
| High | Ranking only saw a ~60-skill vocabulary (Figma/SAP never matched) | **Fixed** | ai-service returns the resume text; server stores it in `applications.resume_text` (never selected by list queries); `/rank` matches required skills against the vocabulary **or** whole-word in the text (handles `Node.js`/`NodeJS`; `sap` ≠ `sapphire`). Live: an applicant with no extracted skills but "Python, React, Docker" in the text went from unscored to 93%. Tests in pytest + stubbed server + real-DB. |
| High | Real-Postgres tests | **Fixed** | `server/test/integration/db.test.js` (`npm run test:integration`) runs migrations into a throw-away schema and tests uniqueness (23505), hidden columns, filters, LIKE-wildcard escaping, ordering, paging, atomic status history, ranking inputs. Added to CI with a Postgres service. |
| High | Stale tokens (deleted/demoted users kept access ≤7 days) | **Fixed** (revocation) | `verifyToken` re-reads the account on every request: deleted user → 401 immediately; the **DB role** replaces the token's role claim. Token lifetime is now `JWT_EXPIRES_IN` (default 7d). Live-verified (role flip and user deletion). |
| Med | Login limiter counted successful logins; NAT lock-out | **Fixed** | `loginLimiter` uses `skipSuccessfulRequests`; separate hourly `registerLimiter`; `TRUST_PROXY` documented in README/.env.example. Live: 25 successful logins in a row all 200. |
| Med | No transition rules/history/feedback/confirmation | **Fixed** | Transition table (`rejected→selected` and `selected→rejected` need a step in between; no-op = 200 without history); migration 005 `application_status_history` (who/when), written in one transaction; `GET /api/applications/:id/history`; UI offers only valid next states, confirms Selected/Rejected, shows an aria-live success message, and has a History toggle. *Assumption:* the transition table is my product call — edit `TRANSITIONS` in `applicationController.js` (mirrored in the client service) if the business wants different rules. |
| Med | Re-ranking was manual and sequential | **Fixed** | `services/rankingService.js` re-scores with a 5-worker pool; editing a job's skills/experience triggers a background re-rank; "Re-score all" remains. Live: edit changed 17/22 scores within 2.5 s. A dedicated batch AI endpoint was not added (not needed at this scale). |
| Med | No applicant search/filter/sort; `jobs` index | **Fixed** | `?q=` (name/email, wildcard-safe), `?status=`, `?sort=score|newest`, validated server-side; UI filter bar (debounced search, status, sort) with filtered empty state; deterministic `id` tiebreaker; migration 005 adds `jobs(status, created_at DESC)`. Live-verified incl. `%` as a literal. |
| Low | Tap targets < 24px | **Fixed** | min-height on back/resume/auth links; audit shows none left on login, dashboard, applicants, jobs at 1280 and 375 px. |
| Low | Menu button lacked `aria-controls` | **Fixed** | `aria-controls="mobile-nav"` + id on the nav. |
| Low | Dashboard said AI screening is "coming soon" | **Fixed** | Badge now "Live" with accurate copy. |
| Low | No CI | **Fixed** | `.github/workflows/ci.yml` (server unit + migrate + integration against Postgres 16, client test + build, ai-service pytest). Not executed here (needs GitHub). |
| Low | No client tests | **Fixed** | Vitest + Testing Library: 12 tests (service helpers/query building; applicants page: statuses, confirm, feedback, server errors, filters, popup-blocked fallback, load-more dedupe). |
| Low | No admin provisioning | **Fixed** | `npm run create-admin` (`ADMIN_EMAIL`, `ADMIN_PASSWORD` ≥12 chars, `ADMIN_NAME`); validated live (login works, role admin). There is still no admin UI. |
| Low | "View resume" opened a blank tab first | **Fixed** | Fetches the signed URL first, then opens it; if the browser blocks the popup an inline "Open the resume" link appears. |

### Remaining — and why
| Sev | Item | Why it is not fixed |
|---|---|---|
| High | Real Cloudinary upload → parse → rank → signed URL test, orphan cleanup, duplicate-apply 409 end to end | **Needs Cloudinary credentials** (not in `.env`). Covered by stubbed tests and a live 503 check only. |
| High | Refresh tokens / short-lived access tokens | **Product/architecture decision** (session length, refresh UX, storage). Mitigated: DB re-check gives immediate revocation, and `JWT_EXPIRES_IN` can shorten the lifetime. |
| Med | JWT in `localStorage` | Moving to httpOnly cookies + CSRF is a cross-cutting redesign; accepted risk logged in `TECHNICAL_DEBT.md` (no third-party scripts, React escapes output). |
| Med | Account enumeration via register 409 | Product trade-off (clear sign-up errors vs privacy); mitigated by the hourly register limiter. Not changed. |
| Med | Signed resume URLs bound to the requester | Cloudinary signed URLs can't be bound to a user; 5-minute expiry is the control. |
| Med | Keyset pagination | Changes the API contract and client; offset paging now has a stable tiebreaker and a 1,000,000 cap. Revisit if lists grow large. |
| Low | Experience extraction (max "N years" mention is ambiguous) | Regex heuristic; a real fix needs section-aware parsing/ML. |
| Low | Closing a job does not touch existing applications | Product decision. |
| Low | Login error alert shifts the card (layout shift) | Cosmetic design choice (alert sits above the fields); not changed. |
| Low | No admin UI/features | Product decision; provisioning exists. |
| — | Light theme, real mobile devices, Safari/Firefox, screen-reader pass, load test at 10k+ rows | **Cannot be done from this environment** (dark-theme Chrome only; dev DB has a few rows). |

## Original findings (reference)

### UI
Verified in Chrome: login, recruiter job posting, applicants, candidate job page, admin dashboard, route guards. No horizontal overflow at 1280/768/375; one-column grid and hamburger on mobile; all inputs labelled; skip link; visible focus on all interactive elements; `lang`, one `h1`, landmarks, no duplicate ids. After pass 2: zero contrast failures and zero sub-24px targets on the audited pages.

### API security
92/94 automated checks passed in pass 1 (the two "failures" were script artifacts); the re-run after pass 2 differs only where behaviour intentionally changed (status transitions). 401 on all protected routes; `alg=none`/tampered/expired tokens rejected; BOLA/IDOR blocked for a second recruiter and for other candidates; mass assignment ignored; SQL/NoSQL payloads rejected or stored literally; helmet headers, CORS locked, 100 kB body limit; no `password_hash`/`resume_url`/`resume_public_id` in responses.

### Business logic
See the tables above. Ranking = 70% skills (vocabulary **or** resume text) + 30% experience, re-normalised over the criteria a job sets.

### Performance (local, 22 applications)
p50/p95: list jobs 2/3 ms, applicants (20) 2/4 ms, job detail 2/2 ms, candidate applications 2/2 ms (warm); 50 concurrent job lists 0.2 s; re-score 22 applications 0.22 s (worker pool); filtered applicant search ≈7 ms. Client bundle 217 kB JS (69 kB gzip) + 37 kB CSS, single chunk. No N+1 queries. Not load-tested at scale.

### UX
Skeleton loaders, empty states (now including a filtered empty state), clear validation/error copy, client-side resume checks, mobile nav; status changes now confirm, explain and are auditable.

## Tests
- `server/test/api.test.js` — 24 tests (auth, authorization matrix, DB-role re-check, transitions, history, filters, ranking input, auto re-rank, validation, ids, pagination, limiter, headers, uploads).
- `server/test/integration/db.test.js` — 3 real-Postgres tests (opt-in via `DATABASE_URL`; uses and drops its own schema).
- `ai-service/tests/test_api.py` — 15 tests.
- `client/src/**/*.test.*` — 12 tests.
