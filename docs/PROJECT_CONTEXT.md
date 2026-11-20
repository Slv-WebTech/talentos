# Project Context

## Project Name
TalentOS — AI-Powered Resume Screening & Applicant Tracking System

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
**In development.** The core slice — auth, job postings, resume upload + AI parsing, match scoring, the hiring pipeline with audit history, and recruiter search — is implemented, tested (54 automated tests) and documented. Interview scheduling, analytics, notifications and an admin console are planned. See [[IMPLEMENTED_FEATURES]], [[PROJECT_PLAN]] and [QA-REPORT](QA-REPORT.md).

## Technology Stack
| Layer | Choice |
|---|---|
| Frontend | React (Vite), HTML5/CSS3/JavaScript |
| Backend | Node.js, Express.js |
| Database | **PostgreSQL** (see [[DECISIONS]] for why over MongoDB) |
| Auth | JWT + bcrypt |
| AI Service | Python, FastAPI, spaCy + rules (extraction and a deterministic skill/experience score); sentence-transformers is a roadmap item — see [[DECISIONS]] for why not a trained classifier |
| File Storage | Cloudinary (private assets, signed URLs) |
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
Cloudinary (resume storage) and the internal AI service. Planned: a transactional e-mail provider for notifications.

## Current Limitations
Rule-based (not semantic) matching with a ~60-skill vocabulary plus resume-text matching; legacy `.doc` resumes are accepted but not parsed; no interview scheduling, analytics, notifications or admin UI; JWT is stored in `localStorage` with no refresh flow. Full list: [QA-REPORT](QA-REPORT.md).

## Important Terminology
- **ATS** — Applicant Tracking System
- **Ranking score** — similarity score between a parsed resume and a job description, produced by the AI service
- **Pipeline status** — an application's stage: Applied → Shortlisted → Interview Scheduled → Selected/Rejected
