# Weekly fixtures & results refresh

Fixtures, scores and postponements for the site come from a Google Sheet, not from
hand-edited code. A script pulls that sheet, regenerates a data file, and a scheduled
GitHub Action commits the result every week so the site stays current without anyone
touching this repo directly.

## How it fits together

```
Google Sheet ("COMPLETE" tab)
        │  weekly, Wed 09:00 SGT (or manual trigger)
        ▼
.github/workflows/refresh-fixtures.yml   (GitHub Actions)
        │  runs
        ▼
scripts/refresh-fixtures.ts              (fetch + parse)
        │  writes
        ▼
src/data/matches.generated.ts            (committed to the repo)
        │  imported by
        ▼
src/data/league.ts  →  the rest of the site (fixtures, results, standings)
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

| Column | Meaning |
|---|---|
| Day & Date | e.g. `Sunday, 02 Aug` |
| Venue | e.g. `CCAB`, `DELTA` |
| Time | 24h, no colon, e.g. `1500` |
| Category | `WOMEN`, `PREMIER`, `U21 GIRLS`, or `U21 BOYS` |
| Home | home team name |
| Score | see below |
| Away | away team name |
| Notes | free text — reschedule info, timing changes, etc. |

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

## The weekly automation

[`.github/workflows/refresh-fixtures.yml`](../.github/workflows/refresh-fixtures.yml)
runs on GitHub's own servers, no separate hosting needed:

- **Schedule**: every Wednesday at 09:00 Singapore time (`0 1 * * 3` in UTC)
- **Manual trigger**: also runs on demand from the repo's Actions tab
  ("Run workflow") if scores need to go out before the weekly schedule
- **What it does**: checks out the repo, runs `npm run refresh-fixtures`, and — only
  if the generated file actually changed — commits and pushes it to `main`

That push is what updates the live site: whatever host serves this project
(Cloudflare Pages was the plan at time of writing) redeploys automatically on every
push to `main`, the same as any other change to the repo.

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
  "One-time setup" above), or nothing in the sheet actually changed that week.
