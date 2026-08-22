# Features

Full feature inventory transcribed from the original project spec. All statuses are `PLANNED` — see [[IMPLEMENTED_FEATURES]] for what's actually built (currently nothing). Status values: `PLANNED`, `IN_PROGRESS`, `IMPLEMENTED`, `TESTING`, `PARTIALLY_IMPLEMENTED`, `BLOCKED`, `DEPRECATED`.

---

### User Authentication
- **Purpose:** Support Admin, Recruiter, and Candidate roles with secure login.
- **User value:** Each role gets access scoped to what they need; candidates' and recruiters' data stays separated.
- **Dependencies:** none (foundational).
- **Status:** `PARTIALLY_IMPLEMENTED` — Recruiter/Candidate register+login fully working; Admin has no account-creation path yet (deliberate, see [[DECISIONS]]). See [[IMPLEMENTED_FEATURES]] for detail.
- **Related APIs:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`

### Job Management
- **Purpose:** Recruiters create, edit, close job postings and view applicants.
- **User value:** Central place to manage open roles and their requirements (title, department, required skills, experience, salary range, location).
- **Dependencies:** User Authentication (done).
- **Status:** `PARTIALLY_IMPLEMENTED` — create/edit/close and listing (open jobs + recruiter's own) all working; "view applicants" waits on Resume Upload/Applications. See [[IMPLEMENTED_FEATURES]].

### Resume Upload
- **Purpose:** Candidates upload PDF/DOC/DOCX resumes, stored securely in cloud storage.
- **User value:** Low-friction application process.
- **Dependencies:** User Authentication, Job Management.
- **Status:** `PLANNED`

### AI Resume Parsing
- **Purpose:** Automatically extract name, email, phone, skills, experience, education, certifications, projects from uploaded resumes.
- **User value:** Recruiters get structured candidate data without manual reading.
- **Dependencies:** Resume Upload, AI service ([[ARCHITECTURE]]).
- **Status:** `PLANNED`

### AI Candidate Ranking
- **Purpose:** Rank candidates by skill match, experience, education, certifications; show a ranking percentage.
- **User value:** Recruiters see the strongest candidates first instead of reading every application.
- **Dependencies:** AI Resume Parsing.
- **Status:** `PLANNED`

### Interview Scheduling
- **Purpose:** Recruiters select interview date/interviewer, send invitations, update status (Applied, Shortlisted, Interview Scheduled, Selected, Rejected).
- **User value:** Replaces ad-hoc email/calendar coordination with an in-app workflow.
- **Dependencies:** AI Candidate Ranking (or at least Job Management + applications).
- **Status:** `PLANNED`

### Hiring Dashboard
- **Purpose:** Show active jobs, total candidates, shortlisted candidates, interview success rate, time-to-hire, hiring pipeline.
- **User value:** At-a-glance view of recruiting health.
- **Dependencies:** Job Management, Interview Scheduling.
- **Status:** `PLANNED`

### Analytics
- **Purpose:** Reports on hiring trends, candidate sources, skill demand, recruitment performance, offer acceptance rate; PDF/Excel export.
- **User value:** Data-driven view of the recruiting funnel over time.
- **Dependencies:** Hiring Dashboard's underlying data.
- **Status:** `PLANNED`

### Notifications
- **Purpose:** Notify users on shortlisting, interview scheduling, status changes, offer letters, job closures.
- **User value:** Keeps candidates and recruiters informed without manual follow-up.
- **Dependencies:** Interview Scheduling, Hiring Dashboard (the events that trigger notifications).
- **Status:** `PLANNED`

---

Bonus/enhancement features are tracked separately in [[FUTURE_FEATURES]] since they're explicitly out of scope until the core list above is implemented.
