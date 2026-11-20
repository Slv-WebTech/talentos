# Deployment

Status: **not deployed yet.** The application is runnable locally and in CI; this file is the checklist for the first deployment.

## Target Platforms
| Service | Platform |
|---|---|
| `client/` (React/Vite static build) | Vercel (or any static host) |
| `server/` (Node/Express) | Render or Railway (open decision, see [[DECISIONS]]) |
| `ai-service/` (FastAPI) | Same provider as the server, **private networking only** |
| PostgreSQL | Managed Postgres (14+) |
| Resume files | Cloudinary (private `authenticated` assets) |

## Steps
1. Provision Postgres; set `DATABASE_URL`; run `npm run migrate` (applies 001–005).
2. Deploy `ai-service/` (build step installs `requirements.txt`, including the spaCy model wheel). Set `AI_SERVICE_SECRET`. Do **not** expose it publicly.
3. Deploy `server/` with the variables below; start with `npm start`.
4. Create the first admin: `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run create-admin`.
5. Build the client (`npm run build`) with `VITE_SERVER_URL` pointing at the API and deploy `dist/`.
6. Smoke test: register → post job → apply with a real resume → check score and signed resume link → move through the pipeline.

## Environment variables (server)
| Variable | Notes |
|---|---|
| `DATABASE_URL` | required |
| `JWT_SECRET` | required, ≥ 32 random characters (startup fails otherwise) |
| `CLIENT_URL` | required, exact client origin for CORS |
| `AI_SERVICE_URL` / `AI_SERVICE_SECRET` | internal URL and shared secret (same secret in the AI service env) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | required for uploads |
| `TRUST_PROXY` | set to the number of proxy hops (usually `1`) so rate limits use real client IPs |
| `JWT_EXPIRES_IN`, `AUTH_RATE_LIMIT`, `REGISTER_RATE_LIMIT`, `API_RATE_LIMIT`, `PORT` | optional tuning |

## Hardening checklist
- [ ] HTTPS everywhere (helmet already sends HSTS); API and client on trusted origins.
- [ ] `JWT_SECRET`, `AI_SERVICE_SECRET`, Cloudinary and database credentials stored in the platform's secret manager — never in the repo.
- [ ] AI service reachable only from the API.
- [ ] Rate limiter is in-memory (per instance): use a shared store (e.g. Redis) before scaling horizontally.
- [ ] Database backups and a migration rollback plan.
- [ ] Decide on refresh tokens / httpOnly cookie sessions before opening registration publicly ([QA-REPORT](QA-REPORT.md)).

## Notes
- `.env` must never be committed — only `server/.env.example` (placeholders) is tracked.
- CI (`.github/workflows/ci.yml`) runs server, integration, client and ai-service tests on every PR; continuous deployment is not set up.
