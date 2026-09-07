# Family Hub

A family organizer web app (calendar, meal planning, chores, shopping lists,
finance, kid dashboards, TV wall display) for Brad & Mary Beth's household.
React + Vite, Firebase/Firestore backend, deployed as a static site to
GitHub Pages. No backend server — the client talks to Firestore directly.

Full history of *why* things are the way they are lives in git commit
messages (`git log`) — every commit is `vNN: description` with a detailed
body. Read recent ones before assuming something is undocumented.

## Stack & layout

- `src/constants.js` — theme/style factory (`makeS`), shared constants
  (DAYS, USERS, APP_VERSION), small pure helpers (chore logging, date math).
- `src/store.js` — Firebase init + Firestore read/write wrapper. Contains
  the Firebase `apiKey` — this is a public client key by design (Firebase
  security is enforced by Firestore rules, not key secrecy), and this repo
  is already public, so it's not a new exposure.
- `src/App.jsx` — top-level routing/auth state, `#tv` hash toggles TV kiosk mode.
- `src/family.jsx` — the bulk of the app: chores, meal plan, shopping,
  settings, bills. Largest file (~1600 lines).
- `src/dashboards.jsx` — per-user home screens (Brad / Mary Beth / kids).
- `src/calendar.jsx` — month calendar, event CRUD, countdown strip.
- `src/finance.jsx` — Finance tab, kept intentionally siloed from the rest
  of the app per prior instruction (don't cross-wire it into other tabs).
- `src/shared.jsx` — cross-cutting reusable components (ApprovalRow,
  QuickAddChip, SavedListCard, EditFormCard, WeeklyChoreBoard, etc.).
- `src/tv.jsx` — `#tv` kiosk mode: read-only, big-type, auto-refreshing wall
  display. Has its own style object (`tvS`) built on `makeS("dark",1)` — do
  not hand-fork styles here again, it drifted out of sync once before (v60).
- `scripts/backup-firestore.js` — pre-deploy Firestore snapshot script.

## Conventions

- **Every change gets its own commit**, message format `vNN: short summary`
  with a body explaining what/why (not just what). Bump `APP_VERSION` in
  `src/constants.js` to match `NN` — it renders as a small corner badge
  app-wide (`src/shared.jsx`) so it's easy to confirm what build is live.
- No code comments except for non-obvious *why* (hidden constraints,
  workarounds, subtle invariants). This codebase already follows that —
  match it.
- Dense inline-style JSX, no CSS files, no component library. Match the
  existing minified/compact formatting style rather than reformatting.
- Style values come from `S` (the `makeS()` result passed as a prop),
  not hardcoded — `S.card`, `S.btn()`, `S.btnGhost`, `S.btnDanger`, etc.

## Auth model

- Brad and Mary Beth (parents) sign in with a password; can edit
  everything including the meal plan grid.
- Bradyn/Parker/Ryder (kids) have their own tiles, no password, limited to
  their own dashboard + suggestion/request queues that parents approve.
- **I (Claude) do not have and should not ask for these passwords** —
  can't fully interact with parent-only screens (e.g. the meal plan editor)
  in a live browser session. Verify changes by code review + production
  build (`npx vite build`) instead, and say so explicitly rather than
  claiming to have clicked through it.

## Running & deploying

- `npm run dev` starts a local Vite dev server against the **live**
  Firebase project — there is no separate staging/dev database. Be
  careful with anything that writes data during local testing.
- Deploy is push-to-main only: `.github/workflows/deploy.yml` runs on
  push to `main` — backs up Firestore to a private `family-hub-backups`
  repo, then `vite build`, then publishes `dist/` to GitHub Pages. There
  is **no PR preview environment**.
- No live preview link is possible via Artifacts — the Artifact sandbox
  blocks the network calls this app needs (Firestore/Auth), so a
  Firebase-backed app never actually loads there.
- A local-dev-server-plus-tunnel (`npx localtunnel --port <port>`) can give
  a real temporary preview link, but exposing a local server to the
  internet requires the user's explicit go-ahead each time (the auto-mode
  permission classifier blocks it otherwise) and needs
  `server.allowedHosts` set in `vite.config.js` for the tunnel host —
  revert that config change before committing, it's local-only.
- Default to just pushing straight to `main` for small/low-risk changes
  (styling, copy, sizing) rather than setting up a preview — the user has
  said this is the faster path when a preview isn't specifically needed.

See `docs/CHANGELOG.md` for a skimmable summary of recent versions.
