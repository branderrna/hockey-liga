import { parseCsv, parseFixtureRows } from "./fixture-parser.ts";
import { ARCHIVE_SEASON } from "./archive.ts";
import type { CompetitionDataset } from "./competition.ts";
import type { DivisionId, Team } from "./types.ts";

const CATEGORY_TO_DIVISION: Record<string, DivisionId> = {
  SOCIAL: "social",
  SUPER: "super",
  VETERANS: "veterans",
  "U14 BOYS": "u14-boys",
  "U14 GIRLS": "u14-girls",
};

function teamIdFor(divisionId: DivisionId, name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${divisionId}--${slug}`;
}

export type ArchiveParse = {
  dataset: CompetitionDataset;
  /** Rows the source could not be read from, in sheet order, for display. */
  issues: string[];
};

/**
 * Parse the completed-season Sheet tab into the shared view model.
 *
 * A row this cannot read is dropped and reported rather than thrown, because
 * nothing stands between an edit to that tab and the live site: it is read on
 * request, with no refresh script, no test run and no deploy in between. One
 * mistyped score would otherwise take all five completed ligas down at once.
 * The rows that survive are still trustworthy — a row is only ever skipped
 * whole, never half-read — so the season renders minus what was unreadable,
 * and the page says how much is missing.
 *
 * A header that no longer names Home, Score and Away still throws, from
 * `parseFixtureRows`. That is not one bad row: it means the tab is not a
 * fixture list any more, and rendering an empty season would be a worse lie
 * than failing.
 */
export function parseArchiveCsv(csv: string): ArchiveParse {
  const parsed = parseFixtureRows(parseCsv(csv), {
    seasonYear: ARCHIVE_SEASON.year,
    categoryToDivision: CATEGORY_TO_DIVISION,
    resolveTeamId: teamIdFor,
    rowConflicts: "skip",
  });

  const issues = [
    ...parsed.skippedRows,
    ...[...parsed.unresolvedTeams].map((team) => `unmatched team name: ${team}`),
  ];

  const teams = new Map<string, Team>();
  for (const match of parsed.matches) {
    for (const [id, name] of [
      [match.homeId, match.homeName],
      [match.awayId, match.awayName],
    ] as const) {
      if (!id || teams.has(id)) continue;
      teams.set(id, {
        id,
        divisionId: match.divisionId,
        name,
        shirt: null,
        shorts: null,
        socks: null,
        unavailable: null,
      });
    }
  }

  return {
    dataset: {
      teams: [...teams.values()],
      matches: parsed.matches.sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.time.localeCompare(b.time) ||
          a.no - b.no ||
          a.id.localeCompare(b.id),
      ),
    },
    issues,
  };
}
