# Free Deployment Guide

This setup deploys the full app with free tiers:

- Frontend (Next.js): Vercel
- Auth + LMS API (Node.js + static dashboard): Render
- DocNotes AI API (FastAPI): Render
- MySQL-compatible database: TiDB Cloud Serverless

## Quick Start (Easy)

If you want the simplest path, do these 8 steps in order:

1. Push this project to GitHub.
2. Create a free TiDB Cloud Serverless database.
3. Run SQL files in this order:
  1. `auth-system/database/schema.sql`
  2. `auth-system/database/migrate_subjects.sql`
  3. `auth-system/database/migrate_tests.sql`
  4. `auth-system/database/migrate_final.sql`
4. Deploy Python API on Render from folder `backend`.
5. Deploy Node API on Render from folder `auth-system/backend`.
6. Deploy Next.js app on Vercel from folder `frontend`.
7. Set environment variables:
  1. Vercel: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_AUTH_BACKEND_URL`
  2. Render Python: `GROQ_API_KEY`, `ALLOWED_ORIGINS`
  3. Render Node: DB vars, `JWT_SECRET`, `DOCAI_BASE_URL`, `DOCAI_FRONTEND_URL`
8. Redeploy once after adding final URLs, then test login, DocNotes redirect, and file upload.

If you get stuck, follow the detailed sections below exactly.

## 1. Create Free MySQL-Compatible Database (TiDB Cloud)

1. Create a free TiDB Cloud Serverless cluster.
2. Copy host, port, username, password, and database name.
3. Import SQL files in this order:
   1. `auth-system/database/schema.sql`
   2. `auth-system/database/migrate_subjects.sql`
   3. `auth-system/database/migrate_tests.sql`
   4. `auth-system/database/migrate_final.sql`

Example import command (from project root):

```bash
mysql --ssl-mode=REQUIRED -h <TIDB_HOST> -P <TIDB_PORT> -u <TIDB_USER> -p < auth-system/database/schema.sql
mysql --ssl-mode=REQUIRED -h <TIDB_HOST> -P <TIDB_PORT> -u <TIDB_USER> -p < auth-system/database/migrate_subjects.sql
mysql --ssl-mode=REQUIRED -h <TIDB_HOST> -P <TIDB_PORT> -u <TIDB_USER> -p < auth-system/database/migrate_tests.sql
mysql --ssl-mode=REQUIRED -h <TIDB_HOST> -P <TIDB_PORT> -u <TIDB_USER> -p < auth-system/database/migrate_final.sql
```

## 2. Deploy FastAPI (DocNotes AI) on Render

Service settings:

- Runtime: Python
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

Environment variables:

- `GROQ_API_KEY` = your Groq key
- `GROQ_BASE_URL` = `https://api.groq.com/openai/v1`
- `GROQ_MODEL` = `llama-3.3-70b-versatile`
- `ALLOWED_ORIGINS` = `<RENDER_NODE_URL>,<VERCEL_FRONTEND_URL>`

After deploy, copy the Render URL (example: `https://docnotes-api.onrender.com`).

## 3. Deploy Node Backend on Render

Service settings:

- Runtime: Node
- Root directory: `auth-system/backend`
- Build command: `npm install`
- Start command: `npm start`

Environment variables:

- `PORT` = `10000` (or keep blank; Render provides PORT)
- `JWT_SECRET` = long random string
- `JWT_EXPIRES_IN` = `24h`
- `DB_HOST` = TiDB host
- `DB_PORT` = TiDB port
- `DB_USER` = TiDB user
- `DB_PASSWORD` = TiDB password
- `DB_NAME` = `vidnotes_auth`
- `DB_SSL` = `true`
- `DB_SSL_REJECT_UNAUTHORIZED` = `false`
- `DOCAI_BASE_URL` = your FastAPI Render URL
- `DOCAI_FRONTEND_URL` = your Vercel frontend URL
- `GROQ_API_KEY` = your Groq key
- `GROQ_BASE_URL` = `https://api.groq.com/openai/v1`
- `GROQ_MODEL` = `llama-3.3-70b-versatile`

After deploy, copy the Node URL (example: `https://studyplanner-auth.onrender.com`).

## 4. Deploy Next.js Frontend on Vercel

Project settings:

- Framework preset: Next.js
- Root directory: `frontend`

Environment variables:

- `NEXT_PUBLIC_BACKEND_URL` = FastAPI Render URL
- `NEXT_PUBLIC_AUTH_BACKEND_URL` = Node Render URL

Deploy and copy the Vercel URL (example: `https://studyplanner-docnotes.vercel.app`).

## 5. Final URL Wiring (Important)

Update these values after all three apps are live:

- FastAPI `ALLOWED_ORIGINS` should include:
  - Node Render URL
  - Vercel Frontend URL
- Node `DOCAI_FRONTEND_URL` should be your Vercel URL
- Node `DOCAI_BASE_URL` should be your FastAPI URL
- Vercel env vars should point to live Render URLs

Redeploy services after env updates.

## 6. Smoke Test Checklist

1. Open Node URL and log in (`/login`).
2. Student dashboard -> click "DocNotes AI" and verify redirect opens Vercel app.
3. Upload a file in Vercel app and verify notes/flashcards/quiz are generated.
4. In Vercel app -> Study Materials -> login as student and open a material.
5. Confirm Document AI results page loads without 4xx/5xx errors.

## Optional: Deploy Only DocNotes (No Auth System)

If you only need upload + AI notes and chat:

- Deploy `backend` (FastAPI) on Render
- Deploy `frontend` (Next.js) on Vercel
- Set only:
  - `NEXT_PUBLIC_BACKEND_URL`
  - `ALLOWED_ORIGINS`

This skips MySQL and the auth-system service entirely.
