# Ripple v2 — Build & Deploy

This repository contains the Ripple v2 web app (client + server). Below are quick instructions for running locally and building a production Docker image.

## Environment
Copy `.env.example` to `.env` and fill in real values (especially Stripe secret key and price IDs):

```
cp .env.example .env
# then edit .env
```

Key env vars:
- `STRIPE_SECRET_KEY` — your Stripe secret key
- `STRIPE_PRICE_*` — price IDs for plans (see `.env.example`)
- `PORT` — server port (default 3000)

## Local (development)

Install dependencies and run dev server:

```powershell
npm install
npm run dev
```

## Build (production)

```powershell
npm install --legacy-peer-deps
npm run build
npm start
```

## Docker

Build and run Docker image:

```powershell
docker build -t ripple-v2 .
docker run -p 3000:3000 --env-file .env ripple-v2
```

The Docker image uses a multi-stage build to produce `dist/` and runs `node dist/index.js` in production.
