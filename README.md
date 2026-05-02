# Tripboard

Tripboard is a bilingual collaborative travel planner prototype.

## Features

- Trip setup with country, region, city, dates, and travelers
- AI-generated place suggestions through a FastAPI backend
- Place cards sorted by rating from high to low
- Drag places into a 06:00-24:00 time scheduler
- 30-minute snapping
- Move and resize scheduled activities
- Edit play time directly inside scheduled activity cards
- English / Chinese UI toggle
- Shareable itinerary URLs
- Basic real-time collaboration with `BroadcastChannel` and `localStorage`

## Stack

- Frontend: Next.js 14, React, TailwindCSS
- Backend: FastAPI
- AI: OpenAI Responses API
- Deployment: one Vercel project for both frontend and backend

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

For local frontend-to-backend calls, set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Environment Variables

Backend:

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_TRAVEL_MODEL=gpt-5.4-mini
CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

Vercel same-project deployment:

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_TRAVEL_MODEL=gpt-5.4-mini
CORS_ORIGINS=https://your-vercel-domain.vercel.app
```

Leave `NEXT_PUBLIC_API_BASE_URL` empty on Vercel when deploying frontend and backend together.

## Deployment

See [DEPLOY.md](/Users/zhuyifei/Documents/New%20project/DEPLOY.md).
