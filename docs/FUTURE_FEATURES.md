# Future Features

Bonus/enhancement ideas from the original spec. None of these are scheduled — see [[PROJECT_PLAN]] for what's actually being built next. Do not implement anything here unless explicitly instructed.

## High Priority
_(candidates for promotion to [[PROJECT_PLAN]]'s "Later" section once the core loop works)_

- **Real-time notifications** — in-app/email alerts for status changes; extends the core Notifications feature in [[FEATURES]].
  - Complexity: medium (needs a delivery mechanism — websockets or polling, plus an email provider).
  - Dependencies: Notifications core feature.
- **Offer Letter Generator** — auto-generate an offer letter document when a candidate is marked Selected.
  - Complexity: low-medium (templating + PDF generation).
  - Dependencies: Hiring pipeline status tracking.

## Medium Priority
- **Dark Mode** — theme toggle across the client.
  - Complexity: low, mostly CSS token work once [[PROJECT_STYLE]]'s UI tokens exist.
- **Diversity Hiring Dashboard** — additional analytics view.
  - Complexity: medium; depends on what demographic data (if any) the app decides to collect — a product decision, not just an engineering one.
- **Recruiter–Candidate Chat** — in-app messaging.
  - Complexity: medium-high (needs real-time transport, message persistence).
- **Multi-language Support** — i18n for the client.
  - Complexity: medium, mostly mechanical once strings are centralized.

## Low Priority
- **Progressive Web App (PWA)** — offline/installable client.
  - Complexity: low-medium once the client exists (service worker + manifest).

## Experimental
_(ideas that need validation before committing engineering time)_

- **AI Interview Question Generator** — generate role-specific interview questions.
  - Risk: quality depends heavily on prompt/model choice; needs evaluation before trusting output shown to recruiters.
- **AI Mock Interview Evaluation** — score a candidate's mock interview answers.
  - Risk: significant scope — likely needs speech-to-text or structured answer input, plus a scoring rubric.
- **Video Interview Integration** — embed video calls in-app.
  - Risk: probably means integrating a third-party video SDK rather than building WebRTC from scratch; cost/complexity should be evaluated before committing.
- **Recruitment Forecasting** — predictive analytics on hiring trends.
  - Risk: needs meaningful historical data to be useful; premature before the core analytics feature has real usage.
- **Candidate-job matching recommendations** — proactively suggest jobs to candidates.
  - Risk: overlaps with the core AI Ranking feature; may just be "ranking run in reverse" once that exists.
- **Skill gap analysis** — show a candidate what skills they're missing for a role.
  - Risk: same dependency as above — needs the core ranking/parsing pipeline first.
- **Resume improvement suggestions** — feedback to candidates on their resume.
  - Risk: needs a quality rubric, not just parsing.
- **AI-based job description generation** — help recruiters draft postings.
  - Risk: straightforward LLM-prompt feature, but out of scope until core job management exists.
- **Voice-based interview scheduling** — schedule interviews via voice input.
  - Risk: niche UX value relative to complexity; low confidence this gets prioritized.
- **Audit logs for hiring activities** — track who changed what.
  - Risk: worth doing once real hiring-decision data exists and matters (compliance-adjacent); premature now.
- **Microservices architecture** — split server further.
  - Risk: the current three-service split (client/server/ai-service) already separates concerns; further splitting is unlikely to pay off before there's real scale to justify it.
- **CI/CD pipeline (GitHub Actions)** — automate test/build/deploy.
  - Note: this one is worth pulling forward once there's a repo and a test suite to run — reclassify to Medium/High once [[TESTING]] has real tests.
