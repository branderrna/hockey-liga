import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { divisions, SEASON, standings, teams } from "../src/data/league.ts";
import { fixturesUpdatedAt, matches } from "../src/data/matches.generated.ts";
import { CURRENT_VERSION, releases } from "../src/data/versions.ts";
import type { DivisionId } from "../src/data/types.ts";

const divisionIds = new Set(divisions.map((division) => division.id));
const teamById = new Map(teams.map((team) => [team.id, team]));
const seenMatchIds = new Set<string>();
const seenTeamIds = new Set<string>();
const seenDivisionIds = new Set<string>();
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const isCalendarDate = (value: string) => {
  if (!datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(`${value}T`);
};

assert.equal(isCalendarDate("2026-02-28"), true, "valid calendar date rejected");
assert.equal(isCalendarDate("2026-02-31"), false, "impossible calendar date accepted");
assert.ok(isCalendarDate(SEASON.start), `invalid season start: ${SEASON.start}`);
assert.ok(isCalendarDate(SEASON.end), `invalid season end: ${SEASON.end}`);
assert.ok(SEASON.start <= SEASON.end, "season start is after season end");

const updatedAt = new Date(fixturesUpdatedAt);
assert.ok(
  !Number.isNaN(updatedAt.getTime()),
  `fixturesUpdatedAt is not a date: ${fixturesUpdatedAt}`,
);
// A minute of slack: the stamp is written on one runner and checked on another.
assert.ok(
  updatedAt.getTime() <= Date.now() + 60_000,
  `fixturesUpdatedAt is in the future: ${fixturesUpdatedAt}`,
);

/*
 * The release history and CHANGELOG.md are both kept by hand and share one
 * numbering, so nothing but a check stops them drifting. See docs/versioning.md.
 */
const versionPattern = /^\d+\.\d+\.\d+$/;
const seenVersions = new Set<string>();

assert.ok(releases.length > 0, "no releases defined");
assert.equal(CURRENT_VERSION, releases[0].version, "CURRENT_VERSION is not the newest release");

for (const [index, release] of releases.entries()) {
  assert.ok(versionPattern.test(release.version), `malformed version: ${release.version}`);
  assert.ok(!seenVersions.has(release.version), `duplicate version: ${release.version}`);
  seenVersions.add(release.version);
  assert.ok(isCalendarDate(release.date), `invalid release date: ${release.version}`);
  assert.ok(release.notes.length > 0, `release has no notes: ${release.version}`);

  const previous = releases[index - 1];
  if (previous) {
    assert.ok(
      previous.date >= release.date,
      `releases are not ordered newest-first: ${previous.version} precedes ${release.version}`,
    );
  }
}

const changelog = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../CHANGELOG.md"),
  "utf8",
);
const newestHeading = changelog.match(/^## (.+)$/m)?.[1] ?? "";
assert.ok(
  newestHeading.startsWith(CURRENT_VERSION),
  `CHANGELOG.md's newest entry is "${newestHeading}", expected it to start with ${CURRENT_VERSION}`,
);

/*
 * Every release has to appear in both records. Matching only the newest pair
 * let three of them go missing from the site's history while the engineering
 * log kept them, because a version present in one and absent from the other
 * broke nothing a check was looking at. The last heading is prose rather than
 * a version ("0.2.0 and earlier"), so the comparison stops where it starts
 * summarising.
 */
const changelogVersions = [...changelog.matchAll(/^## (\d+\.\d+\.\d+) /gm)].map(
  (match) => match[1],
);
const summarised = changelogVersions[changelogVersions.length - 1];
const logged = new Set(changelogVersions);
const listed = new Set(releases.map((release) => release.version));

for (const version of logged) {
  assert.ok(listed.has(version), `${version} is in CHANGELOG.md but missing from versions.ts`);
}
for (const version of listed) {
  if (version < summarised) continue;
  assert.ok(logged.has(version), `${version} is in versions.ts but missing from CHANGELOG.md`);
}

for (const division of divisions) {
  assert.ok(!seenDivisionIds.has(division.id), `duplicate division id: ${division.id}`);
  seenDivisionIds.add(division.id);
}

for (const team of teams) {
  assert.ok(!seenTeamIds.has(team.id), `duplicate team id: ${team.id}`);
  seenTeamIds.add(team.id);
  assert.ok(divisionIds.has(team.divisionId), `unknown team division: ${team.id}`);
}

for (const match of matches) {
  assert.ok(!seenMatchIds.has(match.id), `duplicate match id: ${match.id}`);
  seenMatchIds.add(match.id);

  assert.ok(divisionIds.has(match.divisionId), `unknown match division: ${match.id}`);
  assert.ok(isCalendarDate(match.date), `invalid match date: ${match.id}`);
  assert.ok(
    match.date >= SEASON.start && match.date <= SEASON.end,
    `match outside season: ${match.id}`,
  );
  assert.match(match.time, timePattern, `invalid match time: ${match.id}`);

  for (const [side, teamId] of [
    ["home", match.homeId],
    ["away", match.awayId],
  ] as const) {
    if (teamId === null) continue;
    const team = teamById.get(teamId);
    assert.ok(team, `unknown ${side} team ${teamId} in ${match.id}`);
    assert.equal(
      team.divisionId,
      match.divisionId,
      `${side} team is in the wrong division for ${match.id}`,
    );
  }

  if (match.homeId !== null && match.awayId !== null) {
    assert.notEqual(match.homeId, match.awayId, `match has the same team twice: ${match.id}`);
  }

  assert.equal(
    match.homeGoals === null,
    match.awayGoals === null,
    `match has only one score: ${match.id}`,
  );
  for (const [side, score] of [
    ["home", match.homeGoals],
    ["away", match.awayGoals],
  ] as const) {
    if (score === null) continue;
    assert.ok(Number.isInteger(score) && score >= 0, `invalid ${side} score: ${match.id}`);
  }

  if (match.round !== undefined) {
    assert.ok(match.round.trim().length > 0, `empty round: ${match.id}`);
  }

  const shootoutHome = match.shootoutHomeGoals;
  const shootoutAway = match.shootoutAwayGoals;
  assert.equal(
    shootoutHome == null,
    shootoutAway == null,
    `match has an incomplete shootout score: ${match.id}`,
  );
  for (const [side, score] of [
    ["home shootout", shootoutHome],
    ["away shootout", shootoutAway],
  ] as const) {
    if (score == null) continue;
    assert.ok(Number.isInteger(score) && score >= 0, `invalid ${side} score: ${match.id}`);
  }
  if (shootoutHome != null || shootoutAway != null) {
    assert.equal(
      match.homeGoals,
      match.awayGoals,
      `shootout match must be tied at full time: ${match.id}`,
    );
    assert.ok(!match.postponed, `shootout match cannot be postponed: ${match.id}`);
    assert.notEqual(shootoutHome, shootoutAway, `shootout match must have a winner: ${match.id}`);
  }
}

type Result = "W" | "D" | "L";
type ExpectedStanding = {
  gp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  form: Result[];
};

const calculateExpectedStandings = (divisionId: DivisionId) => {
  const expected = new Map<string, ExpectedStanding>();
  for (const team of teams.filter((team) => team.divisionId === divisionId)) {
    expected.set(team.id, { gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, form: [] });
  }

  for (const match of matches) {
    if (
      match.divisionId !== divisionId ||
      match.postponed ||
      match.homeGoals === null ||
      match.awayGoals === null
    ) {
      continue;
    }

    assert.ok(
      match.homeId !== null && match.awayId !== null,
      `played match is missing a team: ${match.id}`,
    );
    if (match.homeId === null || match.awayId === null) continue;

    const home = expected.get(match.homeId);
    const away = expected.get(match.awayId);
    assert.ok(home, `played match has unknown home team: ${match.id}`);
    assert.ok(away, `played match has unknown away team: ${match.id}`);
    if (!home || !away) continue;

    home.gp++;
    away.gp++;
    home.gf += match.homeGoals;
    home.ga += match.awayGoals;
    away.gf += match.awayGoals;
    away.ga += match.homeGoals;

    if (match.homeGoals === match.awayGoals) {
      home.d++;
      away.d++;
      home.form.push("D");
      away.form.push("D");
    } else if (match.homeGoals > match.awayGoals) {
      home.w++;
      away.l++;
      home.form.push("W");
      away.form.push("L");
    } else {
      away.w++;
      home.l++;
      away.form.push("W");
      home.form.push("L");
    }
  }

  return expected;
};

for (const division of divisions) {
  const expected = calculateExpectedStandings(division.id);
  const rows = standings(division.id);
  const rowIds = rows.map((row) => row.team.id);
  const expectedIds = [...expected.keys()];

  assert.equal(rows.length, expected.size, `standings team count mismatch: ${division.id}`);
  assert.equal(new Set(rowIds).size, rowIds.length, `duplicate standings team: ${division.id}`);
  assert.deepEqual(
    [...rowIds].sort(),
    [...expectedIds].sort(),
    `standings team membership mismatch: ${division.id}`,
  );

  for (const row of rows) {
    assert.equal(
      row.team.divisionId,
      division.id,
      `standings team is in the wrong division: ${row.team.id}`,
    );
    const expectedRow = expected.get(row.team.id);
    assert.ok(expectedRow, `standings contains an unknown team: ${row.team.id}`);
    if (!expectedRow) continue;

    assert.deepEqual(
      {
        gp: row.gp,
        w: row.w,
        d: row.d,
        l: row.l,
        gf: row.gf,
        ga: row.ga,
        gd: row.gd,
        pts: row.pts,
        form: row.form,
      },
      {
        gp: expectedRow.gp,
        w: expectedRow.w,
        d: expectedRow.d,
        l: expectedRow.l,
        gf: expectedRow.gf,
        ga: expectedRow.ga,
        gd: expectedRow.gf - expectedRow.ga,
        pts: expectedRow.w * 3 + expectedRow.d,
        form: expectedRow.form.slice(-5),
      },
      `standings values mismatch: ${row.team.id}`,
    );
  }
}

console.log(
  `fixture validation passed: ${matches.length} matches, ${teams.length} teams, ${divisions.length} divisions`,
);
