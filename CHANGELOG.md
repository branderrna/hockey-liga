# Changelog

Notable changes to the site, kept by hand alongside the automated
fixtures/results refresh (which does not get its own entry here every run —
see [docs/fixtures-refresh.md](docs/fixtures-refresh.md)).

## 2026-09-04 (later)

**Infrastructure**

- Removed a duplicate deployment nobody knew about. Cloudflare Workers Builds
  had been connected to this repo since 2026-08-22 and was quietly deploying
  every `main` push to a second Worker named `hockey-liga`, live at
  `hockey-liga.hockey-liga.workers.dev`. Only its non-`main` builds failed
  visibly, which is why it read as "broken CI" rather than a parallel deploy.
  `sghockeyliga.com` was never affected. Integration disconnected; see
  [docs/deploy.md](docs/deploy.md) for how `wrangler deploy` produces this
  silently while `wrangler versions upload` fails loudly.

## 2026-09-04

**Deployment triggers**

- Restored a direct manual deploy. `deploy.yml` had lost its
  `workflow_dispatch`, leaving no way to redeploy without pushing a commit or
  running a fixtures refresh. The ref is matched against an explicit
  `main`/`staging` whitelist, so a dispatch from any other branch fails before
  the Cloudflare token is in scope.
- A Google Sheet edit now reaches the live site in minutes.
  `scripts/sheet-refresh-trigger.gs` (Apps Script, installed in the sheet
  itself) dispatches `refresh-fixtures.yml` on an edit, debounced so that
  entering several scores produces one workflow run rather than one per cell.
  Requires a GitHub token stored in the Apps Script project — see
  [docs/fixtures-refresh.md](docs/fixtures-refresh.md).
- Fixtures cron widened from Sunday/Monday to daily at 03:00 SGT. It is now the
  safety net behind the sheet trigger rather than the primary path, so a broken
  Apps Script trigger or expired token degrades to a one-day delay instead of
  stopping updates.

**Infrastructure**

- Every deploy now passes the same validation gate as a pull request. The CI
  checks moved into a reusable `checks.yml` that both `ci.yml` and `deploy.yml`
  call, so they cannot pass in review and then be skipped on the way to
  production. Added a formatting check to that gate.
- Documented why there is no wrangler config in the repository root, and why
  Cloudflare Workers Builds must stay disconnected: it runs
  `npx wrangler versions upload` from the root with no build step, which fails
  on every push, and it cannot do the scheduled or sheet-driven deploys this
  project relies on. See [docs/deploy.md](docs/deploy.md).

**Fixes**

- `.mcp.json` pointed the code-review-graph server at `D:\_github-repos\hockey-liga`,
  a path that does not exist on this machine, so the server failed to start for
  anyone whose checkout lives elsewhere. It now inherits the project root.
- Added `.gitattributes` normalising the repository to LF. Without it a Windows
  checkout (`core.autocrlf=true`) reported every file as unformatted, making
  `npm run format:check` unusable locally and unsafe to enforce in CI.
- Removed a vestigial `SEASON.subtitle` of `"
"`, left behind when the points
  subtitle was dropped. It rendered an empty styled element in the header and a
  stray `·` separator in the footer.
- `src/server.ts` imported `./lib/error-capture` twice — once bare, once named.

## 2026-09-01

**Infrastructure**

- Fixed a real gap in the fixtures-refresh pipeline: its commits used the
  workflow's default `GITHUB_TOKEN`, which GitHub's anti-loop protection
  excludes from triggering other workflows' `on: push` — so `deploy.yml`
  was silently never firing after a scheduled/manual refresh. The site
  kept serving stale data with no error anywhere until something else
  happened to push and trigger a real deploy. `refresh-fixtures.yml` now
  explicitly triggers `deploy.yml` via `gh workflow run` after a
  successful commit. See [docs/deploy.md](docs/deploy.md).

## 2026-08-23

**Infrastructure**

- Added a staging environment: pushes to a `staging` branch now deploy to a
  separate Cloudflare Worker (`branderrna-hockey-liga-staging`) for trying
  out changes before they reach production. See [docs/deploy.md](docs/deploy.md).
- Fixtures-refresh schedule changed from once weekly (Wednesdays) to twice
  weekly — Sundays and Mondays at 03:00 Singapore time.

## 2026-08-20

**Local dev environment**

- Cloned the project locally and got it running outside the Lovable editor
  (`npm install` / `npm run dev`)
- Fixed the header logo not loading locally — Lovable-hosted image assets need
  `LOVABLE_PREVIEW_HOST` set for the dev server's asset proxy to resolve them

**League table**

- Removed the "Win 3 pts · Draw 1 pt · Loss 0 pts" subtitle from the League
  Table page

**Postponed-match display**

- Replaced the raw "PP" text and dumped sheet note with a proper amber
  "PP" badge, a subtle border accent on the fixture card, and the reschedule
  note styled with a refresh icon
- Fixed fixture card layout: team names are now centered instead of ragged
  left/right alignment, and the reschedule note stays pinned to the right
  column instead of wrapping underneath on longer text

**Fixtures & results now sourced from Google Sheets**

- Added `scripts/refresh-fixtures.ts`, which fetches the league's public
  Google Sheet ("COMPLETE" tab), parses it, and regenerates
  `src/data/matches.generated.ts`
- Extracted `matches` out of the hand-maintained `src/data/league.ts` into
  that generated file; teams/colours/season config are still hand-maintained
- Extracted shared types into `src/data/types.ts` to avoid a circular import
  between `league.ts` and the generated data file
- Fixed two pre-existing data bugs uncovered in the process: a missing match
  (ORA vs THISISRI, Sun 2 Aug) and duplicate match IDs causing React key
  warnings
- Added `.github/workflows/refresh-fixtures.yml` — runs the refresh weekly
  (Wednesdays 09:00 Singapore time) and on manual trigger, committing the
  regenerated data only when it actually changes
- Added `docs/fixtures-refresh.md` explaining the whole pipeline, the sheet's
  expected format, and troubleshooting steps

**Known follow-up (not yet done)**

- Some sheet rows are playoff/crossover placeholders (e.g. "1ST vs 3RD",
  teams TBD by final standings) rather than genuine postponements, but are
  currently treated the same as a weather postponement. Needs a decision on
  how those should read on the site before those rounds arrive.
- Hosting/deployment not yet set up (planned for the following day).
