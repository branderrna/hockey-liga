import assert from "node:assert/strict";

import { divisions, SEASON, standings, teams } from "../src/data/league.ts";
import { matches } from "../src/data/matches.generated.ts";
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
