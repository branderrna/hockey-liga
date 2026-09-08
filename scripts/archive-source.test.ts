import assert from "node:assert/strict";
import test from "node:test";

import { parseArchiveCsv } from "../src/data/archive-parser.ts";

test("parses completed-liga data from the Sheet format without a snapshot", () => {
  const csv = [
    "No.,Day & Date,Venue,Time,Category,Home,Score,Away,PP,Notes,Round,Shootout Score",
    '1,"Saturday,_07 Feb",CCAB,1900,SOCIAL,EAGLES,2 - 2,TORNADOS,,,QF1,2 - 1',
    '2,"Sunday,_08 Feb",CCAB,1000,U14 Boys,ORA,PP,ST ANDREW\'S,,Postponed,,,',
  ].join("\n");

  const { dataset, issues } = parseArchiveCsv(csv);
  assert.deepEqual(issues, []);
  assert.equal(dataset.matches.length, 2);
  assert.equal(dataset.teams.length, 4);
  assert.deepEqual(dataset.matches[0], {
    id: "m-2026-02-07-1900-ccab-eagles-tornados",
    no: 1,
    divisionId: "social",
    date: "2026-02-07",
    time: "19:00",
    venue: "CCAB",
    homeId: "social--eagles",
    awayId: "social--tornados",
    homeName: "EAGLES",
    awayName: "TORNADOS",
    homeGoals: 2,
    awayGoals: 2,
    postponed: false,
    note: null,
    round: "QF1",
    shootoutHomeGoals: 2,
    shootoutAwayGoals: 1,
  });
  assert.equal(dataset.matches[1]?.divisionId, "u14-boys");
  assert.equal(dataset.matches[1]?.postponed, true);
});

test("an unreadable row costs its own row, not the whole completed season", () => {
  const csv = [
    "No.,Day & Date,Venue,Time,Category,Home,Score,Away,PP,Notes,Round,Shootout Score",
    '1,"Saturday,_07 Feb",CCAB,1900,SOCIAL,EAGLES,2 - 1,TORNADOS,,,1,',
    // An en dash instead of a hyphen: the likeliest way to mistype a score.
    '2,"Saturday,_07 Feb",CCAB,2000,SOCIAL,ROVERS,3 – 1,FLICKERS,,,1,',
    '3,"Sunday,_08 Feb",CCAB,1000,SOCIAL,EAGLES,1 - 0,ROVERS,,Postponed,1,',
    '4,"Sunday,_08 Feb",CCAB,1100,SOCIAL,FLICKERS,2 - 0,TORNADOS,,,1,',
  ].join("\n");

  const { dataset, issues } = parseArchiveCsv(csv);
  assert.equal(dataset.matches.length, 2);
  assert.deepEqual(
    dataset.matches.map((match) => match.no),
    [1, 4],
  );
  assert.deepEqual(issues, [
    'row 3: malformed Score "3 – 1"',
    "row 4: Notes mark this fixture postponed but Score/PP does not",
  ]);
});

test("a tab that is no longer a fixture list still fails rather than reading empty", () => {
  assert.throws(() => parseArchiveCsv("Season archive\nnothing,here\n"), /header row/);
});
