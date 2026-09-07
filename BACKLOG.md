# Backlog

Work the site is deliberately shaped for but that cannot be finished yet,
usually because the data does not exist. Each entry says what is blocking it
and what to change when the block clears.

## Completed 2026/1 ligas

Super, Veterans, Social, Youth U14 Boys and Youth U14 Girls are completed ligas.
Their immutable fixtures and teams remain in the `2026/1` Google Sheet tab and are
loaded server-side when a completed liga is opened. They use the same `/liga/<slug>`
routes as ongoing ligas and appear under `COMPLETED LIGAS` in the sidebar.

The frontend does not contain a generated archive snapshot. To add another
completed season, add its source-tab/catalogue metadata and a server-side parser
boundary; do not copy its fixture rows into `src/data` or the current-season
refresh workflow.

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
