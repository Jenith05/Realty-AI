# RealtyAI

RealtyAI is a real-estate lead workspace for capturing leads, understanding buyer intent, and keeping follow-ups moving. Lead records, analysis, chat history, and journey progress are stored in MongoDB and scoped to the signed-in account. Gemini generates lead analysis, call preparation, follow-up plans, and lead-aware chat responses.

## Features

- JWT-based registration and login with per-account lead ownership.
- Lead creation with Gemini-generated summary, intent, score, requirements, objections, and suggested response.
- Searchable and filterable lead list, with a dashboard derived from saved lead records.
- Lead-specific AI chat using the lead profile, saved analysis, follow-up plan, and recent conversation history.
- AI call preparation and follow-up plans with a saved next action, schedule, and channel.
- Editable follow-up stages, completion tracking, activity history, and stage-tagged progress notes.
- Demo account seed command for trying the app with synthetic, clearly marked contacts.

## Stack

- Frontend: React 18, Vite, React Router, Tailwind CSS, Lucide.
- Backend: Node.js, Express 4, Mongoose, JWT, bcryptjs.
- Database: MongoDB.
- AI: Google Gemini API via `@google/genai`.
- Hosting: Vercel (frontend and backend as separate projects from this repository).

## Repository Layout

```text
frontend/     React application
backend/      Express API and demo data seed command
```

## Requirements

- Node.js 20 or newer and npm.
- A MongoDB database/connection string.
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Local Setup

### 1. Configure and start the backend

```bash
cd backend
npm install
cp .env.example .env
```

Set the values in `backend/.env`:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_private_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
```

Start the API:

```bash
npm run dev
```

The API listens at `http://localhost:5001`. Check `http://localhost:5001/api/health` for its health response.

### 2. Start the frontend

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`. Vite proxies `/api` requests to the local backend; `VITE_API_URL` is included in `.env.example` for clarity and can be changed if the API runs elsewhere.

### 3. Use the demo account

The login page’s **Use test credentials** button fills these credentials:

| Email | Password |
|---|---|
| `demo@realtyai.test` | `RealtyAI-Demo-2026` |

To create the account and seed up to ten demo leads in the MongoDB database configured in `backend/.env`, run:

```bash
cd backend
npm run seed:demo
```

The seed is safe to rerun: it skips demo leads that already exist and refuses to reset an existing demo account if its password differs. It runs every new lead through the same Gemini analysis service used by the app. Demo names, phone values, and lead details are synthetic; do not contact them as real people.

## Environment Variables

### Backend

| Variable | Required | Description |
|---|---:|---|
| `MONGO_URI` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | Private secret used to sign access tokens. |
| `GEMINI_API_KEY` | Yes for AI | Google Gemini API key; keep it server-side. |
| `CLIENT_URL` | Recommended | Frontend origin allowed by CORS. Local default is `http://localhost:5173`; use `http://localhost:3000` with this repository’s Vite config. |
| `JWT_EXPIRES_IN` | No | Token lifetime; defaults to `7d`. |
| `PORT` | No | Local backend port; defaults to `5001`. Vercel manages the deployed listener. |

### Frontend

| Variable | Required | Description |
|---|---:|---|
| `VITE_API_URL` | No | API base URL. Local example: `http://localhost:5001/api`. On Vercel, set it to the deployed backend URL ending in `/api`. |

Never commit `.env` files or put `GEMINI_API_KEY`, `MONGO_URI`, or `JWT_SECRET` in a `VITE_` variable. Vite variables are exposed to the browser.

## API

Lead endpoints require `Authorization: Bearer <token>` unless marked public.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create an account. |
| `POST` | `/api/auth/login` | Public | Sign in and receive a JWT. |
| `GET` | `/api/auth/me` | Authenticated | Return the signed-in user. |
| `GET` | `/api/health` | Public | API health check. |
| `GET` | `/api/leads` | Authenticated | List the signed-in user’s leads. |
| `POST` | `/api/leads` | Authenticated | Analyze and save a lead with Gemini. |
| `GET` | `/api/leads/:id` | Authenticated | Get a lead owned by the signed-in user. |
| `POST` | `/api/leads/:id/chat` | Authenticated | Chat with Gemini using that lead’s context and history. |
| `POST` | `/api/leads/:id/call-prep` | Authenticated | Generate and save call preparation. |
| `POST` | `/api/leads/:id/follow-up/plan` | Authenticated | Generate and save an AI follow-up plan. |
| `PATCH` | `/api/leads/:id/follow-up` | Authenticated | Save stages, schedule, channel, and progress notes. |

## Deploy to Vercel

Deploy the frontend and API as two Vercel projects connected to the same GitHub repository. This keeps the frontend static and lets Vercel detect the Express backend independently.

### Backend project

1. Import the repository into Vercel and set **Root Directory** to `backend`.
2. Use the Express framework preset (Vercel supports Express projects directly).
3. Add these Project Environment Variables for Production (and Preview if needed): `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `GEMINI_API_KEY`, and `CLIENT_URL`.
4. Deploy, then verify `https://<backend-project>.vercel.app/api/health` returns `{"status":"ok",...}`.

### Frontend project

1. Import the same repository again and set **Root Directory** to `frontend`.
2. Use the Vite framework preset. Build command: `npm run build`; output directory: `dist`.
3. Set `VITE_API_URL` to `https://<backend-project>.vercel.app/api` for Production and Preview.
4. Deploy and copy the frontend’s production origin, such as `https://<frontend-project>.vercel.app`.
5. Set backend `CLIENT_URL` to that exact frontend origin and redeploy the backend.

Configure MongoDB network access for Vercel and use a database user limited to the application database. If your MongoDB provider requires an IP allowlist, use static egress where available; otherwise understand the provider’s recommended Vercel connectivity option before widening access. Keep all production secrets in Vercel Project Settings, never in this repository.

After deployment, verify the frontend login page, the backend `/api/health` route, account registration/login, lead creation with Gemini, and lead-specific chat. The demo seed command uses whichever MongoDB URI is in `backend/.env`; do not run it against a production database unless you want the synthetic demo account and leads there.

## GitHub

The project repository is [Jenith05/Realty-AI](https://github.com/Jenith05/Realty-AI). Push code changes to the production branch to trigger Vercel deployments after both Vercel projects are connected.
