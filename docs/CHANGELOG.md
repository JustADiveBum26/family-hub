# Changelog

Skimmable summary of what changed and why, newest first. This condenses the
git commit history (`git log`) into one browsable file so a new session can
catch up fast without paging through commits. Full detail (diffs, exact
wording) is always in git — this is the fast-read version, not a
replacement for it.

Add one entry here per `vNN` commit going forward.

## v65 — shared to-do list for Brad & Mary Beth
New "Shared To-Do" list, separate from the personal "My To-Do" tabs (those are
unchanged). Items have text, assignee (Brad / Mary Beth / either), priority,
due date and notes; completed items collapse into a "Done" section with
"Clear completed". Shows as a tab, a card on both parents' home screens, and
a rotating panel on the TV (open items only, top 6, overdue in red). One
on/off toggle in Brad's Settings > Feature Toggles (default OFF) hides all
three for both parents. Stored at `fp2:sharedTodos`; every edit re-reads the
stored list first so simultaneous edits by both parents don't clobber each
other. Kids and the public home screen never see it.

## v66 — shared to-do list simplified to task name + notes
The v65 shared list was too busy. Dropped assignee, priority, and due date;
each item is now just a task name and optional notes, in the order added.
Same tab / home card / TV panel / Settings toggle. Existing items keep
working (their old extra fields are simply ignored).

## v64 — full-app streamlining pass: real bugs fixed, duplication removed
Four parallel review agents (family.jsx; shared/dashboards/App; calendar/tv;
finance/infra) audited the whole codebase for cleanup opportunities. Fixed
first:
- Meal plan "Add All to List" only ever saved the last ingredient — each
  add in the loop read the same stale shopList and overwrote the previous
  one. Now builds the whole batch once.
- A weekly recurring calendar event silently failed to save with no error
  if "repeat until" was picked before the start date.
- The "Upload Statement" AI-import feature (Finance > Statements) was
  completely non-functional — it called api.anthropic.com directly from
  the browser with no auth header, so it could never work without a
  backend to hold a secret key. Removed the dead upload UI/plumbing;
  transaction history/spending charts stay wired in case a real import
  path gets added later.
- Bradyn/Parker/Ryder's dashboards were passed ~20 props by hand instead
  of spreading `sharedProps` like Brad/Mary Beth's already did — a future
  shared field could silently never reach them. Now consistent everywhere.
- A Firestore save-retry could mask real errors (permission-denied,
  network drop) behind a doomed-to-also-fail fallback write; now only
  retries on the specific "document doesn't exist yet" case.

Then de-duplicated logic that had drifted into multiple copies: day-until-
due math (new `daysUntil()` in constants.js, replacing ~10 hand-rolled
`864e5` call sites across family/shared/calendar/tv), the "show adult
chores" visibility check (new `canShowChoreRow()`, was reimplemented
identically 4x), the full-screen modal overlay (new shared `ModalOverlay`
component, was duplicated 3x across family.jsx and calendar.jsx), a
triple-duplicated yearly-event-normalization snippet in calendar.jsx, and
`billPaid()`/`addMonthToDate()` reimplemented locally in family.jsx
despite already being imported. `tv.jsx`'s color palette now imports
`THEMES.dark` instead of a hand-typed copy that could drift (same failure
mode v60 already fixed once for styles). `scripts/backup-firestore.js`
now calls `store.dump()` instead of a second copy of the same export
logic. Plus small dead-code trims (unused imports/vars, a confusing
`slotKey` name reused for two different key schemes).

## v63 — bigger tap targets for meal plan and chore checkboxes on TV
Icon-only controls with no padding (meal plan `+`/🎲/edit/del, chore
checkboxes, recipe select toggles, chip `×` remove buttons) were hard to
click precisely on the TV's large screen with a mouse pointer. Enlarged
hit areas and icon sizes, no layout changes. No live click-through test —
the meal plan editor is password-gated (see CLAUDE.md, Auth model) — but
production build verified clean and diff is pure CSS sizing.

## v62 — meal plan date-change + version badge fix
Click a planned meal to open its detail modal; "Change Date" now lets you
move it (including across weeks) via a date picker + meal-type dropdown,
with swap-confirm if the destination slot is taken. Second v62 commit just
re-synced the version badge.

## v61 — TV goodnight mode goes fully black
Previously just dimmed via a brightness filter while staying legible. Now
goes fully black during the configured overnight window, wakes on
tap/click, and auto-returns to black after 30s idle.

## v60 — deep cleanup pass
Finance tab (kept intentionally siloed — don't cross-wire it) trimmed of
redundant cards; 7 Finance sub-tabs collapsed into one with an internal
switcher; added a Settings toggle to hide Finance entirely. Structural:
added `.gitignore`, untracked `node_modules`/`dist`, derived `tv.jsx`
styles from the shared `makeS()` factory instead of a hand-forked copy
that had drifted (missing grid keys). Nav: `makeKidS()` and
`DashboardShell` replace large blocks of duplicated per-kid/per-parent
code. New shared components (QuickAddChip, SavedListCard, ApprovalRow,
EditFormCard) migrated onto real duplicated UI across the app.

## v59 — cleanup pass, dead code and real bugs
Removed unused code/deps/exports. Fixed: BradynLedger's dead ternary
always showing an orange border regardless of due-soon state; recurring
bills not rolling over until next page load; PSLF dashboard reading a
stale profile field instead of the tab's own tracked value. Nav trimmed
from 19 to 17 tabs on Brad's dashboard (Scenario Lab folded into Finance,
Admin folded into Settings, Recipe Library moved next to Favorites).

## v58 — countdown strip rotates instead of wrapping
Caps at 3 visible cards, auto-rotates the rest every 6s with page dots,
instead of wrapping into extra rows that ate vertical space on the TV.

## v57 — Meal Favorites moved to bottom, collapsed by default
Now that it can hold dozens of imported recipes, keeping it expanded at
the top crowded out the weekly grid and shopping list.

## v56 — 100-recipe curated Recipe Library
Browse/search/filter, expandable ingredients+instructions, batch-add to
Favorites. Surprise Me dice automatically benefits since it already pulls
from Favorites.

## v55 — restore-from-backup, chore reset fix, recurring bills, and more
Restore-from-backup uploader (preview before overwrite); chore completion
tracked by date instead of weekday name so it actually resets weekly
(also fixed the home-screen task board never logging to the leaderboard);
recurring monthly bills; Surprise Me button on empty meal slots; shopping
list item prices vs. Food budget; TV overnight dimming window; new
calendar icons.

## v54 — version badge
Small "vNN - updated <date>" corner badge everywhere, including TV.
Version bumped by hand per commit; build date auto-stamped via
`__BUILD_DATE__` in `vite.config.js`.

## v52 — multi-city weather everywhere
Every screen now uses the same rotating family-cities widget as the TV;
removed the old single-saved-location WeatherStrip and its plumbing.

## v51 — automatic pre-deploy Firestore backup
Every deploy snapshots live Firestore data to a private
`family-hub-backups` repo first (this repo is public; the data includes
account balances, bill amounts, plaintext login PINs). Keeps the most
recent 60 snapshots. Backup steps are non-blocking so a
missing/misconfigured `BACKUP_REPO_TOKEN` secret can't break a deploy.

---

*(Versions before v51 aren't backfilled here — see `git log` for those.)*
