# Round, shootouts, and 2026/1 archive implementation plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Import the complete public `2026/1` workbook tab into the Hockey Liga site, preserve the live `2026/2` refresh path, and expose round-aware schedules, standings, team views, shootout scorelines, and CSS knockout brackets.

**Architecture:** Keep `2026/2` as the live generated fixture source and add a separate, committed `2026/1` generated snapshot because the older tab is complete and does not need automation. Extract competition calculations and the liga page UI so current and archived competitions use the same round/table/bracket behavior without duplicating pages. The archive index will select a `2026/1` liga and render the shared competition view.

**Tech Stack:** React 19, TanStack Start/Router, TypeScript, Tailwind CSS 4, Node built-in CSV parsing, Google Sheets public CSV export.

---

## Evidence and decisions

- The live sheet is the `2026/2` tab, GID `9556364`; the complete archive tab is `2026/1`, GID `896089478`. The public workbook currently exposes both tabs.
- `2026/2` has `No.`, `Day & Date`, `Venue`, `Time`, `Category`, `Home`, `Score`, `Away`, `PP`, `PP Score`, `Notes`.
- `2026/1` adds `Round` before `Home` and `Shootout Score` after `Away`, and contains `SOCIAL`, `SUPER`, `VETERANS`, `U14 BOYS`, and `U14 GIRLS` data from 7 February to 13 June 2026.
- The archive has numeric round-robin values (`1`, `2`) plus `QF1`–`QF4`, `SF1`–`SF4`, `FINAL`, and placing rounds. Several postponed knockout rows are followed by a played row with the same round and match number; the bracket must collapse those attempts to one logical match while the schedule may retain the audit trail.
- The current `sheet-refresh-trigger.gs` watches `CURRENT`, but the actual public workbook tab is `2026/2`. Update the trigger constant and docs to prevent live score edits from being ignored. The archive must not be added to the live trigger.
- Do not edit `src/routeTree.gen.ts` or generated fixture files by hand. Add generator/import scripts and run them to create committed data.

## Acceptance criteria

1. A live refresh accepts sheets with or without `Round` and `Shootout Score`; it normalizes exported dates such as `Sunday,_02 Aug`, parses both score columns into validated numeric pairs, and leaves absent optional columns compatible with the current tab.
2. The committed archive contains the complete accepted `2026/1` rows, all five categories, round values, and both recorded shootouts. Repeated header rows and malformed rows are rejected or skipped with a clear warning rather than becoming fixtures.
3. Schedule pages show a general `Round N` label for round-robin blocks. Knockout fixture rows show `Quarter-final N`, `Semi-final N`, `Final`, or placing labels centered above the fixture row. Played shootouts render as a parenthesized scoreline below the full-time score and above notes.
4. Tables expose a round switcher only when a competition has multiple numeric rounds. The selected table uses only that round and never counts knockout matches; current competitions without round data keep their existing table behavior.
5. Competitions with knockout rounds render a responsive, accessible CSS bracket with QF/SF/final pathways and the `Final` and `3rd/4th` matches converging in the central area. It uses live text and borders/connectors, not a raster image, and handles four-team and eight-team brackets.
6. The My Team view uses the same round selection and a compact bracket/standings treatment, with team fixtures and shootouts still visible.
7. `/archive` lists `2026/1` and its imported ligas; selecting one opens schedule, table, bracket, and team view behavior. Current `/liga/$slug` behavior and the live refresh workflow remain intact.
8. `npm test`, lint, formatting, TypeScript, Knip, build, and target-viewport browser QA pass, with no production deployment or live-data mutation performed.

---

## Phased subtasks

### Phase 1 — parser and data contracts

1. Extend `src/data/types.ts` with archive division IDs and typed shootout pair fields; keep optional round values compatible with old generated data while new generated rows use explicit nulls where appropriate.
2. Extract reusable fixture parsing into `scripts/fixture-parser.ts` (CSV parser, header lookup, date/time normalization, full-time score parsing, shootout parsing, round cleanup, stable IDs) and add unit coverage for optional columns, underscores, malformed scores, `PP`, and duplicate attempts.
3. Refactor `scripts/refresh-fixtures.ts` to use the parser for GID `9556364`, preserve its current category map and output, and parse optional `Round`/`Shootout Score` when they appear later.
4. Add `scripts/import-2026-1.ts` using GID `896089478`, the archive date bounds/category map, and a separate generated output; generate archive teams from the accepted fixture rows with null kit metadata.
5. Add `scripts/validate-archive-fixtures.ts` (or extend validation) to assert archive date bounds, category/team membership, pairwise scores, duplicate IDs, and the two shootouts; run the import and record the generated snapshot.

### Phase 2 — competition calculations

6. Add `src/data/competition.ts` with dataset-agnostic `matchesOf`, `teamsOf`, `playedOf`, `standings`, numeric round discovery, knockout-round classification, winner resolution using shootouts, and logical knockout-attempt collapsing.
7. Keep `src/data/league.ts`’s public current-season helpers as thin wrappers over the shared functions, so existing routes and validation remain stable.
8. Add `src/data/archive.ts` with `2026/1` metadata, five archived liga definitions, generated teams/matches, and wrapper helpers. Keep archive configuration separate from the live season and do not add it to the refresh workflow.

### Phase 3 — shared schedule/table/team UI

9. Extract the current liga page body from `src/routes/liga.$slug.tsx` into a shared `src/components/competition-page.tsx` accepting season, liga, teams, matches, and selected team data; preserve the current header, weekend selector, and URL view tabs.
10. Update round formatting in `src/data/round.ts` and its tests for `Round N`, hyphenated `Quarter-final N`/`Semi-final N`, `Final`, and placing labels; use knockout classification to place labels above only knockout rows and show a general round caption for round-robin schedules.
11. Update `MatchRow`/`Score` to render structured shootout scores in parentheses below full time and before notes, including in the compact My Team fixture list; retain postponed and replay styling.
12. Add a reusable round switcher above standings when numeric rounds > 1; pass the selected round into table calculations and keep the full table layout unchanged otherwise.
13. Add `src/components/knockout-bracket.tsx` and CSS utilities in `src/styles.css` for responsive text cards, central final/3rd–4th placement, connectors, collapsed postponed attempts, shootout scorelines, and no-raster rendering.
14. Add the compact bracket excerpt to My Team, keeping the selected team’s standings row and fixture list prominent and avoiding a second full-width table.

### Phase 4 — archive and live automation integration

15. Replace `src/routes/archive.tsx` placeholder content with a `2026/1` archive index and liga selector that renders the shared competition page for each archived category; provide an archive team selection path so My Team behavior is usable without changing the current season preference.
16. Update `scripts/sheet-refresh-trigger.gs` and `docs/fixtures-refresh.md` to watch/document `2026/2` while explicitly leaving `2026/1` static. Add tests for the trigger’s watched-tab guard if needed.
17. Update release notes in `src/data/versions.ts` and `CHANGELOG.md` for the visible archive/competition UI change; do not version a fixture-only snapshot separately.

### Phase 5 — verification and handoff

18. Run focused parser/round/archive tests, then the repository gate: `npm test`, `npm run lint`, `npm run format:check`, `npx tsc --noEmit`, `npx --no-install knip --include files,exports,dependencies,types`, and `npm run build`.
19. Run the app locally, inspect `/liga/women`, an archived multi-round liga, an archived knockout liga, and My Team at a phone viewport and a desktop viewport; verify no hydration/console errors and that the final/3rd–4th bracket remains readable and scrollable.
20. Review `git diff --check`, generated-file provenance, untracked files, and the final diff. Commit the focused changes on the current feature branch only; do not merge, push, or deploy without explicit approval.

## Likely files

- Modify: `src/data/types.ts`, `src/data/round.ts`, `src/data/league.ts`, `src/routes/liga.$slug.tsx`, `src/routes/archive.tsx`, `src/styles.css`, `scripts/refresh-fixtures.ts`, `scripts/sheet-refresh-trigger.gs`, `docs/fixtures-refresh.md`, `src/data/versions.ts`, `CHANGELOG.md`, and relevant validators/tests.
- Create: `src/data/competition.ts`, `src/data/archive.ts`, `src/components/competition-page.tsx`, `src/components/knockout-bracket.tsx`, `scripts/fixture-parser.ts`, `scripts/import-2026-1.ts`, `scripts/validate-archive-fixtures.ts`, and generated `src/data/matches.20261.generated.ts` / archive team data as appropriate.
- Do not modify: `src/routeTree.gen.ts` by hand, `.agents/`, `.codex/`, or unrelated sheet-helper files.

## Risks and trade-offs

- The live and archive sheets do not share the same columns or date formatting. A single parser with optional columns is safer than maintaining two subtly divergent parsers.
- The archive includes postponed attempts with repeated match numbers. Treating every row as a bracket card would show duplicate matches; collapsing only the bracket view preserves source history while presenting the competition correctly.
- Numeric round 2 contains placement/seeded games in some ligas. It remains a selectable numeric table because the sheet explicitly labels it as a round; knockout tokens are excluded from standings. If the competition organiser wants a different points policy for a particular round, that is a data-rule decision rather than something to infer silently.
- The archive is a committed snapshot. It should not be watched by the live Apps Script trigger, and future historical corrections require an explicit re-import.
- Visual QA is required at the actual phone and desktop viewports because bracket overflow and compact My Team layouts cannot be proved by TypeScript or unit tests.
