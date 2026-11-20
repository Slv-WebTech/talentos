# Project Plan

Roadmap for TalentOS. Updated whenever a phase completes — see [[DEV_CONTEXT]] for the live "what's happening right now" view.

## Completed
- **Documentation baseline, repo scaffold** (2026-08-14).
- **Auth** (2026-08-14) — recruiter / candidate register + login, JWT, bcrypt; admin intentionally not self-registerable ([[DECISIONS]]).
- **Job postings** (2026-08-14) — create / edit / close, listings.
- **Client design system & redesign** (2026-08-22) — tokens, component library, dark theme, responsive shell.
- **Resume upload + AI parsing** (2026-08-22) — Cloudinary storage, spaCy + rules extraction.
- **Review, hardening and QA passes** (2026-11) — see [QA-REPORT](QA-REPORT.md):
  - Security: helmet, rate limits, request limits, JWT secret check, upload signature checks, shared secret to the AI service, per-request account re-check, strict id / field / pagination validation, private resumes with signed URLs.
  - Features: match scoring and ranked applicants, automatic and manual re-score, pipeline transitions with audit history, applicant search / filter / sort, pagination, admin provisioning script.
  - Quality: 54 automated tests (server, real-Postgres integration, ai-service, client), CI workflow, accessibility fixes (contrast, tap targets, ARIA), accurate dashboard copy.
- **Repo presentation** — branding assets, README, GitHub templates, rulesets.

## In Progress
_None._

## Next
1. **Cloudinary-backed end-to-end verification** — run the real upload → parse → rank → signed-URL path once credentials exist; add it as an opt-in integration test.
2. **Interview scheduling** — date, interviewer, status; hooks into the pipeline's `interview_scheduled` state.
3. **Notifications** — status change, interview scheduled (needs an e-mail provider decision).

## Later
- Hiring analytics dashboard + PDF / Excel export
- Embedding-based semantic matching (sentence-transformers) alongside the rule-based score
- Admin console (users, moderation)
- Refresh tokens or httpOnly-cookie sessions; browser E2E tests (Playwright)
- Keyset pagination, applicant bulk actions
- Bonus features — see [[FUTURE_FEATURES]]

## Blocked
- Real Cloudinary verification: needs credentials.

## Notes
- Sequencing favours a working vertical slice over building every layer in parallel (single-developer project).
- Remaining QA items and their reasons are tracked in [QA-REPORT](QA-REPORT.md) and [[TECHNICAL_DEBT]].
