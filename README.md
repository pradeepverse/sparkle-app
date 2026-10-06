<div align="center">

# ✨ Sparkle

**A habit gamification app for kids — powered by a magical unicorn pet**

[![Live App](https://img.shields.io/badge/Live%20App-Open%20Sparkle-%237c3aed?style=for-the-badge&logo=github)](https://sparkle-app.pradeeprajr93.workers.dev/)
[![PWA](https://img.shields.io/badge/PWA-Installable-%235a2d82?style=for-the-badge&logo=pwa)](https://sparkle-app.pradeeprajr93.workers.dev/)
[![React](https://img.shields.io/badge/React-19-%2361dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-%233178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<br/>

> Built for a 5-year-old girl who deserves a magical way to build good habits.
> Every completed habit feeds her unicorn — and earns stars she can spend on real rewards.

</div>

---

## How it works

### For the child
1. Open the app each morning and tap habits as you do them
2. Every tap earns ⭐ stars — watch the unicorn change mood!
3. Habits that need parent sign-off show a "⏳ Waiting…" badge
4. Save up stars and spend them in the 🏪 Reward Shop

### For the parent
1. Tap **👩‍👧 Parent** → enter your 4-digit PIN
2. Review pending habits and tap **✅ Approve** (25% chance of a lucky bonus star!)
3. Award stars directly for habits you observed yourself
4. Check the **📊 Dashboard** for streaks and weekly progress
5. Use **⚙️ Configure** to customise habits, rewards, and data backup

---

## Features

### Child view
| Feature | Details |
|---|---|
| Daily habit checklist | Grouped into Morning / All Day / Evening |
| Once-daily habits | Big tap button, turns green when done |
| Repeatable habits | Tap multiple times (water glasses, potty), shows progress dots |
| Parent-approve habits | Tapping sends to parent queue — child sees "⏳ Waiting…" |
| Parent-only habits | Hidden from child, awarded directly by parent |
| Star counter | Animated bump on every completion |
| Unicorn pet | 5 mood states driven by daily completion percentage |
| Streak banner | 🔥 Shown whenever current streak > 0 |
| Reward shop | Redeem accumulated stars for real prizes |
| Sound effects | Chime tones on completion (toggleable 🔔/🔕) |
| Browser navigation | Back/forward buttons work via History API |

### Unicorn moods

| Mood | Trigger | Feeling |
|------|---------|---------|
| 😴 Sleepy | Nothing done yet | Grey, half-closed eyes |
| 😐 Okay | 1–39% of daily stars earned | Neutral |
| 😊 Happy | 40–69% earned | Smiling, gentle glow |
| ✨ Magical | 70–99% earned | Sparkles, glowing mane |
| 🎉 Party | 100% earned **or** 7-day streak + 70% | Rainbow, dancing |

### Parent section (PIN-gated)
| Feature | Details |
|---|---|
| PIN gate | 4-digit PIN with dot indicators — setup on first use |
| Approvals tab | Review pending habits, approve with optional lucky star bonus |
| Direct award | Grant stars for parent-observed habits (calm voice, etc.) |
| Dashboard | Streak stats, today's snapshot, 7-day star bar chart |
| Configure — Habits | Add / edit / archive habits, set emoji, points, type, time of day |
| Configure — Rewards | Add / edit rewards with custom emoji or uploaded thumbnail |
| Configure — Backup | Export all data to JSON / restore from JSON file |
| Undo today | Reset today's entries if something was tapped by mistake |
| Change PIN | Update PIN from within Configure |

---

## Unicorn level names

| Stars earned (total) | Level | Name |
|---|---|---|
| Starting out | 1 | Baby Sparkle |
| Growing up | 2 | Sparkle |
| Getting powerful | 3 | Super Sparkle |
| Maximum magic | 4 | Rainbow Sparkle |

---

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| UI framework | React 19 + TypeScript 5 | Type-safe, component-driven |
| Build tool | Vite 6 | Instant HMR, fast production builds |
| Styling | CSS Modules | Scoped styles, no runtime cost |
| Backend | Supabase (Postgres + Auth) via `supabase-js` | Per-user data behind row-level security; syncs across devices |
| Login | Google OAuth (Supabase Auth) | One sign-in per device, no passwords |
| PWA | `vite-plugin-pwa` + Workbox | Service worker, offline cache, installable on any device |
| Navigation | `history.pushState` + `popstate` | Back/forward button support without a router |
| Sound | Web Audio API | Synthesised chimes — no audio files, works fully offline |
| Deployment | Cloudflare Workers static assets (Git integration) | Auto-deploys on every push to `main` |

### Data flow

```
App.tsx  ──(props + handlers)──▶  Screens / Components
            ▲
            │ reads on mount, writes on every change
            │
    Supabase (Postgres + RLS, per Google account)
      user_settings ── progress, parent PIN, star→rupee ratio
      habits, daily_entries, rewards
    localStorage ──── sound on/off (per device)
```

`main.tsx` renders `AuthGate`: no session → Google sign-in; signed in → load (or seed, on first sign-in) that user's data → mount `App` with it.

All state lives in `App.tsx` and flows down as props — no context, no global store.

---

## Project structure

```
src/
├── components/
│   ├── HabitCard/          Tap button, repeatable dots, waiting badge
│   ├── UnicornPet/         Mood-reactive image + CSS animations
│   ├── StarBurst/          Celebration particle overlay on completion
│   ├── WaterTracker/       5-dot water progress indicator
│   └── PinGate/            4-digit PIN setup & verify (dot display + numpad)
├── screens/
│   ├── HomeScreen/         Child-facing habit checklist
│   ├── ParentApprovalScreen/  Approve pending, award direct
│   ├── ParentDashboard/    Streak calendar, weekly bar chart
│   ├── ConfigureScreen/    Habits + rewards CRUD, backup/restore
│   └── RewardsScreen/      Shop grid, redeem flow
├── storage/
│   ├── supabase.ts         Supabase client (reads VITE_SUPABASE_* env vars)
│   ├── db.ts               Typed CRUD over Supabase tables (camelCase ↔ snake_case mappers)
│   ├── localStorage.ts     lsGet / lsSet typed wrappers (device prefs only)
│   └── backup.ts           exportBackup() / importBackup() — JSON file, same format as pre-cloud
├── auth/
│   ├── AuthGate.tsx        Session → load/seed user data → <App>
│   └── LoginScreen.tsx     "Sign in with Google"
├── data/
│   ├── habits.ts           DEFAULT_HABITS (seeded on first run)
│   └── rewards.ts          DEFAULT_REWARDS (seeded on first run)
├── utils/
│   ├── unicornMood.ts      computeMood(stars, max, streak) → UnicornMood
│   └── sounds.ts           Web Audio chime synthesiser
├── styles/
│   ├── global.css          CSS custom properties (colours, fonts, radii, shadows)
│   └── animations.css      Keyframe animations (slide-up, sparkle-bump, dance, …)
└── types/index.ts          Shared types: Habit, DailyEntry, UserProgress, …
```

---

## Getting started

```bash
git clone https://github.com/pradeepverse/sparkle-app.git
cd sparkle-app
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev        # http://localhost:5173/
npm run build      # TypeScript check + production build
npx tsc --noEmit   # type-check only
```

Manual UI testing is done with the Playwright MCP server configured in `.mcp.json` (headless Chromium, 390×844 — iPhone viewport).

---

## Deployment

Cloudflare (Workers static assets, Git-connected) builds every push to `main` and serves https://sparkle-app.pradeeprajr93.workers.dev/:

- Build command `npm run build`, output directory `dist`
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set under Settings → Build → Variables and secrets (build-time, not runtime — Vite inlines them)

The database schema lives in `supabase/migrations/` — run it once in the Supabase SQL editor for a new project. Google sign-in needs the Google provider enabled in Supabase Auth, and the deployed URL added to Auth → URL Configuration → Redirect URLs.

---

## Install as an app (PWA)

| Platform | Steps |
|---|---|
| Android (Chrome) | Menu → **Add to Home Screen** |
| iOS (Safari) | Share button → **Add to Home Screen** |
| Desktop (Chrome/Edge) | Click the install icon in the address bar |

Once installed, the app works fully **offline** — all assets are pre-cached by the service worker.

---

## Data & privacy

Everything lives **entirely on the device** — no server, no account, no analytics, no tracking.

Use **Parent → Configure → Backup** to:
- **Export** a JSON snapshot (download to your device)
- **Import** to restore on a new device or after clearing browser storage

---

## Roadmap

- [ ] Phase 4 — animated unicorn evolution cutscene on level-up
- [ ] Phase 5 — sibling profiles (multiple children, one device)
- [ ] Phase 6 — weekly recap notification via Web Push

---

<div align="center">

Built with love for one very sparkly little girl ✨

</div>
