Deployment options (free tiers)

Overview
- Frontend: static Vite build; deploy to Vercel or Netlify (free tiers).
- Backend: Node/Express; deploy as a Docker app to Fly.io (free), or as a service on Railway/Render (may have free plans). Vercel can host serverless functions but converting the whole Express app requires rework.
- Database: MongoDB Atlas free tier.

Recommended quick path (least code changes):
1. MongoDB Atlas
   - Create a free cluster and a DB user. Copy the connection string (`MONGODB_URI`).
2. Backend (Fly.io or Render)
   - Ensure `MONGODB_URI`, `JWT_SECRET`, and other secrets are set as environment variables in the host.
   - Using Fly.io (example):
     ```bash
     flyctl launch --name applica-backend --dockerfile backend/Dockerfile
     flyctl secrets set MONGODB_URI="<your uri>" JWT_SECRET="<secret>"
     flyctl deploy
     ```
   - Using Render: create a new web service, choose Docker, upload repo, set `start` command `npm start` and set env vars.

3. Frontend (Vercel)
   - Connect your GitHub repo to Vercel and set the project root to `frontend`.
   - Set build command: `npm ci && npm run build` and output directory: `dist`.
   - Add an environment variable `VITE_BACKEND_URL` with your backend URL (e.g., `https://applica-backend.fly.dev`).

Alternative: Single-host on Vercel (serverless)
- Convert the most-used Express API routes into Vercel Serverless Functions under `api/` and deploy both frontend and API together. This is more work but keeps everything on the Vercel free tier.

Testing locally
- Frontend (dev): `cd frontend && npm ci && npm run dev` (set `VITE_BACKEND_URL=http://localhost:8000`).
- Backend (dev): `cd backend && npm ci && npm run dev`.

Notes & caveats
- Free-tier limits: cold starts, request timeouts, limited CPU/memory. For heavy features (Puppeteer, long-running jobs), a free tier may not be sufficient.
- If you rely on WebSockets or socket.io, prefer Fly.io or Render (server-based) over serverless providers.

If you want, I can:
- Generate a small `fly.toml` and example `flyctl` commands and testable configs.
- Prepare a minimal Vercel serverless wrapper for 2-3 API routes (login, profile, recommendations) to deploy frontend+API to Vercel.
