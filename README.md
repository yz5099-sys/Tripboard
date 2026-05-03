# Tripboard

Tripboard is a bilingual collaborative travel planner prototype. Users can configure a destination and dates, generate AI place suggestions, create custom place cards, then drag places into a visual itinerary schedule.

## Features

- Trip setup with country, region, city, date range, and travelers
- AI place suggestions from a FastAPI backend
- Place cards sorted by rating from high to low
- Custom place-card editor
- Drag cards into a 06:00-24:00 scheduler
- 30-minute snapping, move, resize, and duration editing
- Conflict prevention for overlapping activities
- English / Chinese UI toggle
- Shareable itinerary URLs with no login
- Basic real-time collaboration with `BroadcastChannel` and `localStorage`
- Responsive layout for desktop and mobile

## Project Structure

```text
.
├── api/                 # Vercel Python entrypoint
├── backend/             # FastAPI app and AI service
├── frontend/            # Next.js + React + Tailwind app
├── requirements.txt     # Python deps for Vercel
├── package.json         # Frontend workspace scripts
└── vercel.json          # One-project Vercel deployment config
```

The repository is organized for one Vercel project: Vercel builds the Next.js frontend from `frontend/` and serves the FastAPI backend through `api/index.py` under `/api/*`.

## Local Development

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Backend `.env`:

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_TRAVEL_MODEL=gpt-5.4-mini
CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

Frontend `.env.local` for local backend:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

For Vercel same-project deployment, leave `NEXT_PUBLIC_API_BASE_URL` empty or unset so the frontend calls `/api/travel/suggestions`.

## Checks

```bash
cd frontend
npm run build
```

```bash
cd backend
python -m compileall app
```

## GitHub Upload Notes

Do not upload `.env`, `.env.local`, `.venv`, `node_modules`, `.next`, `__pycache__`, or uploaded/generated files. The included `.gitignore` is set up for these.

For Vercel, the included `.vercelignore` also keeps local caches and development artifacts out of the deployment bundle.

See [DEPLOY.md](./DEPLOY.md) for Vercel deployment steps.
