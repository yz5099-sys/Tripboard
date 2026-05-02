# Tripboard Vercel Deployment Guide

This project is configured so the frontend and backend can deploy together on one Vercel project.

## Structure

- Frontend: `frontend/` with Next.js
- Backend: `api/index.py` importing the FastAPI app from `backend/app/main.py`
- Shared API path in production: `/api/*`

## Vercel Configuration

The root `vercel.json` is set up for:

- installing dependencies from the monorepo root
- building the Next app in the `frontend` workspace
- serving the built app from `frontend/.next`
- routing `/api/:path*` to the Python FastAPI function

The frontend should not need `NEXT_PUBLIC_API_BASE_URL` on Vercel when both sides are deployed in the same project. It will call `/api/travel/suggestions`, and Vercel will route that to the backend function.

## Required Environment Variables

Set these in Vercel Project Settings:

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_TRAVEL_MODEL=gpt-5.4-mini
CORS_ORIGINS=https://your-vercel-domain.vercel.app
```

Optional:

```bash
OPENAI_REPORT_MODEL=gpt-5.4-mini
NEXT_PUBLIC_API_BASE_URL=
```

Leave `NEXT_PUBLIC_API_BASE_URL` empty for same-project Vercel deployment. Only set it if the backend is deployed separately.

## Deploy Steps

1. Push the repository to GitHub.
2. In Vercel, create a new project from the repository.
3. Keep the root directory as the repository root.
4. Ensure Vercel uses the included `vercel.json`.
5. Add the environment variables above.
6. Deploy.

## Production Smoke Test

After deployment:

1. Open the Vercel URL.
2. Confirm the planner loads and redirects to `/itinerary/<trip-id>`.
3. Change destination or click `Refresh AI`.
4. Confirm AI suggestions appear sorted by rating from highest to lowest.
5. Drag a place into the schedule.
6. Edit the duration inside the scheduled activity and confirm the block height changes.
7. Open the same share URL in another tab and confirm edits sync.

## Local Development

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
```

If the current shell has no global `npm`, use the bundled Node runtime:

```bash
cd frontend
/Users/zhuyifei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next dev -p 3000
```

For local development with the backend on `127.0.0.1:8000`, set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```
