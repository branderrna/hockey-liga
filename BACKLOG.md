# Backlog

Work the site is deliberately shaped for but that cannot be finished yet,
usually because the data does not exist. Each entry says what is blocking it
and what to change when the block clears.

## Activate the five dormant ligas

Super, Veterans, Social, Youth U14 Boys and Youth U14 Girls appear in the
sidebar and on the landing page, but their pages render a placeholder and
they are absent from the "My liga" picker — by design, since the picker only
offers ligas that have fixtures behind them.

**Blocked on:** historical import and competition-format reconciliation, not missing
source data. The workbook already contains `Super`, `Veterans`, `Social` and
`U14 Fixtures` tabs. The individual U14 tabs overlap with the combined tab, so
an authoritative source must be agreed before importing. Knockouts, placement
games, shootouts and postponed attempts must not be treated as ordinary league
results.

The steps below describe the existing single-season importer. They are not a
safe historical migration by themselves; season-aware storage and stage-aware
standings are prerequisites for bringing earlier results onto the site.

**To activate one:**

1. Add its `Category` value to `CATEGORY_TO_DIVISION` in
   [`scripts/refresh-fixtures.ts`](scripts/refresh-fixtures.ts), mapped to a
   new division id.
2. Add that id to the `DivisionId` union in
   [`src/data/types.ts`](src/data/types.ts).
3. Add its teams to `teams` in [`src/data/league.ts`](src/data/league.ts),
   using the `<division>--<slug>` id convention.
4. In the same file, change the liga's entry in `ligas` from
   `status: "upcoming", divisionId: null` to
   `status: "active", divisionId: "<the new id>"`.
5. Run `npm run refresh-fixtures`, then `npm test` to validate the result.

Nothing in the UI needs touching. The sidebar, the landing cards, the liga
routes and the "My liga" picker are all derived from `activeLigas`, so the
liga starts appearing everywhere the moment its status flips.

## Past seasons

`/archive` is a placeholder reached from a low-key link in the sidebar and on
the landing page.

**Blocked on:** a season-aware importer and verified historical competition
rules. Earlier fixtures exist in the workbook; historical tables were excluded
from the initial inspection and have not been verified.

The existing `SEASON`, `ligas` and generated fixtures assume one season. A
[TEST-tab Sheets helper](scripts/sheet-helper/README.md) is being tried first
for season/liga/team setup. Actual in-Sheets acceptance testing is blocked by
first-run Google authorization. Adding sidebar permissions to the existing project
can require the original trigger creator to reauthorize; keep the live project at
its original source until that can be completed. The helper does not import
history, calculate standings or connect to the website. Production migration
remains a separate approved task.

## Score at abandonment for postponed games

The sheet has `PP` and `PP Score` columns that
[`scripts/refresh-fixtures.ts`](scripts/refresh-fixtures.ts) does not read.
For an abandoned game the sheet records `Score = PP` and, separately,
`PP Score = 1-0` — the score when play stopped.

Right now that only survives as prose inside the note ("1-0 before
Postponed"), so it cannot be displayed distinctly or reasoned about. Reading
those columns into the `Match` type would let the schedule show the
abandonment score without relying on how the note happens to be worded.

Not urgent: no standings depend on it, since abandoned games are excluded
from `isPlayed`.

## Unresolved Premier team names

Nine Premier fixtures name their sides by finishing position — `1ST` through
`9TH` — rather than by club. They are placeholders for games seeded off an
earlier stage. 17 matches currently have at least one such side.

The refresh script keeps them as text (`homeId` / `awayId` are `null`) and
warns on each run, which is the correct behaviour: the fixture still shows,
but it is not attributed to a team, so it cannot skew a standings row.

**Blocked on:** the sheet only names the clubs once the seeding stage is
decided. Nothing to change in code — the names resolve on the next refresh
once the sheet is updated.

## Team logos

The schedule and standings show team names only. Crests were mentioned as
something to supply later; the row layouts leave room for a small mark beside
the name in both views.

**Blocked on:** no logo assets yet.
