# Deployment

Status: **planned, not yet executed** — nothing is deployed because nothing is built ([[IMPLEMENTED_FEATURES]]).

## Target Platforms (from the original spec)
| Service | Platform |
|---|---|
| `client/` (React/Vite) | Vercel |
| `server/` (Node/Express) | Render or Railway (final choice open, see [[DECISIONS]]) |
| `ai-service/` (FastAPI) | Render or Railway (same provider as server, likely, to simplify networking) |
| PostgreSQL | Managed Postgres (Render/Railway Postgres, or a dedicated provider) |

## Steps (to be filled in once the repo scaffold and first deploy happen)
1. Provision managed Postgres, run initial schema migration.
2. Deploy `server/` with `DATABASE_URL`, `JWT_SECRET`, and file-storage credentials as env vars.
3. Deploy `ai-service/` with any model-download step baked into the build (spaCy/sentence-transformers models).
4. Deploy `client/` to Vercel with the server's public URL as an env var.
5. Verify the full flow (register → post job → apply → rank) against the deployed stack.

## Environment Variables (anticipated, finalized when scaffold is built)
- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — token signing secret
- `CLOUDINARY_*` or `AWS_S3_*` — file storage credentials (see open decision in [[DECISIONS]])
- `CLIENT_URL` — for CORS config on the server
- `AI_SERVICE_URL` — for the server to reach the AI service internally

## Notes
- `.env` must never be committed — see [[TECHNICAL_DEBT]] if this is ever violated and needs remediation.
- CI/CD (GitHub Actions) is tracked as a bonus feature in [[FUTURE_FEATURES]], not part of the initial deploy.
