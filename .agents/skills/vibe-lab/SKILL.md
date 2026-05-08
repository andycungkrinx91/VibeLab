# VibeSec Lab — Agent Skill

> Master reference for working on the VibeSec Lab codebase.
> Read this before making any change. Follow every rule precisely.

---

## 1. Project Identity

- **Name:** VibeSec Lab by Andy
- **Purpose:** Premium defensive cybersecurity command center playground
- **Event:** Mockup idea for #JuaraVibeCoding 2026 by Google
- **Language:** Bahasa Indonesia for all AI-generated output; code comments and variable names are English
- **Security posture:** Defensive-only. No offensive exploits, malware, payload, evasion, credential theft, or bypass instructions — ever.

---

## 2. Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | SvelteKit | v2.57+ with `@sveltejs/adapter-node` |
| UI Library | Svelte 5 | Runes mode forced (`$state`, `$derived`, `$props`, `$effect`) |
| Styling | Tailwind CSS v4 | `@tailwindcss/vite` plugin, `@import 'tailwindcss'` in `layout.css` |
| AI (Gemini) | `@google/genai` | v1.52+ |
| AI (OpenAI) | `openai` | v6.37+ |
| Build | Vite 8 | `vite.config.ts` |
| TypeScript | 6.x | strict mode via `tsconfig.json` |
| Linting | ESLint + Prettier | with `prettier-plugin-svelte`, `prettier-plugin-tailwindcss` |
| Node | 22 | used in Dockerfile |
| Production | `adapter-node` | `node build` → serves on `PORT` |
| Container | Docker | multi-stage: `node:22-slim` |
| Cloud | Google Cloud Run | `PORT` provided by runtime |

### Key Config Files

```
svelte.config.js    → adapter-node, runes mode
vite.config.ts      → tailwindcss() + sveltekit() plugins
tsconfig.json       → TypeScript strict settings
package.json        → scripts: dev, build, check, start, test:ai, lint, format
Dockerfile          → multi-stage node:22-slim build
.env.example        → all env var templates
```

---

## 3. Project Structure

```
src/
├── app.html                              # HTML shell with inline theme loader
├── app.d.ts                              # SvelteKit type declarations
├── lib/
│   ├── index.ts                          # barrel export (minimal)
│   ├── metadata.ts                       # AppMeta[] for all 10 apps, getAppBySlug(), APP_PATTERN_SHOWCASE
│   ├── theme.svelte.ts                   # ThemeStore class (Svelte 5 runes), 10 ThemeOption[]
│   ├── assets/
│   │   └── favicon.svg
│   ├── audio/
│   │   └── game-audio.ts                 # Web Audio API synth: playShoot, playHit, playCollect, etc.
│   ├── components/
│   │   ├── AppHeader.svelte              # App-level header (back button, category tags, meta badges)
│   │   ├── AppPageShell.svelte           # Wraps app pages: header + prev/next navigation
│   │   ├── AppTutorial.svelte            # Tutorial section at bottom of each app
│   │   ├── BentoAppCard.svelte           # Bento grid card for app listing
│   │   ├── MotionShell.svelte            # fade-in-up entrance animation wrapper
│   │   ├── PageBoot.svelte               # Cinematic boot sequence (session-once)
│   │   ├── RouteTransition.svelte        # Route-level transition
│   │   └── ThemeSwitcher.svelte          # Dropdown for 10 themes (ONE instance in +layout.svelte)
│   ├── data/
│   │   └── apps.ts                       # additional app data (if any)
│   ├── server/
│   │   ├── gemini.ts                     # Main AI provider router: askSecurityAI(), getAIHealth()
│   │   └── ai/
│   │       └── openai-provider.ts        # Official OpenAI Responses API wrapper
│   └── utils/
│       └── ai-client.ts                  # (optional frontend AI utility)
├── routes/
│   ├── +layout.svelte                    # Global layout: header, ThemeSwitcher, background effects
│   ├── +page.svelte                      # Home page (/) with hero, workflow pipeline, app preview grid
│   ├── layout.css                        # MASTER CSS: Tailwind config, 10 theme palettes, animations, mobile helpers
│   ├── api/
│   │   ├── ai/
│   │   │   ├── health/+server.ts         # GET /api/ai/health → provider config status
│   │   │   └── security/+server.ts       # POST /api/ai/security → AI router (all 10 apps)
│   │   └── security-headers/+server.ts   # POST /api/security-headers → browser header scanner
│   └── apps/
│       ├── +page.svelte                  # /apps listing page (search, pattern showcase, full grid)
│       ├── threat-runner/+page.svelte
│       ├── risk-dashboard/+page.svelte
│       ├── cvss-calculator/+page.svelte
│       ├── patch-monitor/+page.svelte
│       ├── patch-deadline-countdown/+page.svelte
│       ├── incident-response-journey/+page.svelte
│       ├── analyst-portfolio-builder/+page.svelte
│       ├── secureops-habit-tracker/+page.svelte
│       ├── threat-briefing-player/+page.svelte
│       └── cve-resource-library/+page.svelte
```

---

## 4. Routes

| Path | Description |
|---|---|
| `/` | Home page — hero, workflow pipeline, app preview grid, system widgets |
| `/apps` | Command Center — search, pattern showcase, full 10-app bento grid |
| `/apps/threat-runner` | Retro arcade game — mobile touch controls, Web Audio, AI mission/incident |
| `/apps/risk-dashboard` | Security header scanner + AI hardening advisor |
| `/apps/cvss-calculator` | CVSS risk scoring + AI mitigation advisor |
| `/apps/patch-monitor` | Patch lifecycle tracker + AI patch planning |
| `/apps/patch-deadline-countdown` | SLA countdown + AI escalation messages |
| `/apps/incident-response-journey` | Interactive IR timeline + AI step explanation/quiz/postmortem |
| `/apps/analyst-portfolio-builder` | Security profile builder + AI bio/project/review/ATS CV |
| `/apps/secureops-habit-tracker` | Daily security checklist + AI coaching |
| `/apps/threat-briefing-player` | Threat briefing player + AI summarization/action extraction |
| `/apps/cve-resource-library` | Searchable CVE knowledge base + AI resource explanation |
| `/api/ai/health` | GET → provider configuration status (no secrets) |
| `/api/ai/security` | POST → AI router for all 10 apps (server-side only) |
| `/api/security-headers` | POST → browser security header scanner |

---

## 5. The 10 Mini-Apps

Each app follows this pattern:
1. **AppPageShell** or manual AppHeader + MotionShell wrapper
2. **Local state** using Svelte 5 `$state` / `$derived`
3. **AI call** → `POST /api/ai/security` with `{ app, action, input }`
4. **AppTutorial** section at the bottom

### App Registry (from `metadata.ts`)

| App ID | Category | Familiar Category | Workflow | AI Action |
|---|---|---|---|---|
| `threat-runner` | Training | Retro Arcade Games | Detect | Mission Generation |
| `risk-dashboard` | Monitoring | Interactive Dashboards | Triage | Risk Analysis |
| `cvss-calculator` | Triage | Smart Calculators | Triage | Score Explanation |
| `patch-monitor` | Remediation | Productivity Utilities | Patch | Patch Planning |
| `patch-deadline-countdown` | Remediation | Event Countdowners | Patch | Escalation Gen |
| `incident-response-journey` | Response | Interactive Storyboards | Verify / Deploy | Step Explanation |
| `cve-resource-library` | Knowledge | Resource Libraries | Education | Resource Explanation |
| `threat-briefing-player` | Intelligence | Custom Media Players | Detect / Education | Action Extraction |
| `secureops-habit-tracker` | Training | Daily Habit Logs | Monitoring | Security Coaching |
| `analyst-portfolio-builder` | Career | Personal Portfolios | Portfolio | Bio Generation |

---

## 6. AI Provider System

### Architecture

```
Svelte UI → POST /api/ai/security → +server.ts → askSecurityAI() → provider router
                                                  ├── gemini → GoogleGenAI SDK + REST fallback
                                                  ├── openai → OpenAI Responses API
                                                  └── openai-compatible → raw fetch (chat/completions)
```

### Provider Selection (`AI_PROVIDER` env var)

| Value | Provider | Key Env | Base URL Env |
|---|---|---|---|
| `gemini` | Google Gemini | `GEMINI_API_KEY` | (hardcoded Google endpoint) |
| `openai` | Official OpenAI | `OPENAI_API_KEY` | (hardcoded OpenAI endpoint) |
| `openai-compatible` | Any OpenAI-compatible | `OPENAI_COMPAT_API_KEY` | `OPENAI_COMPAT_BASE_URL` |

### AI Response Contract

All AI responses are normalized to this shape:

```typescript
interface SecurityAIResponse {
  ok: boolean;
  provider: 'gemini' | 'openai' | 'openai-compatible' | 'invalid';
  providerLabel: string;
  model: string;
  app: string;
  action: string;
  result: any;           // action-specific structured data
  summary: string;       // 1-2 sentence summary in Bahasa Indonesia
  recommendations: string[];
  warnings?: string[];
  error?: string;
}
```

### Allowed Actions (from `/api/ai/security/+server.ts`)

```typescript
const ALLOWED_ACTIONS: Record<string, string[]> = {
  'threat-runner': ['generate-threat-mission', 'summarize-incident'],
  'risk-dashboard': ['analyze-risk-dashboard'],
  'cvss-calculator': ['explain-cvss-risk'],
  'patch-monitor': ['generate-patch-plan', 'generate-stakeholder-update'],
  'incident-response-journey': ['explain-ir-step', 'generate-ir-quiz', 'generate-postmortem-template'],
  'analyst-portfolio-builder': ['generate-security-bio', 'improve-security-projects', 'review-analyst-profile', 'generate-ats-cv'],
  'secureops-habit-tracker': ['generate-security-coaching'],
  'threat-briefing-player': ['summarize-threat-briefing', 'extract-briefing-actions'],
  'cve-resource-library': ['explain-security-resource'],
  'patch-deadline-countdown': ['generate-deadline-checklist', 'generate-stakeholder-message']
};
```

### System Instruction

All AI prompts include this system instruction:

> Jawab selalu dalam Bahasa Indonesia yang jelas, ringkas, dan praktis. Fokus pada defensive security: mitigasi, patching, hardening, monitoring, incident response, edukasi, stakeholder communication, dan pengembangan portfolio/CV defensif. Jangan memberikan instruksi eksploitasi ofensif, malware, payload, bypass, evasion, persistence, credential theft, atau penyalahgunaan sistem.

### Error Handling Rules

- **Never** expose raw provider errors in the UI
- All catch blocks return user-friendly Indonesian error strings
- Use `friendlyProviderError()` in `gemini.ts` for provider-specific messages
- Frontend must guard `response.result`, `response.recommendations`, etc. with `?.` or `|| []`

---

## 7. Theme Engine

### Architecture

- **10 themes** defined as CSS custom properties in `layout.css` under `[data-theme='...']` selectors
- **ThemeStore** in `theme.svelte.ts` — Svelte 5 class with `$state`, persisted to `localStorage('vibelab-theme')`
- **Flash prevention** — inline `<script>` in `app.html` applies theme before first paint
- **ThemeSwitcher** — dropdown component in `+layout.svelte` header (ONE instance, do NOT duplicate)

### Theme IDs

1. `terminal-klasik` (default) — green on black
2. `cyberpunk-neon` — magenta/cyan
3. `arch-linux` — Arch blue
4. `matrix-rain` — deep green
5. `red-alert-soc` — red alert
6. `ice-blue-defense` — cyan/ice
7. `purple-zero-day` — purple
8. `amber-ops` — amber/orange
9. `emerald-secure` — emerald green
10. `monochrome-hacker` — white on black

### CSS Custom Properties (per theme)

```css
--bg-base, --bg-panel, --accent, --accent-secondary, --accent-glow,
--text-base, --text-muted, --border, --border-highlight,
--scanline, --grid, --warning, --critical
```

### Tailwind Theme Bridge (`@theme` block)

```css
@theme {
  --color-bg-base: var(--bg-base);
  --color-accent: var(--accent);
  /* ... maps all CSS vars to Tailwind utilities */
}
```

### Critical Rules

- **Always use theme tokens** (`text-accent`, `bg-bg-panel`, `border-border`, etc.)
- **Never hardcode colors** (no `#00ff00`, no `green-500`)
- **Respect `prefers-reduced-motion`** — all animations have reduced-motion fallbacks in `layout.css`

---

## 8. Design System & CSS

### File: `src/routes/layout.css`

This is the single master CSS file. It contains:

1. **Tailwind import** — `@import 'tailwindcss'`
2. **`@theme` block** — maps CSS vars to Tailwind color utilities
3. **10 theme palettes** — `[data-theme='...']` selectors
4. **Background patterns** — `.bg-scanlines`, `.bg-grid`
5. **Keyframe animations** — `spin-slow`, `pulse-ring`, `burst`, `fade-in-up`, `shimmer`, `electric-spin`, `electric-sheen`, `ai-pulse`, `glow-breathe`, `border-pulse`
6. **Utility classes** — `.animate-*`, `.delay-*`, `.hover-lift`, `.nav-link`, `.input-field`, `.tag-pill`, `.state-empty`, `.state-error`
7. **Electric border system** — `.electric-border`, `.electric-border-active`, `.electric-border-danger`, `.electric-border-static`, `.card-premium`
8. **Button system** — `.electric-button`, `.btn-shimmer` (spinning conic-gradient border + sheen sweep)
9. **Back button glow** — `.back-btn-glow`
10. **AI skeleton** — `.ai-skeleton-bar`
11. **Mobile helpers** — hover suppression, glow reduction, touch utilities (`.touch-none`, `.tap-target`)
12. **Overflow fix** — `html`, `body` both have `overflow-x: hidden`

### Animation Hierarchy

- `MotionShell` uses `animate-fade-in-up` with `animation-delay` and `animation-fill-mode: both`
- `electric-border::before` uses `electric-spin` (rotating conic-gradient)
- `btn-shimmer::after` uses `electric-sheen` on hover
- All animations are gated by `@media (prefers-reduced-motion: no-preference)`
- Mobile (`max-width: 640px`) suppresses `::after` ambient glows and hover transforms

### Key Design Decisions

- **No transform on `.electric-border` hover** — cards manage their own `hover:-translate-y-*` via Tailwind
- **`isolation: isolate`** on electric elements — prevents stacking context leaks
- **mask-composite: exclude** on `::before` — renders border-only conic gradient
- **Mobile: no hover lift** — prevents sticky `translateY` on touch screens

---

## 9. Component Library

### `MotionShell.svelte`
Wraps content in a fade-in-up entrance animation. Accepts `delay` (ms) and `class` props.

### `AppPageShell.svelte`
Page wrapper for all app routes. Renders `AppHeader` + prev/next navigation footer. Accepts `appId` prop.

### `AppHeader.svelte`
Renders app-level header with back button (`.back-btn-glow`), category tags, icon, title, description, meta badges (badge, workflow, priority, AI action).

### `AppTutorial.svelte`
Renders tutorial section with 5 cards: Tujuan, Cara Pakai, Aksi AI, Output, Catatan Security. Uses `.electric-border-static`.

### `BentoAppCard.svelte`
Bento grid card for app listing. Has `.electric-border` with hover transform, gradient overlay, icon, category tags, security identity, priority badge, AI action indicator, "Buka App" CTA.

### `ThemeSwitcher.svelte`
Dropdown menu for 10 themes. Uses `themeState` from `theme.svelte.ts`. ONE instance in `+layout.svelte`. Do NOT duplicate.

### `PageBoot.svelte`
Cinematic boot sequence (terminal lines → scanner → burst). Runs once per session (`sessionStorage('vibelab-booted')`).

### `RouteTransition.svelte`
Route-level transition wrapper.

---

## 10. Threat Runner (Game)

### Game Architecture

- **Game loop** — `requestAnimationFrame` with delta-time
- **Player** — positioned at bottom, moves left/right (keyboard: A/D/←/→, touch: hold buttons)
- **Entities** — `patch` (★) and `malware` (☠) fall from top
- **Projectiles** — fired upward with Space/touch shoot button
- **Collision** — projectile hits entity within dx < 4.5, dy < 6
- **Scoring** — malware +10, patch +5
- **Health** — starts at 100, damage from missed entities (patch -5, malware -20)
- **Timer** — 60 seconds countdown
- **Threat levels** — Low → Medium (>10) → High (>30) → Critical (>50)

### Mobile Controls

- **Left/Right buttons** — `onpointerdown` → `setInterval(50ms)` for continuous hold-to-move
- **Shoot button** — `onpointerdown` fires immediately
- **Page scroll prevention** — `e.preventDefault()` on all touch events, `.touch-none` CSS class
- **Controls visibility** — shown only during play on `sm:hidden` screens

### Audio

- Web Audio API synthesizer in `game-audio.ts`
- All sounds use `OscillatorNode` + `GainNode` envelopes
- Sound preference persisted to `localStorage('vibelab-threat-runner-sound-enabled')`
- Audio context only created after first user interaction (`initAudio()`)
- No autoplay

### AI Integration

- `fetchMission()` on mount → `generate-threat-mission` → `result.missionTitle`, `result.objectives`
- `fetchSummary()` on game over → `summarize-incident` → `result.status`, `result.remediationChecklist`

---

## 11. Frontend AI UX Rules

These rules apply to ALL app pages:

1. **Disable AI button while loading** — `disabled={isLoadingAI}` with `disabled:opacity-50 disabled:cursor-not-allowed`
2. **Prevent duplicate request spam** — `if (isLoadingAI) return` at top of every async AI function
3. **Show loading state clearly** — `animate-pulse` skeleton bars or text
4. **Show friendly Indonesian error** — never expose raw provider errors
5. **Guard `response.result`** — use `?.` optional chaining or provide defaults
6. **Guard `response.recommendations`** — always `|| []` before iterating
7. **Keep UI usable after AI failure** — app must work with local data even if AI is down
8. **No AI auto-fire on form change** — require explicit button click (no `onchange={explainRisk}`)

---

## 12. Environment Variables

```env
AI_PROVIDER=gemini                     # gemini | openai | openai-compatible

# Gemini
GEMINI_API_KEY=
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_CHEAP_MODEL=gemini-2.5-flash-lite

# OpenAI
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=
OPENAI_CHEAP_MODEL=

# OpenAI-compatible (Cloudflare, Ollama, LM Studio, OpenRouter, etc.)
OPENAI_COMPAT_API_KEY=
OPENAI_COMPAT_BASE_URL=
OPENAI_COMPAT_TEXT_MODEL=
OPENAI_COMPAT_CHEAP_MODEL=
OPENAI_COMPAT_PROVIDER_LABEL=
```

### Rules

- Never commit `.env` to git
- Never expose API keys in client-side code or UI
- `gemini.ts` reads from `$env/dynamic/private` with `.env` / `.env.local` fallback
- Health endpoint shows key length and model name only — no secret values

---

## 13. Deployment

### Local Development

```sh
npm install
cp .env.example .env  # fill in API keys
npm run dev
```

### Production Build

```sh
npm run check           # svelte-check — must pass with 0 errors
npm run build           # vite build → adapter-node output in /build
PORT=4173 npm run start # node build
```

### Docker

```sh
docker build -t vibesec-lab .
docker run --rm -p 8080:8080 --env-file .env -e PORT=8080 vibesec-lab
```

### Cloud Run

- `adapter-node` is the production adapter — do NOT change
- Cloud Run provides `PORT` automatically
- Use Secret Manager for `GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.
- Set `AI_PROVIDER` to match the active backend

---

## 14. QA Checklist

Before merging any change:

1. `npm run check` → 0 errors, 0 warnings
2. `npm run build` → successful build
3. Spot-check pages:
   - `/` loads cleanly on mobile
   - `/apps` grid stacks cleanly
   - `/apps/threat-runner` — game plays, touch controls work, no horizontal overflow
   - `/apps/risk-dashboard` — scanner works, AI button disabled while loading
   - `/apps/cvss-calculator` — score updates, AI doesn't crash on missing fields
   - `/apps/secureops-habit-tracker` — checklist works, AI coaching loads
   - `/apps/analyst-portfolio-builder` — forms stack on mobile, ATS CV export works
4. ThemeSwitcher persists across refreshes
5. No provider key appears in logs, responses, or UI
6. `prefers-reduced-motion` respected (no janky animations)

---

## 15. Coding Conventions

### Svelte 5 Runes

- Use `$state()`, `$derived()`, `$derived.by()`, `$props()`, `$effect()`
- Do NOT use legacy `let x = writable(...)` or `$:` reactive statements
- Components use `{@render children()}` for slots, not `<slot />`

### TypeScript

- Strict mode
- Use `$state<Type>()` for typed reactive state
- Use `ReturnType<typeof setInterval>` for timer types
- Prefer `any` for AI response data (responses are provider-dependent)

### CSS / Tailwind

- Use Tailwind utility classes for layout and spacing
- Use CSS custom properties for colors (via `@theme` block)
- Custom animations go in `layout.css`, not inline
- Mobile-first responsive: default → `sm:` → `md:` → `lg:` → `xl:`

### File Organization

- One `+page.svelte` per app route
- Shared components in `src/lib/components/`
- Server-only code in `src/lib/server/`
- API routes in `src/routes/api/`

### Naming

- App IDs use kebab-case: `threat-runner`, `risk-dashboard`
- Component files use PascalCase: `AppHeader.svelte`, `BentoAppCard.svelte`
- CSS classes use kebab-case: `.electric-border`, `.btn-shimmer`

---

## 16. Do NOT

- Do NOT rebuild from scratch
- Do NOT redesign the whole app
- Do NOT add new routes without explicit request
- Do NOT change Gemini env/API key logic
- Do NOT modify server-side AI helper unless absolutely required
- Do NOT change the production adapter (adapter-node)
- Do NOT create a new theme system
- Do NOT create a duplicate ThemeSwitcher
- Do NOT hardcode color values (use theme tokens)
- Do NOT auto-fire AI on form changes
- Do NOT expose raw provider errors in UI
- Do NOT remove existing comments or docstrings unrelated to your changes
- Do NOT remove AppTutorial sections
- Do NOT remove the back button from app headers
- Do NOT remove ThemeSwitcher from layout
- Do NOT change audio to autoplay

---

## 17. Preserve Always

- All 12 routes (/, /apps, 10 app routes)
- All 3 API routes (/api/ai/health, /api/ai/security, /api/security-headers)
- ThemeSwitcher (single instance in +layout.svelte)
- Global Theme Engine (10 themes in layout.css + theme.svelte.ts)
- All 10 theme palettes
- Gemini server-side API architecture
- Production start command (`node build`)
- App category tags and metadata
- Tutorial sections (AppTutorial at bottom of each app)
- Top-left back buttons (AppHeader with .back-btn-glow)
- Threat Runner gameplay, audio, and touch controls
- Risk Dashboard header scanner
- ATS CV export in Analyst Portfolio Builder
- PageBoot cinematic boot sequence
- MotionShell entrance animations
- Electric border system
- Mobile overflow fixes
