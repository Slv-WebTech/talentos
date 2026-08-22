# Architecture

Status: **planned, not yet implemented.** This describes the target architecture the [[PROJECT_PLAN]] builds toward.

## Overview
Three independently deployable services:

```
┌─────────────┐      REST/JSON       ┌──────────────┐      REST/JSON      ┌────────────────┐
│  client/    │ ───────────────────► │  server/     │ ──────────────────► │  ai-service/    │
│  React+Vite │ ◄─────────────────── │  Node/Express│ ◄────────────────── │  Python/FastAPI │
└─────────────┘                      └──────┬───────┘                     └────────┬────────┘
                                             │                                      │
                                             ▼                                      ▼
                                      ┌─────────────┐                      ┌─────────────────┐
                                      │ PostgreSQL  │                      │ spaCy + sentence- │
                                      │             │                      │ transformers       │
                                      └─────────────┘                      └─────────────────┘
                                             │
                                             ▼
                                   ┌───────────────────┐
                                   │ Cloudinary or S3   │
                                   │ (resume files)     │
                                   └───────────────────┘
```

## Frontend Architecture
- React (Vite), organized as `client/components`, `client/dashboard`, `client/pages`, `client/services` (per the spec's folder layout).
- Role-aware routing: Admin, Recruiter, and Candidate get distinct dashboards (see [[SITE_MAP]]).
- `services/` holds API client wrappers — one place per backend resource (auth, jobs, applications, etc.), not scattered `fetch` calls.

## Backend Architecture
- Node.js + Express, organized as `server/controllers`, `server/routes`, `server/middleware`, `server/models`.
- REST API, JSON in/out. Routes are grouped by resource (`/api/auth`, `/api/jobs`, `/api/applications`, `/api/interviews`).
- Middleware handles JWT verification and role-based access control (Admin/Recruiter/Candidate).

## Database Architecture (PostgreSQL)
Core tables (finalized when the schema is actually built in the "Repo scaffold" + "Auth" steps of [[PROJECT_PLAN]]):
- `users` (id, role, email, password_hash, ...)
- `jobs` (id, recruiter_id, title, department, required_skills, experience, salary_range, location, status)
- `applications` (id, job_id, candidate_id, resume_url, parsed_data, ranking_score, pipeline_status)
- `interviews` (id, application_id, interviewer_id, scheduled_at, status)

Relational structure fits this domain well — applications reference both a job and a candidate, interviews reference an application — see [[DECISIONS]] for why Postgres over MongoDB.

## AI Service Architecture
- FastAPI app (`ai-service/main.py`) exposing endpoints the Node server calls internally (not exposed to the public client directly).
- `resume_parser.py` — extracts raw text from PDF/DOC/DOCX.
- `skills_extractor.py` — spaCy NER + keyword/skill-list matching to pull name, email, phone, skills, education, certifications from raw text.
- `ranking_model.py` — embeds the job description and the parsed resume text (sentence-transformers), scores by cosine similarity. No trained classifier — see [[DECISIONS]].

## Authentication & Authorization
- JWT issued on login, verified by Express middleware on protected routes.
- Passwords hashed with bcrypt, never stored/logged in plaintext.
- Role stored in the JWT payload; middleware checks role per route (e.g., only Recruiter/Admin can create jobs).

## Data Flow (resume screening path)
1. Candidate uploads resume via client → Express receives file → stores in Cloudinary/S3, gets a URL.
2. Express calls the AI service with the file (or extracted text) and the target job's description.
3. AI service returns structured candidate data + ranking score.
4. Express persists both to `applications` in Postgres.
5. Recruiter's dashboard queries applications for a job, sorted by ranking score.

## External Services
- Cloud file storage (Cloudinary or S3) — choice deferred, see [[DECISIONS]].
- Managed Postgres (e.g., via Render/Railway) in production.
- No third-party AI API dependency for v1 (embeddings run locally via sentence-transformers) — keeps the AI service self-contained and free to run.

## Folder Structure
Matches the spec exactly:
```
ats-system/
├── client/{components,dashboard,pages,services,App.js,index.js}
├── server/{controllers,routes,middleware,models,services,server.js}
├── ai-service/{resume_parser.py,ranking_model.py,skills_extractor.py,main.py}
└── docs/
```
`server/services/` (added 2026-08-22, see [[DECISIONS]]) holds outbound calls to external systems
(Cloudinary, the AI service) — distinct from `models/` (SQL) and `controllers/` (request handling).

## Deployment Architecture
See [[DEPLOYMENT]] for details. Client → Vercel; server + ai-service → Render or Railway; Postgres → managed instance (Render/Railway Postgres or equivalent).

## Security Boundaries
- Client never talks to the AI service directly — all AI calls are proxied through the authenticated Express server.
- File uploads validated by type/size server-side before reaching storage or the AI service.
- Candidate data (PII: name, email, phone) only readable by Recruiter/Admin roles tied to the relevant job.
