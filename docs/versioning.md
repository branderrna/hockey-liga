# Versioning

The site carries a version number, shown in the footer of every page. Clicking it opens the
release history.

## Where it lives

| Record                           | Audience              | File                                              |
| -------------------------------- | --------------------- | ------------------------------------------------- |
| Release history shown in the app | Visitors              | [`src/data/versions.ts`](../src/data/versions.ts) |
| Engineering log                  | Whoever works on this | [`CHANGELOG.md`](../CHANGELOG.md)                 |

They share one numbering, and `npm test` fails if the newest version in `versions.ts` is not the
version on the topmost `CHANGELOG.md` heading. That check exists because two hand-kept records
drift silently otherwise.

They are not duplicates. `versions.ts` says what changed on the site in terms a visitor would
recognise; `CHANGELOG.md` records the reasoning, the deployment plumbing, and the things that were
wrong — none of which a hockey visitor has any use for. A release usually has one entry in each,
worded differently.

## The scheme

`0.MINOR.PATCH`.

- **MINOR** — the site can do something it could not do before, or does something visibly
  differently. A new view, a rebuilt navigation, a new page.
- **PATCH** — a fix or visual polish to something that already existed.
- **No bump** for a fixtures/results refresh, or for infrastructure work with no visible effect.
  Refreshes are data: the footer's "Results updated" stamp is what covers them, and they happen
  several times a week. Giving them versions would bury the releases that matter.

There is no `1.0.0` planned. The leading `0` says the site is still moving; promote it when that
stops being true, not on a schedule.

## Releasing

1. Add an entry at the top of `releases` in `src/data/versions.ts` — version, date, and one line
   per change, written for a visitor.
2. Add the matching `## <version> — <date>` section to `CHANGELOG.md`.
3. Run `npm test`. It checks the numbering agrees, the dates are real, and the list is ordered
   newest-first.

The version in the footer comes from `releases[0]`, so there is nothing else to bump — no
`package.json` version, no git tag.

## Retroactive numbering

Versions `0.1.0` through `0.5.1` were assigned after the fact, in `0.6.0`, by reading `git log` and
the existing dated `CHANGELOG.md` sections. The dates are the dates of the work, not of the
numbering. They are approximate at the boundaries — several of them cover a day's worth of commits
rather than a single one — and they are not worth revising.
