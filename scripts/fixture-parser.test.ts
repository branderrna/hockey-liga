import assert from "node:assert/strict";
import test from "node:test";

import {
  parseCsv,
  parseDate,
  parseFixtureRows,
  parseRound,
  parseScoreline,
} from "../src/data/fixture-parser.ts";

test("parses quoted CSV fields containing commas and newlines", () => {
  assert.deepEqual(parseCsv('A,"B, C","line one\nline two"\r\nD,E,F'), [
    ["A", "B, C", "line one\nline two"],
    ["D", "E", "F"],
  ]);
});

test("parses bare-CR CSV line endings", () => {
  assert.deepEqual(parseCsv("A,B\rC,D"), [
    ["A", "B"],
    ["C", "D"],
  ]);
});
test("normalizes exported underscore dates and scorelines", () => {
  assert.equal(parseDate("Sunday,_02 Aug", "2026"), "2026-08-02");
  assert.equal(parseDate("Saturday, 07 Feb", "2026"), "2026-02-07");
  assert.deepEqual(parseScoreline(" 2  -  1 "), { home: 2, away: 1 });
  assert.equal(parseDate("Saturday, 31 Feb", "2026"), null);
});

test("normalizes round values without changing their meaning", () => {
  assert.equal(parseRound("1.0"), "1");
  assert.equal(parseRound(" sf 2 "), "SF2");
  assert.equal(parseRound("3rd / 4th"), "3RD/4TH");
  assert.equal(parseRound(""), undefined);
});

test("parses optional round and shootout columns while retaining postponed rows", () => {
  const rows = parseCsv(
    [
      "Fixture export,,,,,,,,",
      "No.,Day & Date,Venue,Time,Category,Round,Home,Score,Away,Shootout Score,PP,Notes",
      '1,"Saturday,_07 Feb",DELTA,1800,SOCIAL,1,EAGLES,2 - 2,TORNADOS,2 - 1,,',
      '2,"Saturday,_14 Feb",DELTA,1800,SOCIAL,QF1,EAGLES,PP,TORNADOS,,,rescheduled',
      '3,"Saturday,_21 Feb",DELTA,1800,SOCIAL,FINAL,EAGLES,bad,TORNADOS,,,',
      '4,"Saturday,_28 Feb",DELTA,1800,SOCIAL,SF1,EAGLES,1 - 1,TORNADOS,4 - 5,,',
      ",,,,Category,,,,,,,",
    ].join("\n"),
  );

  const parsed = parseFixtureRows(rows, {
    seasonYear: "2026",
    categoryToDivision: { SOCIAL: "social" },
    resolveTeamId: (divisionId, name) => `${divisionId}--${name.toLowerCase()}`,
  });

  assert.equal(parsed.matches.length, 3);
  assert.deepEqual(parsed.matches[0], {
    id: "m-2026-02-07-1800-delta-eagles-tornados",
    no: 1,
    divisionId: "social",
    date: "2026-02-07",
    time: "18:00",
    venue: "DELTA",
    homeId: "social--eagles",
    awayId: "social--tornados",
    homeName: "EAGLES",
    awayName: "TORNADOS",
    homeGoals: 2,
    awayGoals: 2,
    postponed: false,
    note: null,
    round: "1",
    shootoutHomeGoals: 2,
    shootoutAwayGoals: 1,
  });
  assert.equal(parsed.matches[1]?.postponed, true);
  assert.equal(parsed.matches[1]?.round, "QF1");
  assert.equal(parsed.matches[2]?.round, "SF1");
  assert.deepEqual(parsed.skippedRows, ['row 5: malformed Score "bad"']);
  assert.equal(parsed.unresolvedTeams.size, 0);
});

test("rejects a postponement note without a matching PP marker", () => {
  const rows = parseCsv(
    [
      "No.,Day & Date,Venue,Time,Category,Home,Score,Away,PP,Notes",
      '56,"Saturday,_05 Sep",CCAB,1900,PREMIER,ORA,5 - 0,TORNADOS,,Postponed due to haze',
    ].join("\n"),
  );

  assert.throws(
    () =>
      parseFixtureRows(rows, {
        seasonYear: "2026",
        categoryToDivision: { PREMIER: "premier" },
      }),
    /row 2: Notes mark this fixture postponed but Score\/PP does not/,
  );
});

test("keeps the old live-sheet shape compatible", () => {
  const parsed = parseFixtureRows(
    parseCsv(
      [
        "No.,Day & Date,Venue,Time,Category,Home,Score ,Away,PP,PP Score,Notes",
        '1,"Sunday,_02 Aug",CCAB,1500,PREMIER,ORA,PP,THISISRI,PP,1-0,stopped',
        '2,"Sunday,_02 Aug",CCAB,1600,PREMIER,ORA,3 - 0,THISISRI,,,',
      ].join("\n"),
    ),
    {
      seasonYear: "2026",
      categoryToDivision: { PREMIER: "premier" },
    },
  );

  assert.equal(parsed.matches.length, 2);
  assert.equal(parsed.matches[0]?.postponed, true);
  assert.equal(parsed.matches[0]?.homeGoals, null);
  assert.equal(parsed.matches[0]?.round, undefined);
  assert.equal(parsed.matches[0]?.shootoutHomeGoals, undefined);
  assert.equal(parsed.matches[1]?.homeGoals, 3);
});

test("promotes a seeding play-off to a play-in when a knockout row points back at it", () => {
  const rows = parseCsv(
    [
      "No.,Day & Date,Venue,Time,Category,Round,Home,Score,Away,Shootout Score,PP,Notes",
      '1,"Saturday,_09 May",DELTA,1800,SOCIAL,2,OLDHAM,4 - 0,HYPERNOVAS,,,6th vs 7th',
      '2,"Saturday,_09 May",DELTA,1900,SOCIAL,2,ROVERS,2 - 0,TORNADOS,,,8th vs 9th',
      '3,"Saturday,_16 May",DELTA,1900,SOCIAL,QF3,BARKERITES,2 - 1,OLDHAM,,,3rd vs Winner of 6th/7th play-in',
      '4,"Saturday,_16 May",DELTA,2000,SOCIAL,2,FLICKERS,1 - 0,VARSITY,,,league game',
    ].join("\n"),
  );

  const parsed = parseFixtureRows(rows, {
    seasonYear: "2026",
    categoryToDivision: { SOCIAL: "social" },
    resolveTeamId: (divisionId, name) => `${divisionId}--${name.toLowerCase()}`,
  });

  assert.deepEqual(
    parsed.matches.map((match) => match.round),
    ["PLAY-IN", "2", "QF3", "2"],
  );
});
