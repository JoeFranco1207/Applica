# Render Deployment Guide

## Why Render
- Free tier supports persistent web services with Docker.
- WebSockets work on Render web services.
- Puppeteer can run in a Docker-backed service with the right system dependencies.

## What was added
- `render.yaml` with two services:
  - `Applica Backend` as a Docker web service using `backend/Dockerfile`
  - `Applica Frontend` as a static site built from `frontend`
- `backend/Dockerfile` updated to use `node:22-bullseye-slim` and install Chromium dependencies.

## Steps to deploy
1. Sign up / sign in at https://render.com.
2. Connect your GitHub repository.
3. Add the repo to Render and let it detect `render.yaml`.
4. In the Render dashboard, configure required environment variables for the backend, for example:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - any other secrets used by your app
5. Deploy.

## Notes
- The backend is the only service requiring WebSockets and Puppeteer.
- The frontend can remain a Render static site.
- If Render does not automatically detect the service names, create them manually using the same settings from `render.yaml`.

## Alternative
If you need a single combined deployment, you can also host the backend as a Docker web service and keep the frontend build inside the backend service, but separate services are cleaner for this repo.
