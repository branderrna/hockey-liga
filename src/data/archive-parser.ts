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

/** Parse the immutable completed-season Sheet tab into the shared view model. */
export function parseArchiveCsv(csv: string): CompetitionDataset {
  const parsed = parseFixtureRows(parseCsv(csv), {
    seasonYear: ARCHIVE_SEASON.year,
    categoryToDivision: CATEGORY_TO_DIVISION,
    resolveTeamId: teamIdFor,
  });

  if (parsed.unresolvedTeams.size > 0) {
    throw new Error(
      `Archive source contains unresolved teams: ${[...parsed.unresolvedTeams].join(", ")}`,
    );
  }
  if (parsed.skippedRows.length > 0) {
    throw new Error(`Archive source contains invalid rows:\n${parsed.skippedRows.join("\n")}`);
  }

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
    teams: [...teams.values()],
    matches: parsed.matches.sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.time.localeCompare(b.time) ||
        a.no - b.no ||
        a.id.localeCompare(b.id),
    ),
  };
}
