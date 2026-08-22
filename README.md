# TalentOS

AI-powered resume screening & applicant tracking system — a recruitment platform for posting jobs, collecting applications, and using AI to parse resumes and rank candidates against job requirements.

**Status:** in development. Auth, Job Posting, and Resume Upload + AI Parsing are implemented; the client has a full design system and premium UI. AI candidate ranking is next. See [`docs/DEV_CONTEXT.md`](./docs/DEV_CONTEXT.md) for the live "what's happening right now" view.

## Documentation
Full project documentation lives in [`/docs`](./docs/README.md), starting with:
- [`docs/PROJECT_CONTEXT.md`](./docs/PROJECT_CONTEXT.md) — what this is and who it's for
- [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md) — roadmap
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — technical design
- [`docs/DEV_CONTEXT.md`](./docs/DEV_CONTEXT.md) — current state, read this first when resuming work

## Tech Stack
React (Vite) · Node.js/Express · PostgreSQL · JWT auth · Python/FastAPI (AI service: spaCy + pdfplumber/python-docx, sentence-transformers coming with AI ranking) · Cloudinary (resume storage)

## Getting Started
Three independently-run services. Each needs its own terminal.

```bash
# client (React/Vite) — http://localhost:5173 (auto-increments if taken)
cd client
npm install
npm run dev

# server (Node/Express) — http://localhost:5000 by default
cd server
npm install
npm run migrate   # applies server/db/migrations/*.sql
npm run dev

# ai-service (Python/FastAPI) — http://localhost:8000
cd ai-service
python -m venv venv
venv/Scripts/pip install -r requirements.txt   # venv/bin/pip on macOS/Linux
venv/Scripts/python -m uvicorn main:app --reload --port 8000
```

`server/.env` needs `DATABASE_URL`, `JWT_SECRET`, and (for resume uploads) `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` — see `server/.env.example`. It's gitignored and not included in this repo. Requires a local PostgreSQL instance.
