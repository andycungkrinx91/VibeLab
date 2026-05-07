# VibeSec Lab by Andy

A cybersecurity command center playground for CVE intelligence, patch planning, incident response, security habits, and defensive AI workflows.

## Core story

Detect → Triage → Patch → Verify → Deploy

## Tech stack

- SvelteKit
- Svelte 5
- Tailwind CSS
- TypeScript
- Gemini API via server-side SvelteKit routes
- SvelteKit adapter-node
- Cloud Run-ready

## Mini-apps

- Threat Runner
- Analyst Portfolio Builder
- Risk Dashboard / Security Header Scanner
- CVSS Risk Calculator
- Patch Monitor Status
- SecureOps Habit Tracker
- Threat Briefing Player
- Incident Response Journey
- CVE Resource Library
- Patch Deadline Countdown

## AI features

Gemini is used server-side only for:

- mission briefing
- incident summary
- risk explanation
- header hardening suggestion
- patch plan
- stakeholder update
- security coaching
- threat briefing summary
- postmortem template
- CV/portfolio ATS generation
- remediation checklist

## Security rules

- `GEMINI_API_KEY` stays server-side only
- no client-side Gemini calls
- no `PUBLIC_` or `NEXT_PUBLIC_` Gemini key
- defensive security only
- AI output in Bahasa Indonesia
- no offensive exploit generation

## Local setup

```sh
npm install
cp .env.example .env
# fill GEMINI_API_KEY
npm run dev
```

## Production local

```sh
npm run check
npm run build
npm run start
```

If AI works in curl but not in the app, check `.env`, remove any stale `GOOGLE_API_KEY`, and restart the server.

Use the server-only health endpoint while debugging:

```sh
curl http://localhost:4173/api/ai/health
```

## Cloud Run deployment

### Build and deploy

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

If you prefer not to use Secret Manager, set `GEMINI_API_KEY` as a Cloud Run environment variable.

### Notes

- Cloud Run provides `PORT` automatically
- this app uses `@sveltejs/adapter-node`
- do not expose `GEMINI_API_KEY` to the client

## Demo script (3–5 minutes)

1. Start on the landing page.
2. Open the Command Center.
3. Show the 10 app categories.
4. Demo Threat Runner.
5. Demo Risk Dashboard header scanning.
6. Demo CVSS Risk Calculator.
7. Demo Patch Monitor Status.
8. Demo Incident Response Journey.
9. Show AI output in Bahasa Indonesia.
10. Show ThemeSwitcher.

## Known limitations

- Local persistence only
- No auth/database
- AI requires a valid server-side `GEMINI_API_KEY`
- Header scanner depends on target domain response and network behavior
- Audio requires browser user interaction
