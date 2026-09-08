import assert from "node:assert/strict";

import { parseArchiveCsv } from "../src/data/archive-parser.ts";
import { ARCHIVE_SEASON } from "../src/data/archive.ts";
import { bracketsOf, isKnockoutRound, poolsOf } from "../src/data/competition.ts";
import type { ArchiveDivisionId } from "../src/data/archive.ts";

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

/** Round 2 of the Super liga was played as two pools; nothing else was. */
const expectedPools = {
  super: { round: "2", labels: ["Top 5", "Bottom 5"], sizes: [5, 5] },
} as const;

/**
 * The shape each bracket chart has to keep: a championship tree that narrows
 * 4-2-1, and the losers' brackets beside it. A stage count that moves means
 * the source rows changed, and the connectors would be drawn from a guess.
 */
const expectedBrackets: Partial<Record<ArchiveDivisionId, [string, number[]][]>> = {
  social: [
    ["Championship", [3, 4, 2, 2]],
    ["5th–8th place", [2, 2]],
    ["9th–11th place", [3]],
  ],
  "u14-boys": [
    ["Championship", [4, 2, 2]],
    ["5th–8th place", [2, 2]],
  ],
  "u14-girls": [
    ["Championship", [2, 2, 2]],
    ["5th–6th place", [1]],
  ],
};

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

  // The site drops a row it cannot read and says so on the page. This check is
  // the other half of that: it fails on the same rows, so a broken edit to the
  // Sheet is reported here instead of only being visible to whoever opens it.
  const { dataset, issues } = parseArchiveCsv(await response.text());
  assert.deepEqual(issues, [], "rows in the archive Sheet could not be read");
  const { matches, teams } = dataset;
  assert.equal(matches.length, 322);
  assert.equal(teams.length, 43);

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
  assert.equal(matches.filter((match) => match.round && isKnockoutRound(match.round)).length, 53);
  assert.equal(matches.filter((match) => match.round === "PLAY-IN").length, 3);

  for (const [divisionId, expected] of Object.entries(expectedPools)) {
    const pools = poolsOf(dataset, divisionId as ArchiveDivisionId, expected.round);
    assert.deepEqual(
      pools.map((pool) => pool.label),
      expected.labels,
      `unexpected ${divisionId} round ${expected.round} pools`,
    );
    assert.deepEqual(
      pools.map((pool) => pool.teamIds.length),
      expected.sizes,
      `unexpected ${divisionId} pool sizes`,
    );
  }

  for (const divisionId of ["super", "veterans", "social", "u14-boys", "u14-girls"] as const) {
    assert.deepEqual(
      bracketsOf(dataset, divisionId).map((bracket) => [
        bracket.title,
        bracket.columns.map((column) => column.slots.length),
      ]),
      expectedBrackets[divisionId] ?? [],
      `unexpected ${divisionId} bracket shape`,
    );
  }

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
    `Validated ${ARCHIVE_SEASON.label} Sheet source: every row readable, ${matches.length} matches, ${teams.length} teams, 2 shootout results, 3 play-ins and every pool and bracket shape.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
