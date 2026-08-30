# Changelog

Notable changes to the site, kept by hand alongside the automated
fixtures/results refresh (which does not get its own entry here every run —
see [docs/fixtures-refresh.md](docs/fixtures-refresh.md)).

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
