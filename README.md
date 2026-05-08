# 🛡️ VibeSec Lab by Andy

![SvelteKit](https://img.shields.io/badge/SvelteKit-Ready-FF3E00?style=for-the-badge&logo=svelte&logoColor=white) ![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?style=for-the-badge&logo=svelte&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Ready-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![Magic UI Style](https://img.shields.io/badge/Magic_UI_Style-Motion_System-8B5CF6?style=for-the-badge) ![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![Cloud Run](https://img.shields.io/badge/Cloud_Run-Ready-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)

![Gemini](https://img.shields.io/badge/Gemini-Ready-8E75B2?style=for-the-badge) ![OpenAI](https://img.shields.io/badge/OpenAI-Ready-412991?style=for-the-badge&logo=openai&logoColor=white) ![Local LLM](https://img.shields.io/badge/Local_LLM-Ready-111827?style=for-the-badge) ![Security](https://img.shields.io/badge/Defensive_Security-Only-00C853?style=for-the-badge) ![Bahasa](https://img.shields.io/badge/AI_Output-Bahasa_Indonesia-red?style=for-the-badge)

## VibeSec Lab Command Center

> Premium defensive security playground for CVE intelligence, security headers, patch planning, incident response, and multi-provider AI workflows.

VibeSec Lab by Andy is a polished cybersecurity command center built for fast demos, clear PRD-driven workflows, and defensive AI tasks.
Disclaimer: VibeSec Lab is a simple mockup idea for event #JuaraVibeCoding 2026 by Google

---

## ✨ Overview

VibeSec Lab by Andy adalah premium cyber command center playground untuk CVE intelligence, security header hardening, patch planning, incident response, defensive AI workflows, security habits, dan security portfolio building.

Tech and experience focus:

- SvelteKit + Svelte 5
- Tailwind CSS
- Magic UI-style animation
- multi-provider AI
- Cloud Run-ready
- defensive security only

---

## 🎯 Core Story

```txt
Detect → Triage → Patch → Verify → Deploy
```

This project follows a mature vibe-coding flow:

- PRD-driven structure
- clean route map
- explicit AI contracts
- QA checklist first
- deployment path ready

---

## 🎨 Visual System

The UI uses a Cyber Terminal Command Center look with a custom Motion system inspired by Magic UI.

Highlights:

- Magic UI-style motion system
- Tailwind-powered animated components
- glassmorphism panels
- cyber bento grid
- animated electric glow border
- scanner / radar loading states
- shimmer buttons
- hover glow interactions
- reduced-motion support
- 10 visual themes

Note: this repo does **not** claim an official Magic UI package dependency; the motion layer is custom and Tailwind-driven.

---

## 🧩 10 Mini-Apps

| App | Pattern | Route | AI Feature |
| --- | --- | --- | --- |
| Threat Runner | Retro Arcade Games | `/apps/threat-runner` | `generate-threat-mission` / `summarize-incident` |
| Analyst Portfolio Builder | Personal Portfolios | `/apps/analyst-portfolio-builder` | `generate-security-bio` / `generate-ats-cv` |
| Risk Dashboard / Security Header Scanner | Interactive Dashboards | `/apps/risk-dashboard` | `analyze-risk-dashboard` |
| CVSS Risk Calculator | Smart Calculators | `/apps/cvss-calculator` | `explain-cvss-risk` |
| Patch Monitor Status | Productivity Utilities | `/apps/patch-monitor` | `generate-patch-plan` / `generate-stakeholder-update` |
| SecureOps Habit Tracker | Daily Habit Logs | `/apps/secureops-habit-tracker` | `generate-security-coaching` |
| Threat Briefing Player | Custom Media Players | `/apps/threat-briefing-player` | `summarize-threat-briefing` / `extract-briefing-actions` |
| Incident Response Journey | Interactive Storyboards | `/apps/incident-response-journey` | `explain-ir-step` / `generate-ir-quiz` / `generate-postmortem-template` |
| CVE Resource Library | Resource Libraries | `/apps/cve-resource-library` | `explain-security-resource` |
| Patch Deadline Countdown | Event Countdowners | `/apps/patch-deadline-countdown` | `generate-deadline-checklist` / `generate-stakeholder-message` |

---

## 🤖 Multi-Provider AI

AI is selected server-side through `AI_PROVIDER`.

Provider modes:

- `AI_PROVIDER=gemini` → official Gemini provider
- `AI_PROVIDER=openai` → official OpenAI provider
- `AI_PROVIDER=openai-compatible` → Cloudflare Workers AI / AI Gateway / Ollama / LM Studio / OpenRouter / custom baseURL providers
- `AI_DISABLE_THINKING=true|false` → toggle low-latency / no-thinking mode (default: `false`)
- `AI_MAX_OUTPUT_TOKENS=<number>` → cap AI output tokens to reduce cost (default: `700`)
- `OPENAI_COMPAT_MAX_OUTPUT_TOKENS=<number>` → higher cap for OpenAI-compatible reasoning models (default: `4096`)
- `AI_REQUEST_TIMEOUT_MS=<number>` → server timeout for AI requests (default: `25000`)
- `AI_PROMPT_MODE=standard|concise` → shorten server prompts and responses when set to `concise`

Debug tips if direct curl works but the app still shows errors:

- check `.env` / runtime server env names
- open `/api/ai/health`
- restart the server after changing keys
- verify `AI_PROVIDER` matches the active backend
- test `/api/ai/security` with the same action the app uses
- run `npm run check` and `npm run build` before redeploying

Optional local QA script:

- `npm run test:ai`

All AI calls go through internal SvelteKit API routes:

- `/api/ai/security`
- `/api/ai/health`

Rules:

- no client-side provider keys
- no raw provider errors in UI
- no secrets exposed in docs or responses
- AI output stays in Bahasa Indonesia

---

## 🔐 Security Principles

- Defensive security only
- Bahasa Indonesia AI output
- No exploit generation
- No malware guidance
- No credential theft guidance
- Server-side AI keys only
- Friendly error handling
- No raw provider errors in UI

---

## ⚙️ Environment Variables

```env
AI_PROVIDER=gemini
AI_DISABLE_THINKING=false
AI_MAX_OUTPUT_TOKENS=700
OPENAI_COMPAT_MAX_OUTPUT_TOKENS=4096
AI_REQUEST_TIMEOUT_MS=25000
AI_PROMPT_MODE=standard

GEMINI_API_KEY=
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_CHEAP_MODEL=gemini-2.5-flash-lite

OPENAI_API_KEY=
OPENAI_TEXT_MODEL=
OPENAI_CHEAP_MODEL=

OPENAI_COMPAT_API_KEY=
OPENAI_COMPAT_BASE_URL=
OPENAI_COMPAT_TEXT_MODEL=
OPENAI_COMPAT_CHEAP_MODEL=
OPENAI_COMPAT_PROVIDER_LABEL=
```

---

## 🚀 Quick Start

```sh
npm install
cp .env.example .env
npm run dev
```

Production local:

```sh
npm run check
npm run build
PORT=4173 npm run start
```

---

## ☁️ Deployment Notes

- `adapter-node` is enabled
- Cloud Run provides `PORT`
- keep provider keys server-side only
- use Secret Manager for deployment secrets
- switch `AI_PROVIDER` per backend

---

## ✅ QA Checklist

- `npm run check`
- `npm run build`
- `npm run start`
- `/api/ai/health`
- `/api/ai/security`
- `/api/security-headers`
- all routes load
- ThemeSwitcher persists
- favicon loads without 404
- Threat Runner mobile playable
- AI panels scroll on mobile
- ATS CV export works
- provider mode switch works
- no provider key appears in logs or UI

---

## ⚠️ Known Limitations

- Local persistence only
- Local LLM needs a reachable runtime endpoint
- Cloud Run cannot reach `localhost` LLM unless hosted separately
- AI quota / rate limits can affect responses
- Security header scanner depends on the target domain response
