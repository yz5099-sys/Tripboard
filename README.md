# Tripboard

## Original Idea

I wanted to create a shared travel board that turns destination ideas into an editable daily itinerary. The intended workflow was simple: choose a destination and dates, get AI place suggestions, drag places into a schedule, adjust their duration, and share the trip. I prioritized usable interactions over a complete travel platform, with English and Chinese support and no accounts, payments, database, or map.

The prototype uses Next.js, React, and Tailwind CSS for the frontend and FastAPI with the OpenAI Responses API for recommendations. It includes custom place cards, rating-sorted suggestions, a 06:00-24:00 schedule with 30-minute snapping, overlap checks, duration editing, and a muted gray, yellow, and pink visual style. Sharing generates an itinerary URL; synchronization currently uses browser-local storage and BroadcastChannel, so it does not provide shared trip data across different devices or users.

## Open or Run the Project

The previously deployed preview is [Tripboard on Vercel](https://tripboard-final.vercel.app/itinerary/trip-d5oiw6p). Its current availability and AI connectivity have not been reverified for this documentation update.

These instructions describe the Tripboard implementation at commit `4dbefa5` (`Fix Vercel Python runtime config`). The current local working directory contains subsequent, uncommitted portfolio changes. To reproduce Tripboard independently, use a separate checkout:

```bash
git clone https://github.com/yz5099-sys/Tripboard.git Tripboard-review
cd Tripboard-review
git checkout 4dbefa5
```

Prerequisites: Node.js with npm, Python 3.12, and an OpenAI API key with access to the configured model for live recommendations.

### Backend

From the checkout root, run the following in a macOS or Linux terminal:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` with your own credentials and an accessible model. The project was configured with the following example values:

```dotenv
OPENAI_API_KEY=your-openai-api-key
OPENAI_TRAVEL_MODEL=gpt-5.4-mini
CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

The backend reads environment variables; creating `.env` alone does not load them. In the same terminal, export the edited values and start the server:

```bash
set -a
source .env
set +a
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Frontend

In a second terminal, starting from the checkout root:

```bash
npm install
cp frontend/.env.example frontend/.env.local
npm run dev
```

Keep `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` in `frontend/.env.local`, then open [http://localhost:3000](http://localhost:3000). The backend health check is [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health). A successful health check only confirms the server is running; generate recommendations in the app to test the AI connection.

### Vercel

The Tripboard revision includes `vercel.json`, `api/index.py`, root-level Python dependencies, and `.python-version` for a same-project frontend/backend deployment. See [DEPLOY.md](./DEPLOY.md). Set backend credentials in Vercel environment variables, leave `NEXT_PUBLIC_API_BASE_URL` unset for same-origin `/api/*` requests, and redeploy after changing variables. Never commit real API keys or local environment files.

## AI Tools and Selected Prompts

I used **OpenAI Codex** as a coding assistant to implement and revise the interface, write backend integration code, prepare GitHub/Vercel configuration, and investigate errors. The application includes integration code for the **OpenAI Responses API** to generate bilingual place suggestions when configured and funded. These are separate roles: Codex helped build the software; the API is the intended source of live recommendations. Full AI functionality is not currently available within the project's token budget.

Selected prompts from the development conversation (follow-up requests are translated or condensed into English):

> Build a web-based collaborative travel planner with drag-and-drop time scheduling, AI place suggestions, basic real-time collaboration, and English/Chinese support. Prioritize interaction over visuals and completeness.

> Let users edit the visit duration after dragging a place into the schedule, and change the block's length to match that duration.

> Add a custom place-card module between the scheduler and AI recommendations. Only the place name is required; photos and descriptions are optional.

> Expand the schedule to 06:00-24:00, name the app Tripboard, and use a clean travel-inspired interface with muted gray, yellow, and pink colors.

> Make the page scroll while dragging cards from the bottom recommendations section, and adapt the layout to desktop and mobile screens.

## Iteration History

The versions below are retrospective development stages reconstructed from my conversations with Codex, rather than formal release tags. They record how the prototype changed in response to testing and feedback.

| Stage | Additions and changes | Removals or replacements |
| --- | --- | --- |
| Version 1: Core planning prototype | Established destination and date inputs, daily tabs, place suggestions, an 08:00-22:00 schedule, 30-minute snapping, activity movement and resizing, overlap checks, English/Chinese switching, and browser-local saving and synchronization. | Authentication, a database, maps, and payments were excluded from the initial scope, rather than removed from a completed version. |
| Version 2: Editable timing and AI integration | Added explicit duration controls inside scheduled activities, with block height following the selected duration. Added a FastAPI recommendation endpoint and OpenAI integration code, sorted suggestions by descending rating, and prepared a same-project Vercel deployment. | Local mock suggestions stopped being the only recommendation path, but remained available as a fallback. |
| Version 3: Place-specific images | Added image lookup based on returned place names and expanded lookup to English/Chinese Wikipedia and Wikimedia Commons after many Chinese attractions lacked images. Added fallback artwork for unavailable photos. | Moved away from relying only on a fixed image collection; accurate photos for every attraction remained unresolved. |
| Version 4: Custom place cards | Added a card editor between the scheduler and AI suggestions. Users could create, edit, delete, and schedule their own places, with a required name and optional photo and description. | Removed the workflow's dependence on AI suggestions as the only source of schedulable places. |
| Version 5: Tripboard identity and schedule visibility | Renamed the interface from TripSync to Tripboard, introduced muted gray, yellow, and pink colors, extended the day to 06:00-24:00, and corrected clipped time-axis labels. | Replaced the scheduler's fixed-height internal vertical scrolling area with page scrolling and replaced the earlier green/blue styling. |
| Version 6: Dragging and responsive layout | Added viewport-edge scrolling during place-card dragging, adjusted form and card-grid breakpoints, and adapted spacing for smaller screens. | Replaced layouts that introduced dense multi-column forms too early; the mobile schedule retained local horizontal scrolling to preserve control space. |
| Version 7: GitHub and Vercel preparation | Added repository and deployment documentation, environment templates, deployment exclusions, and a Python version file. Tested the deployed health and recommendation endpoints. | Removed tracked Python cache files and the invalid manual Python runtime setting. Production AI validation remained incomplete despite a working health endpoint. |

## Current MVP Limitations and Future Improvements

### Current Limitations

The MVP demonstrates the planning workflow, but full AI functionality is temporarily limited by token costs and insufficient available API credits/token budget. The AI API endpoint and integration code have been prepared for future use; this is not a claim that a complete, continuously available AI service is running. Local fallback suggestions and custom cards allow the planning interface to remain usable when live recommendations are unavailable. The budget constraint is separate from the model-configuration error observed during the earlier Vercel tests, which also requires a successful end-to-end retest.

- **Collaboration is simulated locally.** BroadcastChannel and localStorage synchronize compatible tabs in the same browser and origin. A shareable URL alone does not transfer an itinerary to another person's device.
- **Recommendations are not verified travel data.** AI-generated ratings are not sourced customer reviews. Place details, opening hours, and real-world feasibility need validation before travelers rely on them.
- **Image coverage is incomplete.** Some attractions, particularly less documented Chinese locations, still lack a matching photograph. Fallback artwork preserves the layout but cannot substitute for a verified place image.
- **Interaction testing is limited.** Responsive breakpoints and drag scrolling were added, but touch dragging, small-screen schedule editing, and behavior across browsers have not been comprehensively validated.
- **Production reliability needs more work.** A healthy backend does not prove that a recommendation request can complete. API configuration, request latency, failure feedback, and usage controls need further testing.

### Future Improvements

1. **Make live AI affordable and measurable.** Add explicit generation controls, cache recommendations by destination and preferences, limit response length and repeated requests, and track token usage against a budget. Compare model quality and cost before enabling broader use, then verify a complete production recommendation request.
2. **Provide genuine shared itineraries.** Introduce persistent trip storage and server-backed synchronization, with edit permissions and conflict handling so people on different devices can safely work on the same trip.
3. **Improve place-data quality.** Connect a reliable place-data source, distinguish sourced ratings from generated suggestions, show photo attribution, and support manual image replacement when lookup fails.
4. **Strengthen mobile and accessible interaction.** Test representative phone, tablet, and desktop sizes; improve touch and keyboard scheduling; and provide a clear alternative to dragging for selecting a day and time.
5. **Improve recovery and deployment feedback.** Show actionable AI error states, add bounded retries and timeouts, and test both backend health and recommendation generation after deployments.
6. **Evaluate richer planning after the core is reliable.** Explore travel-time estimates, opening-hour checks, and optional route or map views without making the basic itinerary workflow harder to use. These would be future additions beyond the original MVP scope.

## Reflection

The result matched my intention most closely when it made planning directly editable: I could choose a destination, browse suggestions, create my own place cards, and change an activity's duration so its height changed on the timeline. The English/Chinese switch and Tripboard's muted color palette also reflected the experience I wanted. Iteration revealed practical gaps: the original 08:00-22:00 schedule was too restrictive, the first time label was clipped, and dragging from recommendations at the bottom of the page did not scroll toward the scheduler. I asked for a 06:00-24:00 range, corrected label positioning, page scrolling, drag-edge scrolling, and more gradual responsive breakpoints. During development, Codex ran TypeScript and Python syntax checks and inspected the interface and console in the browser. These checks provided useful evidence, but they did not establish that dragging worked reliably on every phone or that every screen size had been tested. Image lookup was expanded to English/Chinese Wikipedia and Wikimedia Commons after Chinese attractions often lacked photos; fallback artwork kept cards visible but did not fulfill the intention of showing an accurate photograph of every place.

AI helped me turn product requirements into code and interpret specific deployment failures, but I still had to decide the priorities, identify confusing interactions, and understand what the tests actually proved. For example, removing an invalid Python runtime setting addressed one Vercel deployment error, while a later live test returned a healthy `/api/health` response but failed to generate recommendations because the deployed service sent `CORS_ORIGINS` as the model name. That distinction taught me that deploying a server and successfully connecting AI are separate milestones. The last recorded test still showed this error, so a successful production AI connection remains unconfirmed. Other unresolved issues include cross-device collaboration, mobile drag reliability, image coverage, and recommendation accuracy. Ratings are generated by the model rather than verified review data, and browser-local synchronization cannot deliver the original promise that anyone with a link can jointly edit the same stored trip. I see this as an interactive prototype with useful planning interactions, while deployment reliability and shared persistence still need further work.
