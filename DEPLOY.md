# Tripboard Vercel Deployment Guide

Tripboard can deploy the frontend and backend together in one Vercel project.

## How It Works

- Next.js frontend lives in `frontend/`.
- FastAPI backend lives in `backend/`.
- Vercel Python entrypoint is `api/index.py`.
- `vercel.json` rewrites `/api/:path*` to the FastAPI app.
- In production, the frontend calls `/api/travel/suggestions`.

## Vercel Settings

Use the repository root as the Vercel project root.

The included `vercel.json` handles:

- `npm install`
- `npm run build`
- output directory: `frontend/.next`
- Python function runtime for `api/index.py`
- API rewrites

The included `.vercelignore` keeps local build output, virtual environments, API keys, caches, uploaded files, and unrelated project artifacts out of the Vercel deployment bundle.

## Environment Variables

Set these in Vercel Project Settings:

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_TRAVEL_MODEL=gpt-5.4-mini
CORS_ORIGINS=https://your-vercel-domain.vercel.app
```

Optional:

```bash
NEXT_PUBLIC_API_BASE_URL=
```

Leave `NEXT_PUBLIC_API_BASE_URL` empty for same-project Vercel deployment.

Do not add `backend/.env` or `frontend/.env.local` to GitHub. Use Vercel Environment Variables instead.

## Deploy Steps

1. Create a GitHub repository.
2. Push this project to GitHub.
3. In Vercel, choose `Add New...` -> `Project`.
4. Import the GitHub repository.
5. Keep root directory as the repository root.
6. Add the environment variables above.
7. Deploy.

## Production Smoke Test

After deployment:

1. Open the Vercel URL.
2. Confirm the app loads as Tripboard.
3. Enter country, region, city, and dates.
4. Click `Refresh AI` or change the destination to trigger suggestions.
5. Confirm place cards have images and are sorted by rating.
6. Drag a place into the scheduler.
7. Resize or edit the scheduled play time.
8. Open the same itinerary URL in another tab and confirm edits sync.
