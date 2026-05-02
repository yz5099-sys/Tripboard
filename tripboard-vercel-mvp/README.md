# TripBoard — Vercel Deployable MVP

A first-version web app for collaborative travel planning.

## Features

- Trip configuration: destination, dates, travelers
- AI place suggestions via `/api/suggestions` mock backend
- Drag-and-drop place cards into a time-block schedule
- 30-minute time grid
- Move activities by dragging
- Change duration with dropdown
- Conflict prevention in state logic
- Local auto-save
- Share-link button
- English / Chinese language switch

## Tech Stack

- Next.js App Router
- React
- TailwindCSS
- dnd-kit
- Zustand
- Vercel Serverless API route

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Use default Next.js settings.
4. Deploy.

## Notes

This is an MVP prototype. It uses:
- mock AI suggestions
- localStorage auto-save
- simulated share/collaboration concept

For production, replace:
- `/api/suggestions` with a real AI/search API
- localStorage with Supabase / Firebase / Vercel Postgres
- simulated collaboration with WebSocket / Liveblocks / Yjs
