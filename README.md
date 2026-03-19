# Sparkle

A habit gamification web app for kids. Your child earns stars by completing daily habits, which feed a virtual unicorn pet that changes mood based on how well the day is going. Parents have a PIN-gated section to approve habits, award bonus stars, manage rewards, and track streaks.

**[Open the app](https://pradeepverse.github.io/sparkle-app/)**

---

## Features

### For kids
- Daily habits grouped by Morning / All Day / Evening
- Tap to complete — earns stars instantly
- Unicorn pet that reacts to daily progress (sleepy -> okay -> happy -> magical -> party)
- Reward shop — redeem saved stars for real prizes
- Water tracker with progress dots

### For parents (PIN-gated)
- **Approvals** — review and approve habits that need sign-off (with a lucky star bonus)
- **Award directly** — grant stars for parent-observed habits
- **Dashboard** — streak stats, today's snapshot, 7-day bar chart
- **Configure** — add / edit / archive habits and rewards (custom emoji or uploaded thumbnail)
- **Undo today** — reset accidental entries
- **Backup & restore** — export/import all data as JSON

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19 + TypeScript 5 + CSS Modules |
| Build | Vite 6 |
| Storage | localStorage (progress + PIN) + IndexedDB via `idb` v8 (habits, entries, rewards) |
| PWA | `vite-plugin-pwa` (Workbox, offline-ready, installable) |
| Deploy | GitHub Actions -> GitHub Pages |

---

## Development

```bash
npm install
npm run dev        # http://localhost:5173/sparkle-app/
npm run build      # type-check + production build
npx tsc --noEmit   # type-check only
```

UI validation is done with the Playwright MCP server configured in `.mcp.json` (headless Chromium, 768x1024).

---

## Deployment

Push to `main` -> GitHub Actions (`deploy.yml`) runs `npm run build` -> deploys `dist/` to GitHub Pages automatically.

The `base: '/sparkle-app/'` in `vite.config.ts` must match the GitHub repository name exactly.

---

## Install as an app (PWA)

On Android (Chrome): tap the menu -> Add to Home Screen.
On iOS (Safari): tap the Share button -> Add to Home Screen.
On desktop (Chrome/Edge): click the install icon in the address bar.

Once installed, the app works fully offline.

---

## Data and privacy

All data lives entirely on the device — no server, no account, no analytics. Use **Parent -> Configure -> Backup** to export a JSON file and transfer it to another device.
