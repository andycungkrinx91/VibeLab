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

Provider modes:

- `AI_PROVIDER=gemini` for Gemini
- `AI_PROVIDER=openai` for official OpenAI
- `AI_PROVIDER=openai-compatible` for Cloudflare / local / custom OpenAI-compatible backends

## Docker

```sh
docker build -t vibesec-lab .
docker run -p 8080:8080 -e AI_PROVIDER=gemini -e GEMINI_API_KEY=your_key vibesec-lab
```

The container uses `node build` and respects `PORT` from the environment.
Swap `AI_PROVIDER` and the matching key for `openai` or `openai-compatible` if needed.

## Cloud Run

Recommended flow:

```sh
gcloud builds submit --tag gcr.io/PROJECT_ID/vibesec-lab
gcloud run deploy vibesec-lab \
  --image gcr.io/PROJECT_ID/vibesec-lab \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars AI_PROVIDER=openai,OPENAI_TEXT_MODEL=gpt-5.5,OPENAI_CHEAP_MODEL=gpt-5.5-mini \
  --set-secrets OPENAI_API_KEY=OPENAI_API_KEY:latest
```

If Secret Manager is not used, set the provider key as a Cloud Run environment variable instead.

## Troubleshooting

### API key expired or invalid
- Renew the active provider key (`GEMINI_API_KEY`, `OPENAI_API_KEY`, or `OPENAI_COMPAT_API_KEY`)
- Restart the server

### AI button fails
- Check server logs
- Verify the active provider key
- Confirm `/api/ai/security` is reachable

### Invalid provider mode
- Set `AI_PROVIDER` to `gemini`, `openai`, or `openai-compatible`
- Restart the server

### Port issue
- Use `PORT` from the environment
- Cloud Run provides `PORT` automatically

### Header scanner fails
- Some domains block `HEAD`/`GET`
- The app returns a friendly fallback message

### Build fails
- Run `npm install`
- Run `npm run check`
