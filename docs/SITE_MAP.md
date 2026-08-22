# Site Map

Planned application routes, derived from [[FEATURES]] and the three user roles in [[PROJECT_CONTEXT]]. Status noted per route below — see [[IMPLEMENTED_FEATURES]] for what's actually verified. Keep this synchronized with the actual client router.

```
Application
├── / (Landing) — implemented
├── /register — implemented
├── /login — implemented
├── /dashboard — implemented (role-specific quick actions; hiring dashboard below still planned)
├── Candidate
│   ├── /candidate/dashboard        — application status overview
│   ├── /candidate/jobs             — browse open jobs — implemented
│   ├── /candidate/jobs/:id         — job detail + apply (resume upload) — implemented
│   └── /candidate/applications     — track own application statuses — implemented
├── Recruiter
│   ├── /recruiter/dashboard        — hiring dashboard (active jobs, pipeline)
│   ├── /recruiter/jobs             — manage own postings + create form (combined) — implemented
│   ├── /recruiter/jobs/:id         — view applicants (unranked — AI ranking not built yet) — implemented
│   ├── /recruiter/jobs/:id/interviews — schedule/manage interviews for a job
│   └── /recruiter/analytics        — recruitment reports, export
└── Admin
    ├── /admin/dashboard            — platform-wide overview
    ├── /admin/users                — manage all users/roles
    └── /admin/jobs                 — view/moderate all job postings
```

| Route | Purpose | Access | API dependencies | Status |
|---|---|---|---|---|
| `/` | Landing page (currently: server health check + login/register links) | Public | `GET /api/health` | IMPLEMENTED (minimal — real landing content still PLANNED) |
| `/register` | Account creation, role selection (Recruiter/Candidate only) | Public | `POST /api/auth/register` | IMPLEMENTED |
| `/login` | Authentication | Public | `POST /api/auth/login` | IMPLEMENTED |
| `/dashboard` | Generic placeholder post-login screen | Any authenticated role | `GET /api/auth/me` (session read client-side, not actually called yet) | IMPLEMENTED (placeholder — role-specific dashboards below still PLANNED) |
| `/candidate/dashboard` | Candidate's application overview | Candidate | `GET /api/applications?candidate=me` | PLANNED |
| `/candidate/jobs` | Browse open jobs | Candidate (any authenticated role, in practice) | `GET /api/jobs` | IMPLEMENTED |
| `/candidate/jobs/:id` | Job detail + apply | Candidate | `GET /api/jobs/:id`, `POST /api/applications` | IMPLEMENTED |
| `/candidate/applications` | Track own applications | Candidate | `GET /api/applications?candidate=me` | IMPLEMENTED |
| `/recruiter/dashboard` | Hiring dashboard | Recruiter | `GET /api/dashboard/summary` | PLANNED |
| `/recruiter/jobs` | Manage own postings + create form (no separate `/new` route — combined into one page) | Recruiter | `POST /api/jobs`, `GET /api/jobs?recruiter=me`, `PUT /api/jobs/:id` (status toggle only, in the UI) | IMPLEMENTED |
| `/recruiter/jobs/:id` | View applicants (unranked — AI ranking not built yet) | Recruiter | `GET /api/applications?job=:id` | IMPLEMENTED |
| `/recruiter/jobs/:id/interviews` | Schedule/manage interviews | Recruiter | `POST /api/interviews`, `PUT /api/interviews/:id` | PLANNED |
| `/recruiter/analytics` | Reports, PDF/Excel export | Recruiter | `GET /api/analytics/*` | PLANNED |
| `/admin/dashboard` | Platform overview | Admin | `GET /api/admin/summary` | PLANNED |
| `/admin/users` | Manage users/roles | Admin | `GET/PUT /api/admin/users` | PLANNED |
| `/admin/jobs` | Moderate all postings | Admin | `GET /api/admin/jobs` | PLANNED |
