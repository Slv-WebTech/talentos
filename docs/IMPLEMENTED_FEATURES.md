# Implemented Features

Only features that are verifiably working belong here: code exists, it's integrated, behaviour was exercised (automated tests and/or a live browser/API pass). Last verified in the QA pass documented in [QA-REPORT](QA-REPORT.md).

## User authentication — `IMPLEMENTED`
- Recruiter / candidate self-registration, login, `GET /api/auth/me`; admin accounts via `npm run create-admin` (no self-registration, see [[DECISIONS]]).
- bcrypt, JWT, per-request account re-check, email normalised (trim + lowercase), input type/length validation.
- Verified: server unit tests, live Chrome login for recruiter/candidate/admin, deleted-user and role-change behaviour.
- Not included: refresh tokens, password reset, e-mail verification, admin UI.

## Job postings — `IMPLEMENTED`
- Create / edit / close; validated fields (lengths, ranges, trimming, cross-field salary rule); pagination; closed jobs hidden from non-owners.
- Editing skills or experience re-scores that job's applicants in the background.
- Not included: job search, in-UI full edit form (status toggle only).

## Resume upload — `IMPLEMENTED` (storage path needs credentials to verify end-to-end)
- PDF / DOCX (+ DOC accepted, unparsed), 5 MB, signature check, private Cloudinary storage, 5-minute signed links, orphan cleanup, 409 on duplicate apply, 503 when storage is unavailable.
- Verified: stubbed route tests and live failure path. **Not verified:** a real Cloudinary upload (no credentials in the dev environment).

## AI parsing — `IMPLEMENTED`
- name, email, phone, skills (≈60-term vocabulary + contextual rules), experience years (ignores "N years ago/old", capped at 50), education; full text returned separately and stored for scoring.
- Not included: certifications / projects, `.doc` parsing, scanned PDFs (no OCR).

## Match scoring & ranking — `IMPLEMENTED`
- 0–100 score from skill overlap (vocabulary or whole-word text match) and experience fit; matched / missing skills stored; applicants listed best match first.
- Rule-based by design; embedding similarity is future work.

## Hiring pipeline — `IMPLEMENTED`
- Enforced transitions, audit history (who / when), confirmation for Selected / Rejected, success feedback, history view; invalid moves return 409.
- Not included: interview scheduling, notifications.

## Recruiter workspace — `IMPLEMENTED`
- Ranked applicant list with search (name / e-mail, wildcard-safe), status filter, sort, "Load more", re-score button, popup-safe resume opening.

## Client UI — `IMPLEMENTED`
- Design tokens + component library, dark theme, responsive down to 375 px, AA contrast, focus rings, skip link, `aria-controls` on the mobile menu, loading / empty / error states.
- Not verified: light theme, screen readers, browsers other than Chrome.

## Platform — `IMPLEMENTED`
- Helmet, CORS, rate limiting, request size limit, JSON 404/400/413 handling, health endpoints, GitHub Actions CI, Docker Compose for Postgres.
