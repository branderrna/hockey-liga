import assert from "node:assert/strict";

import { divisions, SEASON, standings, teams } from "../src/data/league.ts";
import { matches } from "../src/data/matches.generated.ts";

const divisionIds = new Set(divisions.map((division) => division.id));
const teamById = new Map(teams.map((team) => [team.id, team]));
const seenMatchIds = new Set<string>();
const seenTeamIds = new Set<string>();
const seenDivisionIds = new Set<string>();
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

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
  assert.match(match.date, datePattern, `invalid match date: ${match.id}`);
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

for (const division of divisions) {
  const rows = standings(division.id);
  const divisionTeamCount = teams.filter((team) => team.divisionId === division.id).length;
  assert.equal(rows.length, divisionTeamCount, `standings team count mismatch: ${division.id}`);

  for (const row of rows) {
    assert.equal(row.gp, row.w + row.d + row.l, `played total mismatch: ${row.team.id}`);
    assert.equal(row.gd, row.gf - row.ga, `goal difference mismatch: ${row.team.id}`);
    assert.equal(row.pts, row.w * 3 + row.d, `points mismatch: ${row.team.id}`);
    assert.ok(row.form.length <= 5, `too much form history: ${row.team.id}`);
    assert.ok(row.form.every((result) => ["W", "D", "L"].includes(result)));
  }
}

console.log(
  `fixture validation passed: ${matches.length} matches, ${teams.length} teams, ${divisions.length} divisions`,
);
