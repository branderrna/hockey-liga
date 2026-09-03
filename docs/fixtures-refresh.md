# Fixtures & results refresh

Fixtures, scores and postponements for the site come from a Google Sheet, not from
hand-edited code. A script pulls that sheet, regenerates a data file, and a GitHub
Action commits the result so the site stays current without anyone touching this
repo directly.

There are three ways a refresh starts, in descending order of how often they fire:
an edit in the sheet, a daily cron, or a manual run. They all converge on the same
workflow, so a sheet edit gets the same validation as a code change.

## How it fits together

```
Google Sheet ("COMPLETE" tab)
        │  an edit dispatches via scripts/sheet-refresh-trigger.gs (~10 min max)
        │  plus a daily 03:00 SGT cron, or a manual run from the Actions tab
        ▼
.github/workflows/refresh-fixtures.yml   (GitHub Actions)
        │  runs
        ▼
scripts/refresh-fixtures.ts              (fetch + parse)
        │  writes
        ▼
src/data/matches.generated.ts            (committed to main, only if changed)
        │  imported by
        ▼
src/data/league.ts  →  the rest of the site (fixtures, results, standings)
        │  published by deploy.yml, chained off this workflow via workflow_run
        ▼
live site
```

Team names, colours, and season dates still live by hand in
[`src/data/league.ts`](../src/data/league.ts) — only fixtures/scores are
sheet-driven. The refresh script never touches anything else.

## The Google Sheet

Source: the **"COMPLETE"** tab of the league's Google Sheet (link shared with
"Anyone with the link → Viewer", so the script can read it without any API key or
Google credentials — it just fetches the sheet's public CSV export).

Expected columns (header row, any order, matched by name — a stray trailing space
in a header like `"Score "` is tolerated):

| Column     | Meaning                                           |
| ---------- | ------------------------------------------------- |
| Day & Date | e.g. `Sunday, 02 Aug`                             |
| Venue      | e.g. `CCAB`, `DELTA`                              |
| Time       | 24h, no colon, e.g. `1500`                        |
| Category   | `WOMEN`, `PREMIER`, `U21 GIRLS`, or `U21 BOYS`    |
| Home       | home team name                                    |
| Score      | see below                                         |
| Away       | away team name                                    |
| Notes      | free text — reschedule info, timing changes, etc. |

**Score column convention:**

- Blank → not played yet, nothing scheduled to change
- `4 - 0` → final score, match counts toward the league table
- Contains **`PP`** anywhere (e.g. `PP`, `PP 1 - 0`) → **postponed**. The match is
  excluded from the league table regardless of any score also present in the cell
  (a leftover/partial score before the postponement). Put the reschedule details in
  the Notes column — the site displays that note next to a "PP" badge.

Team names are matched (case-insensitive) against the existing roster in
`league.ts` to link a fixture to a team page/colours. A name that doesn't match
any known team (for example the playoff placeholder rows like `1ST` / `3RD`) is
kept as plain text with no team link — the site still shows it, just without team
styling or a filter-by-team entry.

## The script

[`scripts/refresh-fixtures.ts`](../scripts/refresh-fixtures.ts):

1. Fetches the sheet's CSV export
2. Parses it (a small built-in CSV parser handles quoted fields with embedded
   commas, since the Notes column often contains them)
3. Resolves each row to a division, teams, date/time, score, and postponed state
4. Writes the result to `src/data/matches.generated.ts`

Run it manually anytime:

```sh
npm run refresh-fixtures
```

It prints a warning (not an error) listing any team names it couldn't match — use
that to catch typos in the sheet or new teams that need adding to `league.ts`.

`src/data/matches.generated.ts` is machine-generated — it's committed to the repo
(so the site works without running the script at build time) but shouldn't be
hand-edited; the next refresh overwrites it. It's excluded from ESLint/Prettier
formatting checks for the same reason.

## The automation

[`.github/workflows/refresh-fixtures.yml`](../.github/workflows/refresh-fixtures.yml)
runs on GitHub's own servers, no separate hosting needed:

- **On a sheet edit**: [`scripts/sheet-refresh-trigger.gs`](../scripts/sheet-refresh-trigger.gs)
  dispatches this workflow within ~10 minutes. See
  [Instant refresh on a sheet edit](#instant-refresh-on-a-sheet-edit) below
- **Schedule**: daily at 03:00 Singapore time (`0 19 * * *` in UTC). This is the
  safety net rather than the main path — it is what keeps fixtures moving if the
  Apps Script trigger or its token ever breaks silently. GitHub's scheduled runs
  are best-effort and can be delayed under load
- **Manual trigger**: also runs on demand from the repo's Actions tab
  ("Run workflow")
- **What it does**: checks out the repo, runs `npm run refresh-fixtures`, and — only
  if the generated file actually changed — commits and pushes it to `main`

Publishing is chained off this workflow rather than off its push.
[`deploy.yml`](../.github/workflows/deploy.yml) listens for this workflow
completing successfully (`workflow_run`), because a push made with the default
`GITHUB_TOKEN` does **not** fire other workflows' `on: push` — GitHub's built-in
anti-loop protection. Without that chain, a fixtures commit would land on `main`
while the live site kept serving stale data, with no error anywhere. This bit us
once already; see [docs/deploy.md](deploy.md) for the full explanation.

No `npm install` step is needed for this job — the script only uses Node's
built-ins (`fetch`, `fs`) and this repo's own code, no external packages.

### One-time setup

GitHub repos sometimes default Actions to read-only. For the workflow's
commit-and-push step to work, check:

**Settings → Actions → General → Workflow permissions** → select
**"Read and write permissions"**.

If that's not enabled, the scheduled run will fail at the push step (the fetch and
data generation still succeed — nothing breaks, the site just doesn't get the
update until this is fixed and the workflow re-runs).

## Instant refresh on a sheet edit

[`scripts/sheet-refresh-trigger.gs`](../scripts/sheet-refresh-trigger.gs) is Google
Apps Script that lives in the sheet, not in this repo's build. It watches the
"COMPLETE" tab and dispatches `refresh-fixtures.yml` shortly after an edit, so a
score entered in the sheet reaches the live site in minutes instead of waiting for
the next daily run.

It deliberately does **not** deploy anything itself. It only fires the same refresh
workflow the cron fires, so sheet-driven updates go through the identical path:
validate, commit only if changed, then `deploy.yml`. A malformed row fails
`npm test` instead of reaching the site.

**Why it is split into two functions.** A _simple_ `onEdit(e)` runs unauthorized
and cannot use `UrlFetchApp` at all, so the trigger has to be installed rather
than implicit. And `onEdit` fires once per cell — entering ten scores would fire
ten times, and `refresh-fixtures.yml` queues rather than cancels
(`concurrency.cancel-in-progress: false`), so every one of them would pile up. So
an edit only sets a "pending" flag, and a separate time-driven function collapses
any number of edits into at most one workflow run per interval (10 minutes,
`FLUSH_INTERVAL_MINUTES`).

### Setting it up

1. **Create a GitHub token — from the `branderrna` account.** This repo is owned
   by a personal account rather than an organization, and a fine-grained token is
   bound to a single **resource owner**: your own account, or an org you belong
   to. A collaborator's own account is never an option for someone else's
   personal repo, so a fine-grained token made by a collaborator cannot reach
   this repo at all — `branderrna` will not appear in the **Resource owner**
   dropdown. The repo owner has to create it.

   (A _classic_ token is not resource-scoped and would work from a
   collaborator account, but the dispatch endpoint requires the full `repo`
   scope, granting read/write to every repository that account can reach. That
   is a poor trade for one narrow permission on one repo. Prefer the
   fine-grained token from the owner.)

   GitHub → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**. Scope it as narrowly as it goes:
   - **Repository access**: _Only select repositories_ → `branderrna/hockey-liga`
   - **Permissions → Repository permissions → Actions**: **Read and write**
     (this is what `workflow_dispatch` needs; nothing else is required — in
     particular **not** `Contents`. The workflow commits and pushes using its
     own `GITHUB_TOKEN`, so this token cannot modify code even if leaked. It can
     only start a run that the daily cron would have started anyway.)
   - Set an expiry you will actually notice — see the note below

2. **Open the sheet's script editor**: in the Google Sheet, **Extensions → Apps
   Script**.
3. **Paste in the script**: copy the contents of
   [`scripts/sheet-refresh-trigger.gs`](../scripts/sheet-refresh-trigger.gs) over
   the default `Code.gs`, and save.
4. **Store the token**: **Project Settings → Script Properties → Add script
   property**, name `GITHUB_TOKEN`, value the token from step 1. Script Properties
   are part of the Apps Script project, not the sheet's contents — someone with
   view access to the sheet cannot read them. The token must never be committed
   to this repo.
5. **Install the triggers**: select `installTriggers` in the editor's function
   dropdown and **Run**. Authorize when Google prompts. This is safe to re-run —
   it clears its own triggers first, so it will not stack duplicates.
6. **Verify**: run `testDispatchNow`. A **Refresh fixtures from Google Sheet** run
   should appear in the repo's Actions tab within a few seconds. If the sheet has
   not changed, the run correctly finishes without committing.

### Keeping it working

The token expires. When it does, sheet edits stop triggering refreshes **and
nothing announces it** — the sheet looks fine and the Apps Script failure is only
visible under **Executions** in the script editor. This is exactly why the daily
cron stays in place: fixtures keep updating on their normal schedule even while
the fast path is dead. Regenerate the token and update the `GITHUB_TOKEN` script
property to restore it.

## Known limitation

Some rows in the sheet are playoff/crossover placeholders (e.g. `1ST vs 3RD`,
teams to be decided by final standings) rather than genuine weather postponements,
but they're currently marked `PP` the same way. The script treats them like any
other unresolved match (kept, excluded from standings, no team link) — there's no
special "TBD" styling for them yet. Worth a decision before those rounds arrive.

## Troubleshooting

- **Script errors with "Could not find header row"**: the sheet's column headers
  changed. Check the "COMPLETE" tab's header row still contains `Home`, `Score`,
  and `Away` (extra whitespace is fine, renamed/removed columns are not).
- **Script errors fetching the sheet**: the sheet's sharing setting changed. It
  needs to stay set to "Anyone with the link → Viewer" for the public CSV export
  to work without credentials.
- **Scheduled run succeeds but the site doesn't update**: check the Action's log
  in the repo's Actions tab — most likely the push step failed on permissions (see
  "One-time setup" above), or nothing in the sheet actually changed.
- **Sheet edits don't trigger anything, but the daily run works**: the Apps Script
  side is broken, not the workflow. In the Apps Script editor open **Executions**
  to see `flushPendingRefresh` failures — an expired or revoked token shows up as
  an HTTP 401/403 from `dispatchRefreshWorkflow`. Run `testDispatchNow` to confirm
  a fix. Fixtures still update daily meanwhile.
- **A sheet edit triggered a run that failed `npm test`**: that is the gate working.
  The sheet has a row the validator rejects (bad date, unknown division, malformed
  score). The live site keeps its last good data until the row is fixed.
