# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173/sparkle-app/)
npm run build     # TypeScript check + production build (tsc --noEmit && vite build)
npx tsc --noEmit  # Type-check only, no output files
```

There are no tests. Validation is done manually via the Playwright MCP server configured in `.mcp.json` (headless Chromium, 768×1024 viewport).

## Deployment

Push to `main` → GitHub Actions runs `npm run build` → deploys `dist/` to GitHub Pages. The `base: '/sparkle-app/'` in `vite.config.ts` must match the GitHub repo name exactly.

## Architecture

**Single-page app, no router.** Navigation is a `screen` useState enum in `App.tsx` (`'home' | 'parent-approval' | 'rewards'`). `App.tsx` owns all state and passes handlers down as props — there is no context or global store.

### Data flow

```
App.tsx  ──(props + handlers)──▶  Screens / Components
            ▲
            │ reads on mount, writes on every change
            │
    localStorage ──── UserProgress, Parent PIN (JSON-serialised)
    IndexedDB    ──── habits, daily_entries, rewards  (via idb v8)
```

`App.tsx` seeds default habits and rewards into IndexedDB on first load (conditional — only if the record doesn't exist yet, to preserve parent edits). It then loads all records from IDB into React state. The `habits` state array contains **all** habits including archived ones; screens filter with `!h.isArchived` themselves.

### Storage layer (`src/storage/`)

| File | Purpose |
|---|---|
| `localStorage.ts` | `lsGet<T>` / `lsSet<T>` — typed JSON wrappers, never throw |
| `indexedDB.ts` | `getDB()` singleton + generic `idbGet/Put/Delete/GetAll` + convenience helpers (`getEntriesForDate`, `deleteEntriesForDate`, `getStarsPerDay`) |
| `backup.ts` | `exportBackup()` → download JSON file; `importBackup(file)` → clear+restore all IDB stores + localStorage, then `location.reload()` |

IDB schema: three object stores keyed by `id` string. `daily_entries` has indexes `by_habit` and `by_date`.

### Habit types and approval flow

`HabitType = 'once-daily' | 'repeatable' | 'parent-only'`

The `requiresApproval?: boolean` field on `Habit` marks once-daily habits that need parent sign-off before stars count. The fallback `habit.requiresApproval ?? PARENT_APPROVE_HABIT_IDS.has(habitId)` handles records created before this field existed.

Approval flow: child taps → `DailyEntry` written with `approvalStatus: 'pending'`, `starsEarned: 0` → parent approves in ParentApprovalScreen → `approvalStatus: 'approved'`, `starsEarned: habit.points`, optional lucky-star bonus (25% chance, +1–3 stars).

### Parent section

Gated by a 4-digit PIN (`PinGate` component). `pinUnlocked` state in `App.tsx` resets to `false` on every navigation away from `parent-approval`. The parent section has three tabs: Approvals, Dashboard, Configure.

### Unicorn mood

`computeMood(starsEarnedToday, maxPossibleToday, streak)` in `src/utils/unicornMood.ts`:
- `0` stars → `sleepy`
- `streak ≥ 7` and `≥ 70%` → `party`
- `≥ 70%` → `magical`, `≥ 40%` → `happy`, else `okay`

`maxPossibleToday` is computed live from the active habits array (not a stored constant) so archiving habits immediately adjusts the thresholds.

### Design tokens

All colours, font sizes, radii, shadows, and transitions are CSS custom properties defined in `src/styles/global.css`. Font sizes are intentionally large (`--font-size-base: 20px`, `--font-size-lg: 26px`) for child readability. The app is tablet-first with `max-width: 640px` containers.
