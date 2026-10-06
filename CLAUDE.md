# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173/) — needs .env.local (copy .env.example)
npm run build     # TypeScript check + production build (tsc --noEmit && vite build)
npx tsc --noEmit  # Type-check only, no output files
```

There are no tests. Validation is done manually via the Playwright MCP server configured in `.mcp.json` (headless Chromium, 768×1024 viewport).

## Deployment

Cloudflare Pages (Git-connected) builds every push to `main`: `npm run build` → `dist/`, served at https://sparkle-app.pages.dev/ (`base: '/'`). `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are Pages environment variables; Vite inlines them at build time, so changing them needs a redeploy. Schema lives in `supabase/migrations/` (applied manually via the SQL editor).

## Architecture

**Single-page app, no router.** Navigation is a `screen` useState enum in `App.tsx` (`'home' | 'parent-approval' | 'rewards' | 'english'`), mirrored in the URL hash. `App.tsx` owns all state and passes handlers down as props — there is no context or global store.

### Data flow

```
App.tsx  ──(props + handlers)──▶  Screens / Components
            ▲
            │ reads on mount, writes on every change
            │
    Supabase ──── user_settings (progress, parent_pin, star_rupee_ratio, english_progress), habits, daily_entries, rewards
    localStorage ── sound on/off only (per device)
```

`main.tsx` renders `AuthGate` (`src/auth/`): no session → Google sign-in screen; signed in → `loadUserData()`. A missing `user_settings` row means a brand-new account, so default habits/rewards are seeded once (`seedNewUser`). `App` receives the loaded data as `initialData` and is keyed on user id. Every table has `user_id default auth.uid()` plus an RLS policy, so queries never filter by user explicitly. The `habits` state array contains **all** habits including archived ones; screens filter with `!h.isArchived` themselves.

### Storage layer (`src/storage/`)

| File | Purpose |
|---|---|
| `supabase.ts` | Supabase client from `VITE_SUPABASE_*` env vars |
| `db.ts` | Typed functions over the Supabase tables (`saveHabit`, `saveEntry`, `getEntriesForDate`, `getStarsPerDay`, `saveProgress`, …) with camelCase ↔ snake_case row mappers |
| `localStorage.ts` | `lsGet<T>` / `lsSet<T>` — typed JSON wrappers, never throw |
| `backup.ts` | `exportBackup()` → download JSON file; `importBackup(file)` → replace all of the user's rows, then `location.reload()`. Format is unchanged from the pre-cloud IndexedDB version, so old backups import |

Tables are keyed by `(user_id, id)`; `id` is the same string the app generates (`daily_entries.id = ${habitId}_${dateString}`).

### Habit types and approval flow

`HabitType = 'once-daily' | 'repeatable' | 'parent-only'`

The `requiresApproval?: boolean` field on `Habit` marks once-daily habits that need parent sign-off before stars count. The fallback `habit.requiresApproval ?? PARENT_APPROVE_HABIT_IDS.has(habitId)` handles records created before this field existed.

Approval flow: child taps → `DailyEntry` written with `approvalStatus: 'pending'`, `starsEarned: 0` → parent approves in ParentApprovalScreen → `approvalStatus: 'approved'`, `starsEarned: habit.points`, optional lucky-star bonus (25% chance, +1–3 stars).

### Parent section

Gated by a 4-digit PIN (`PinGate` component; the PIN is stored in `user_settings.parent_pin`). `pinUnlocked` state in `App.tsx` resets to `false` on every navigation away from `parent-approval`. The parent section has three tabs: Approvals, Dashboard, Configure.

### Unicorn mood

`computeMood(starsEarnedToday, maxPossibleToday, streak)` in `src/utils/unicornMood.ts`:
- `0` stars → `sleepy`
- `streak ≥ 7` and `≥ 70%` → `party`
- `≥ 70%` → `magical`, `≥ 40%` → `happy`, else `okay`

`maxPossibleToday` is computed live from the active habits array (not a stored constant) so archiving habits immediately adjusts the thresholds.

### English Time

A daily ~15-minute spoken-English lesson for a young Tamil-speaking child (`src/screens/EnglishScreen/`). Steps: review due words → 4 new words → talk prompt (sentence frame) → short story. Content lives in `src/data/englishLessons.ts` (spoken-Tamil meanings, Android-safe emoji ≤ Emoji 12). Progress stores lesson **indexes**, so append new lessons rather than reordering.

- Speech: `src/utils/speech.ts` (Web Speech API, prefers an `en-IN` voice). Recording: `src/utils/useRecorder.ts` (MediaRecorder, in-memory only, never uploaded).
- Spaced repetition: `src/utils/wordReview.ts` — Leitner boxes 1–5 with intervals 1/2/4/7/14 days; state is `EnglishProgress` in `user_settings.english_progress` (loaded separately via `getEnglishProgress()` so the app still works if that migration is missing).
- Finishing a lesson writes a pending entry for the `english-time` habit (parent approves, +10 ⭐). Older accounts get the habit created on their first finished lesson. The home screen shows it as a dedicated card instead of a habit card; archiving the habit hides the card. Repeating a lesson the same day is "practice": no review, no stars, no progress change.

### Design tokens

All colours, font sizes, radii, shadows, and transitions are CSS custom properties defined in `src/styles/global.css`. Font sizes are intentionally large (`--font-size-base: 20px`, `--font-size-lg: 26px`) for child readability. The app is tablet-first with `max-width: 640px` containers.
