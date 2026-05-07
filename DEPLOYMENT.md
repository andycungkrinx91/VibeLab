# VibeSec Lab Deployment Guide

## Local production

```sh
npm install
npm run check
npm run build
npm run start
```

If needed, set a port explicitly:

```sh
PORT=4173 npm run start
```

## Docker

```sh
docker build -t vibesec-lab .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key vibesec-lab
```

The container uses `node build` and respects `PORT` from the environment.

## Cloud Run

Recommended flow:

```sh
gcloud builds submit --tag gcr.io/PROJECT_ID/vibesec-lab
gcloud run deploy vibesec-lab \
  --image gcr.io/PROJECT_ID/vibesec-lab \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_TEXT_MODEL=gemini-2.5-flash,GEMINI_CHEAP_MODEL=gemini-2.5-flash-lite \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

If Secret Manager is not used, set `GEMINI_API_KEY` as a Cloud Run environment variable instead.

## Troubleshooting

### API key expired or invalid
- Renew `GEMINI_API_KEY`
- Restart the server

### AI button fails
- Check server logs
- Verify `GEMINI_API_KEY`
- Confirm `/api/ai/security` is reachable

### Port issue
- Use `PORT` from the environment
- Cloud Run provides `PORT` automatically

### Header scanner fails
- Some domains block `HEAD`/`GET`
- The app returns a friendly fallback message

### Build fails
- Run `npm install`
- Run `npm run check`
