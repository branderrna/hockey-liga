# Notes column grammar

The Notes column of the league Google Sheet is read by two audiences: the public
(the site prints it verbatim next to a fixture) and the parser
([`src/data/fixture-parser.ts`](../src/data/fixture-parser.ts), which recovers
play-in rounds from it). Free text serves neither well. This is the fixed
grammar both can rely on.

Scope: the live season tab is edited to conform. Completed season tabs are
report-only — see [Applying this to a completed season](#applying-this-to-a-completed-season).
The live tab is whichever one `HELPER!B1` names; nothing here hardcodes a season.

## Shape

A note is one or more **clauses**, separated by `. ` (period + space), in a fixed
order, with no trailing period.

```
<provenance>. <schedule>. <time>. <venue>. <play state>. <reason>. <result>
```

One fact per clause. Omit any clause that does not apply. Most notes are one
clause.

## Clause templates

| Order | Clause                                                           | Template                                            | Example                                |
| ----- | ---------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------- |
| 1     | Seed pairing                                                     | `<n>th vs <n>th`, each seed optionally `of <ROUND>` | `6th vs 7th`, `6th of R1 vs 7th of R1` |
| 1     | Bracket source                                                   | `<source> vs <source>`                              | `Winner of QF1 vs Loser of SF2`        |
| 2     | Moved out (this row is the `PP` original)                        | `Moved to <date> <time>`                            | `Moved to 13 Oct 17:00`                |
| 2     | Moved in (this row is the replacement)                           | `Moved from <date> <time>`                          | `Moved from 2 Aug 15:00`               |
| 3     | Time change, same date                                           | `Time changed from <time> to <time>`                | `Time changed from 18:00 to 16:00`     |
| 4     | Venue change, same date                                          | `Venue changed from <VENUE> to <VENUE>`             | `Venue changed from CCAB to DELTA`     |
| 5     | Stopped mid-game (this row is the `PP` original)                 | `Suspended at <n> min (<h>-<a>)`                    | `Suspended at 9 min (1-0)`             |
| 5     | Stopped mid-game, minute unknown (this row is the `PP` original) | `Suspended midway (<h>-<a>)`                        | `Suspended midway (1-0)`               |
| 5     | Remainder played (this row is the replacement)                   | `Resumed from <date>`                               | `Resumed from 2 Aug`                   |
| 6     | Reason                                                           | `Reason: <reason>`                                  | `Reason: haze`                         |
| 7     | Result qualifier                                                 | `Walkover to <TEAM>`                                | `Walkover to ORA`                      |

`<source>` in a bracket clause is a pattern, not a fixed list:

- `<n>th of <ROUND>` — a seed carried out of a round, e.g. `3rd of R1`
- `Winner of <ROUND>` / `Loser of <ROUND>` — e.g. `Winner of SF1`, `Loser of QF2`
- `Winner of <n>th/<n>th play-in` / `Loser of <n>th/<n>th play-in`

`<ROUND>` is a round code: `R1`, `QF1`, `SF2`, `FINAL`. `R<n>` is the shorthand
for numbered round `<n>`. Where the round a seed came out of is not recoverable,
bare `<n>th` is the legal short form.

`<reason>` is a closed list: `haze`, `lightning`, `weather`, `pitch unavailable`,
`team withdrawal`, `insufficient players`, or `other: <free text>`.

## Atoms

| Atom         | Format                                              | Good                 | Bad                                  |
| ------------ | --------------------------------------------------- | -------------------- | ------------------------------------ |
| Date         | `D MMM`, no ordinal suffix, no year, 3-letter month | `2 Aug`, `13 Oct`    | `13th Oct`, `23rd August`, `02/08`   |
| Time         | `HH:MM`, 24-hour                                    | `18:00`, `09:00`     | `6pm`, `5 pm`, `1800`                |
| Score        | `<h>-<a>`, no spaces                                | `1-0`                | `1 - 0`, `1–0`                       |
| Minutes      | elapsed, `<n> min`                                  | `9 min`, `24 min`    | `26 minutes left to play`, `24 mins` |
| Team / venue | the code as it appears in its own column, uppercase | `ORA`, `CCAB`        | `Ora`, `Delta`                       |
| Round        | uppercase, no space                                 | `R1`, `QF1`, `FINAL` | `qf1`, `QF 1`, `R 1`                 |

Elapsed, never remaining. **Every hockey liga game is 50 minutes**, so a note
recording time remaining converts by subtraction: `26 minutes left to play`
becomes `Suspended at 24 min`. If the note gives neither an elapsed nor a
remaining minute, write `Suspended midway (<h>-<a>)` — never invent a number.

## Hard rules

1. **Never write "postponed" or "postpone".** The `PP` column says that. The
   parser treats a note containing `postpon` without a matching `PP` as a source
   conflict and fails the refresh, so the word is a live foot-gun. Use
   `Reason: haze`, not `Postponed due to haze`.
2. **Provenance clause first, and alone in its clause.** `6th vs 7th` must be the
   whole clause. Appending to it — `6th vs 8th. Timing changed` is fine,
   `6th vs 8th, timing changed` is not — because the parser's seed-pair match is
   anchored to a whole clause.
3. **Sentence case.** Only team codes, venue codes and round codes are uppercase.
   `Venue changed`, not `Venue Changed`.
4. **`vs`, lowercase, no period.** Not `Vs`, `vs.`, or `v`.
5. **A seed-pairing clause carries only the pairing.** `6th vs 7th` and
   `6th of R1 vs 7th of R1` both parse, so a seed may name its round here just as
   it does in a bracket source. Nothing else fits inside the clause —
   `6th vs 7th, rescheduled` does not parse, because the match is anchored to the
   whole clause. The round qualifier is read and discarded: pairings match on the
   seed numbers alone, since the play-in reference pointing back at the row
   (`6th/7th play-in`) names no round.
6. **Always keep the provenance clause.** It looks redundant while `Home` and
   `Away` still read `6TH` and `8TH`, but those cells get overwritten with the
   real team names as soon as the seeding is known. The note is then the only
   surviving record that this fixture was the 6th-vs-8th game. Write it when the
   fixture is created, and never delete it when the teams are filled in.

## Worked rewrites

| Now                                                                                      | Should be                                                            |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `Game shifted to 13th Oct, 5pm`                                                          | `Moved to 13 Oct 17:00`                                              |
| `Game shifted from 2nd Aug, 3pm.`                                                        | `Moved from 2 Aug 15:00`                                             |
| `Game postponed to 11th Oct`                                                             | `Moved to 11 Oct`                                                    |
| `Game shiftefd from 31st Oct`                                                            | `Moved from 31 Oct`                                                  |
| `Timing changed from 6pm to 4pm`                                                         | `Time changed from 18:00 to 16:00`                                   |
| `Timing changed, venue remains`                                                          | `Time changed`                                                       |
| `Venue Changed, timinmg remains`                                                         | `Venue changed`                                                      |
| `Postponed due to haze`                                                                  | `Reason: haze`                                                       |
| `Timing changed to 8pm, Postponed due to haze`                                           | `Time changed to 20:00. Reason: haze`                                |
| `15 min played`                                                                          | `Suspended at 15 min`                                                |
| `0 - 1, 26 minutes left to play`                                                         | `Suspended at 24 min (0-1)`                                          |
| `Remaining 26 minutes played`                                                            | `Resumed from 12 Apr`                                                |
| `1-0 before postpone`                                                                    | `Suspended midway (1-0)`                                             |
| `9 min played, lightning alert, Game shifted to 23rd August, 6pm (1-0 before Postponed)` | `Moved to 23 Aug 18:00. Suspended at 9 min (1-0). Reason: lightning` |
| `6th vs 8th. Timing changed, venue remains`                                              | `6th vs 8th. Time changed`                                           |
| `Walkover`                                                                               | `Walkover to ORA`                                                    |
| `Winner of Semi Final 1 vs Winner of Semi Final 2`                                       | `Winner of SF1 vs Winner of SF2`                                     |
| `3rd vs Winner of 6th/7th play-in`                                                       | `3rd of R1 vs Winner of 6th/7th play-in`                             |

`Time changed to <time>` and `Moved to <date>` (without a time) are legal short
forms of their templates when the from-value or the time is genuinely unknown.

## Applying this to a completed season

A completed tab is the archive's source of truth and is read live by the site
with no build gate. Its notes are load-bearing: `resolvePlayInRounds` recovers
play-in rounds from `6th vs 7th` and `Winner of 6th/7th play-in`, and both
recoveries are contract-tested.

So: report violations on those tabs, do not edit them as part of a style pass. If
a note there is edited anyway, run

```sh
npm run validate-archive-fixtures
```

before considering the edit done.

## How the parser reads a note

`resolvePlayInRounds` in
[`src/data/fixture-parser.ts`](../src/data/fixture-parser.ts) matches the seed
pairing against the note's **first clause**, so hard rules 2 and 5 hold together:
`6th vs 8th. Time changed` is still recognised as the 6th-vs-8th game.

That used to be anchored to the whole note, which would have silently dropped the
pairing the first time an operational clause was appended to a seeded fixture. The
case is covered by `scripts/fixture-parser.test.ts`.

### What the parser reads, and what it ignores

| Clause                                                             | Parser                                            |
| ------------------------------------------------------------------ | ------------------------------------------------- |
| `<n>th vs <n>th` as the **first** clause, round qualifier optional | **Load-bearing** — resolves that row to `PLAY-IN` |
| `<n>th/<n>th play-in`, anywhere in the note                        | **Load-bearing** — marks that pair as referenced  |
| every other clause                                                 | ignored — human-facing text only                  |

So `Winner of SF1 vs Winner of SF2` is never parsed: reformatting a bracket-source
clause is cosmetic and safe. The two load-bearing forms decide which rows leave a
round's table and join the bracket, so changing one changes the site's standings.
Rewrite those only deliberately, and run the contract tests after.
