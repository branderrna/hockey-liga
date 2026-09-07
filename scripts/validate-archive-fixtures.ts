import assert from "node:assert/strict";

import { parseArchiveCsv } from "../src/data/archive-parser.ts";
import { ARCHIVE_SEASON } from "../src/data/archive.ts";
import { isKnockoutRound } from "../src/data/competition.ts";

const SHEET_ID = "1xD2Yc5dJAlNe82Zps3b3bpT23XGXDl5hlOkGDum3vDA";
const GID = "896089478"; // immutable "2026/1" tab
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const expectedDivisionCounts = {
  super: 85,
  veterans: 70,
  social: 94,
  "u14-boys": 49,
  "u14-girls": 24,
} as const;

const expectedShootouts = [
  {
    id: "m-2026-05-16-1900-delta-barkerites-orient-sit-oldham",
    homeGoals: 2,
    awayGoals: 2,
    shootoutHomeGoals: 2,
    shootoutAwayGoals: 1,
  },
  {
    id: "m-2026-06-13-1800-ccab-lion-city-hockey-flickers-varsity-sports-club",
    homeGoals: 2,
    awayGoals: 2,
    shootoutHomeGoals: 4,
    shootoutAwayGoals: 5,
  },
];

async function main() {
  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${ARCHIVE_SEASON.label} sheet: ${response.status}`);
  }

  const dataset = parseArchiveCsv(await response.text());
  const { matches, teams } = dataset;
  assert.equal(matches.length, 322);
  assert.equal(teams.length, 44);

  for (const match of matches) {
    const hasShootoutHome = match.shootoutHomeGoals != null;
    const hasShootoutAway = match.shootoutAwayGoals != null;
    assert.equal(hasShootoutHome, hasShootoutAway, `shootout fields must be paired: ${match.id}`);
    if (!hasShootoutHome || !hasShootoutAway) continue;
    assert.equal(match.homeGoals, match.awayGoals, `shootout match must be tied: ${match.id}`);
    assert.ok(!match.postponed, `shootout match cannot be postponed: ${match.id}`);
    assert.notEqual(
      match.shootoutHomeGoals,
      match.shootoutAwayGoals,
      `shootout match must have a winner: ${match.id}`,
    );
  }

  for (const [divisionId, expectedCount] of Object.entries(expectedDivisionCounts)) {
    assert.equal(
      matches.filter((match) => match.divisionId === divisionId).length,
      expectedCount,
      `unexpected ${divisionId} match count`,
    );
  }
  assert.equal(matches.filter((match) => match.round && isKnockoutRound(match.round)).length, 50);

  assert.deepEqual(
    matches
      .filter((match) => match.shootoutHomeGoals != null)
      .map((match) => ({
        id: match.id,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
        shootoutHomeGoals: match.shootoutHomeGoals,
        shootoutAwayGoals: match.shootoutAwayGoals,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    [...expectedShootouts].sort((a, b) => a.id.localeCompare(b.id)),
    "2026/1 source shootout records changed; inspect the Sheet before updating this contract",
  );

  console.log(
    `Validated ${ARCHIVE_SEASON.label} Sheet source: ${matches.length} matches, ${teams.length} teams, and 2 shootout results.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
