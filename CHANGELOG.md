# Changelog

Notable changes to the site, kept by hand alongside the automated
fixtures/results refresh (which does not get its own entry here every run —
see [docs/fixtures-refresh.md](docs/fixtures-refresh.md)).

This is the engineering log: the reasoning, the plumbing, and the things that
were wrong. The visitor-facing release notes shown in the site's footer live in
[`src/data/versions.ts`](src/data/versions.ts). Both share one numbering and
`npm test` fails if they disagree — see [docs/versioning.md](docs/versioning.md).

Versions before 0.6.0 were assigned retroactively; see that document for how.

## 0.8.0 — 2026-09-08

**Results archive and competition phases**

- Added the completed 2026/1 ligas as a read-only Google Sheets source loaded by
  the shared `/liga/:slug` route; no archive fixture snapshot is checked in.
- Ongoing and completed ligas now have separate sidebar sections and direct
  liga links.
- Round labels are readable in schedules, and shootout results appear below the
  full-time scoreline.
- Added round switching to multi-round tables and a compact knockout run to My
  Team. The live 2026/2 refresh remains compatible with the older sheet shape.
- The knockout chart is now built from the draw rather than from stage columns.
  `bracketsOf` follows each winner to the game it went on to, which yields a tree
  per competition: the championship narrowing four to two to one, the 5th-8th
  bracket beside it, and a third-place play-off hung off the final it belongs to
  rather than wired into it. Cards are laid on one shared row grid across all
  columns, so a card's centre is exactly the midpoint of the two that feed it and
  the connectors are three plain rules instead of guesses. The old chart sorted
  cards into stage columns and drew a line from every card to every neighbour,
  which is why the lines did not mean anything.
- A decider between two beaten sides, like a third-place play-off, now hangs
  under its chart instead of taking a grid row. The row was one every other
  column left blank, which on a phone showing the left of a chart was a screen
  of empty space before the next one. It settles the bracket but sits on no
  path through it, so it was never part of the tree.
- Fixed a chart on a phone opening on nothing. The shared column hierarchy
  means a placing bracket's leading columns are empty by design, which on a
  narrow screen was a screenful of blank space above the title. Charts now open
  on their own first stage, and on a phone the empty columns are dropped
  entirely: charts scroll independently there, so lining their columns up
  across charts buys nothing that a chart starting at its own first game does
  not buy more cheaply. The desktop alignment is untouched.
- A chart that does not fit is scrolled by hand, with the scrollbar hidden in
  favour of a fade at whichever edge has more content. Stage buttons that
  jumped the chart were tried and dropped: they duplicated the column headings
  already on screen and were their own source of bugs. The fades carry it.
- Drag to pan the chart with a mouse. Hiding the scrollbar left a desktop
  window too narrow for the whole bracket with no obvious way across it, since
  a mouse has no equivalent of a swipe. The grab cursor appears only when there
  is somewhere to drag to. Touch and pen are deliberately untouched, because
  they already pan and hijacking them would only cost the momentum.
- A chart that opens on a later stage lands it clear of the fade rather than
  under it, so the first column never reads as clipped down one side. The inset
  is declared once in CSS as the scroller's scroll-padding and read back in JS.
- Moved the bracket into the phase switcher beside the numbered rounds, where
  it reads as the phase that followed them rather than as an appendix to the
  last round's table. Selecting it does not disturb which round the tables are
  for, so switching back lands where you left.
- Seeding notes on a card wrap instead of truncating. A route cut off
  mid-phrase says less than no route at all, and the rows have the headroom.
- The My Team knockout run reads from the selected team's side rather than the
  sheet's: their own name first whether they were home or away, and their own
  score first with it. Once a row is ordered that way the score has to follow,
  or it reports the wrong result every time they played away. Their name is
  dropped where the row is tight, since every row of their own page carries it
  and the opponent is the part that differs; a phone turned landscape has the
  width and gets it back. The grid moved onto the list so the opponents line up
  under each other and the stage never wraps.
- Laid the charts out against one column hierarchy per division, keyed by
  rounds from each chart's own decider rather than by stage name. The
  semi-finals of a 5th-8th bracket now sit under the semi-finals of the
  championship, and a chart that starts later leaves its leading columns empty
  instead of sliding left and reading as an earlier round. Column headings stay
  per chart, since that column is a final in one and a placing game in another.
- Columns share the container's spare width instead of leaving it blank on the
  right, and the chart no longer sizes itself to `max-content`, which was
  producing a scrollbar with room still to spare. The gutter stays fixed at
  `--knockout-gap`, because the connectors are drawn half a gutter out of one
  card and half a gutter into the next.
- Took roughly a fifth off the chart height. Wider columns keep club names on
  one line, and the shootout result moved alongside each side's score rather
  than onto a line of its own, which also says which of the two won it. Rows
  stay uniform, since that is what lets a card's centre be a percentage and
  keeps the connectors in pure CSS.
- A round played in two halves is still one table. The halves say who a side is
  scheduled against, not which league they are in, so a side from the bottom
  half can finish above one from the top: 2026/1 Super had SA Alumni 7th after
  Round 1 and 5th at the end, above Masters O50s who were 5th. A table per half
  hid exactly that, ranking SA Alumni 1st of the bottom five and Masters 5th of
  the top five. Pool detection and per-pool tables are gone with it; what is
  left is one table per round, and BACKLOG.md keeps the case for bringing pools
  back if a season ever runs them as separate competitions.
- A numbered round continues the one before it rather than starting a fresh
  table. Super and Premier both run a second round where points and goals carry
  forward and only the fixtures change, the top half playing among themselves
  and the bottom half likewise. Counting a round alone put the leaders at the
  bottom of their own pool the day it opened: Super's Round 2 table had
  THISISRI 4th on 3 points having led Round 1 on 25. `standingsFor` now counts
  every round up to the one asked for. A season that resets instead is a
  different shape and is left to BACKLOG.md rather than guessed at from the
  fixtures.
- A round whose sides are still seeded by finishing position is kept out of the
  table switcher until its clubs are named. The switcher opens on the latest
  round, so a published-but-unseeded round meant a visitor's first sight of the
  league table was every team on zero, with the real one a click away. Those
  fixtures still show in the schedule, where the date and venue are the point,
  and the round earns its table on the day the names arrive.
- Read two things out of the 2026/1 notes that the sheet records nowhere else,
  because that tab is immutable and cannot be corrected at source. A seeding
  play-off filed under a numeric round becomes a `PLAY-IN` when a knockout row
  names it (`Winner of 6th/7th play-in`), which takes it out of that round's
  table and puts it in the bracket. And a round whose halves never play each
  other is read as pools by connectivity, so Super Round 2 shows as Top 5 and
  Bottom 5 seeded off Round 1 instead of one table of half-played records.
- Gave the completed-season tab the safety net it never had. It is the one
  source that reaches the site with no gate at all: read on request, with no
  refresh script, no test run and no deploy in between, so a mistyped score in
  the Sheet was live immediately and took all five completed ligas down at once,
  since they share one parse. Now `parseArchiveCsv` drops a row it cannot read
  and returns it in `issues`, and the liga page shows the count with the rows
  behind a summary. A header that no longer names Home, Score and Away still
  throws, because that is not one bad row.
- Added `validate-archive.yml`, which runs the archive validator weekly at 03:00
  Singapore time on Monday. The two halves are deliberate: failing soft keeps
  the site up, which is precisely what stops anyone noticing, so the scheduled
  run is what turns a silent break into a red run and a failure email. The
  validator now asserts `issues` is empty, so it fails on the same rows the site
  quietly drops. Weekly rather than daily because a finished season should not
  be changing; the point is a ceiling on how long a break can hide.
- The per-row conflict the parser refuses to guess at, a note saying postponed
  where the Score does not, is now a `rowConflicts` policy. The live refresh
  still fails on it, so a contradiction cannot reach the site unnoticed and the
  last good data stands. The archive skips the row, because it has no build to
  fail.
- Removed the half of `league.ts` that `competition.ts` superseded. Moving the
  views onto dataset-taking functions left the facade with its own unreachable
  copies of `weekendsOf`, `latestWeekendKey`, `isReplayed` and their date
  helpers, plus exports nothing imported. `league.ts` is now only the
  current-season data and the catalogue. The reasoning that lived in those
  comments — the sheet's misspellings of "shifted from", why the schedule
  follows the calendar rather than waiting for scores, and why Singapore time is
  computed by offset — moved to the surviving implementations rather than being
  deleted with the code. This clears the `knip` step, which was failing on this
  branch before any of the bracket work and gates the deploy job.
- Super's Round 2 named Tornados Hockey Club `TORNADOS` in four rows, splitting
  the club into two teams with half a season each and hiding the pool split. It
  was first reconciled by an alias in the archive parser, then corrected in the
  sheet and the alias removed: a name fixed at source is fixed for every reader,
  where a mapping in code is invisible from the sheet. The team-count assertion
  in `validate-archive-fixtures` is what catches a split club, and both notes
  recoveries above are contract-tested against the live sheet the same way.

## 0.7.1 — 2026-09-07

**Quick start**

- Branded the iPhone and Android setup screenshots with Hockey Liga.

## 0.7.0 — 2026-09-07

**Quick start**

- Added an Add to Home Screen guide with platform-specific steps for Safari on
  iPhone and iPad, and Chrome on Android.
- Added official Apple and Chrome reference screenshots to make each browser's
  menu easier to recognise.

## 0.6.0 — 2026-09-06

**Footer**

- Every page now ends with a footer carrying the date the results were last
  updated and the site's version. Until now a visitor looking at a blank score
  had no way to tell a game not yet played from a page that had stopped
  updating — the only freshness signal anywhere was a git commit timestamp.
- `scripts/refresh-fixtures.ts` stamps `fixturesUpdatedAt` into the generated
  data. It records when the fixtures last **changed**, not when the sheet was
  last checked, and is carried forward untouched when a run finds nothing new.
  That distinction is load-bearing: the refresh runs on every sheet edit and
  daily, and `refresh-fixtures.yml` decides whether to commit by diffing the
  generated file. A stamp that advanced on every run would make that diff dirty
  every time, committing and redeploying the site several times an hour with no
  data behind it.
- Established a version scheme and applied it back over the project's history,
  so the number in the footer means something from the first release rather than
  starting at 0.1.0 today. `npm test` now checks the two records agree, that
  release dates are real, and that the list stays ordered newest-first.

## 0.5.1 — 2026-09-05

**Fixes**

- The schedule opens on the weekend being played today rather than on the last
  weekend with a result, so on a match day the games in progress are what loads.

## 0.5.0 — 2026-09-04

Covers 2026-09-01 through 2026-09-04.

**Interface**

- Navigation rebuilt around per-liga pages. Each liga has its own page holding
  the schedule and league table, replacing the single shared table route; the
  old `/table` path redirects into it.
- The landing page became a fill-in-the-blank team picker, and the chosen liga
  and team persist, so a returning visitor lands on their own fixtures.
- Added a My team view: one team's fixtures, results and form, without the rest
  of the liga around it.

### Staging retired

**Deployment**

- Retired the `staging` branch, its Worker, and its branch mapping. Per-branch
  preview URLs replace it and are strictly better: every branch gets its own
  environment instead of everyone sharing one slot. `staging` had also drifted
  29 commits behind `main` and was last deployed 2026-08-23, so anyone
  following the old advice would have been testing against a month-old
  baseline — a stale safety net is worse than none.
- `main` is now the only branch that deploys. `deploy.yml` rejects any other
  ref before the Cloudflare token is in scope, and the auto-push git hook in
  [docs/deploy.md](docs/deploy.md) only pushes `main`.

### Preview deployments

**Deployment**

- Every branch now gets its own preview URL. Pushing any branch other than
  `main` builds a preview at
  `<branch>-branderrna-hockey-liga.hockey-liga.workers.dev`, stable across
  commits, so a change can be seen running before it is merged. These are
  uploaded Worker _versions_, never deployed — production is untouched.
- Cloudflare Workers Builds was reconnected for this, deliberately and
  differently from before: a build command is now set (which is what stops
  Wrangler's setup wizard from scaffolding a rogue config), and the production
  branch deploy command is a no-op so GitHub Actions keeps sole ownership of
  production. Verified end to end on a throwaway branch: the preview served the
  change while `sghockeyliga.com` did not.
- Because that configuration lives in the Cloudflare dashboard rather than in
  this repository, it is transcribed in [docs/deploy.md](docs/deploy.md) along
  with which fields are load-bearing and why.

### A duplicate deployment removed

**Infrastructure**

- Removed a duplicate deployment nobody knew about. Cloudflare Workers Builds
  had been connected to this repo since 2026-08-22 and was quietly deploying
  every `main` push to a second Worker named `hockey-liga`, live at
  `hockey-liga.hockey-liga.workers.dev`. Only its non-`main` builds failed
  visibly, which is why it read as "broken CI" rather than a parallel deploy.
  `sghockeyliga.com` was never affected. Integration disconnected; see
  [docs/deploy.md](docs/deploy.md) for how `wrangler deploy` produces this
  silently while `wrangler versions upload` fails loudly.

### Deploy triggers and shared checks

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

### Fixtures refresh never triggered a deploy (2026-09-01)

**Infrastructure**

- Fixed a real gap in the fixtures-refresh pipeline: its commits used the
  workflow's default `GITHUB_TOKEN`, which GitHub's anti-loop protection
  excludes from triggering other workflows' `on: push` — so `deploy.yml`
  was silently never firing after a scheduled/manual refresh. The site
  kept serving stale data with no error anywhere until something else
  happened to push and trigger a real deploy. `refresh-fixtures.yml` now
  explicitly triggers `deploy.yml` via `gh workflow run` after a
  successful commit. See [docs/deploy.md](docs/deploy.md).

## 0.4.0 — 2026-08-23

**Infrastructure**

- Added a staging environment: pushes to a `staging` branch now deploy to a
  separate Cloudflare Worker (`branderrna-hockey-liga-staging`) for trying
  out changes before they reach production. See [docs/deploy.md](docs/deploy.md).
- Fixtures-refresh schedule changed from once weekly (Wednesdays) to twice
  weekly — Sundays and Mondays at 03:00 Singapore time.

## 0.3.0 — 2026-08-20

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

## 0.2.0 and earlier

Predate this changelog. `0.2.0` (2026-08-16) added the three concurrent ligas
and the About page; `0.1.0` (2026-08-10) was the first schedule and results
pages. Both are reconstructed from `git log` and appear in
[`src/data/versions.ts`](src/data/versions.ts) with visitor-facing notes only.
