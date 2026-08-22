# Project Context

## Project Name
AI-Powered Resume Screening & Applicant Tracking System (ATS)

## Project Purpose
A recruitment platform that lets companies manage job postings, screen resumes, rank candidates, schedule interviews, and hire — with AI handling resume parsing, skill extraction, and candidate ranking against job descriptions.

## Problem Being Solved
Manual resume screening is slow and inconsistent. Recruiters need a way to post jobs, collect applications, automatically extract structured candidate data from unstructured resumes (PDF/DOC/DOCX), and rank candidates against a job's requirements — without hand-reading every resume.

## Target Users
- **Admin** — manages the platform, users, and overall access
- **Recruiter** — creates job postings, reviews ranked candidates, schedules interviews, updates hiring status
- **Candidate** — registers, uploads a resume, applies to jobs, tracks application status

## Primary Use Cases
1. Recruiter posts a job (title, department, required skills, experience, salary range, location)
2. Candidate registers, uploads a resume, applies to a job
3. AI service parses the resume into structured data and scores it against the job description
4. Recruiter views ranked candidates, shortlists, schedules interviews, updates status through the pipeline (Applied → Shortlisted → Interview Scheduled → Selected/Rejected)
5. Admin/Recruiter views hiring analytics (active jobs, pipeline health, time-to-hire, etc.)

## Product Vision
A three-service system that mirrors how enterprise hiring platforms work at a smaller, portfolio-appropriate scale: a React client, a Node/Express API, and a Python AI service for resume parsing and ranking — each independently deployable.

## Current Project Status
**Pre-implementation.** No code exists yet. This documentation baseline (see [[PROJECT_PLAN]]) is the first artifact of the project. All features in [[FEATURES]] are `PLANNED`.

## Technology Stack
| Layer | Choice |
|---|---|
| Frontend | React (Vite), HTML5/CSS3/JavaScript |
| Backend | Node.js, Express.js |
| Database | **PostgreSQL** (see [[DECISIONS]] for why over MongoDB) |
| Auth | JWT + bcrypt |
| AI Service | Python, FastAPI, spaCy (extraction), sentence-transformers (ranking via embedding similarity) — see [[DECISIONS]] for why not a trained classifier |
| File Storage | Cloudinary or S3 (final choice deferred — see [[PROJECT_PLAN]]) |
| Deployment | Vercel (client), Render/Railway (server + AI service), managed Postgres |

## Major Architectural Decisions
See [[DECISIONS]] for the full log. Summary: PostgreSQL for relational hiring-pipeline data; rule-based + embedding-similarity AI (no training data available, so no trained classifier); MVP-first feature sequencing (see [[PROJECT_PLAN]]).

## Important Constraints
- No labeled resume dataset exists, which rules out a trained ML ranking model for v1.
- Single-developer project — sequencing favors a working end-to-end slice over building every layer in parallel.

## Assumptions
- Candidates upload resumes in PDF/DOC/DOCX only.
- Initial deployment targets are as listed above; final provider choice (Cloudinary vs S3, Render vs Railway) is deferred until the relevant feature is actually built.

## Dependencies / Integrations
None yet — no external services are wired up. Planned: a cloud file-storage provider, and eventually a transactional email provider for notifications.

## Current Limitations
Nothing is implemented. There is no running application yet.

## Important Terminology
- **ATS** — Applicant Tracking System
- **Ranking score** — similarity score between a parsed resume and a job description, produced by the AI service
- **Pipeline status** — an application's stage: Applied → Shortlisted → Interview Scheduled → Selected/Rejected
