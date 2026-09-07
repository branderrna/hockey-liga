import assert from "node:assert/strict";
import test from "node:test";

import { parseArchiveCsv } from "../src/data/archive-parser.ts";

test("parses completed-liga data from the Sheet format without a snapshot", () => {
  const csv = [
    "No.,Day & Date,Venue,Time,Category,Home,Score,Away,PP,Notes,Round,Shootout Score",
    '1,"Saturday,_07 Feb",CCAB,1900,SOCIAL,EAGLES,2 - 2,TORNADOS,,,QF1,2 - 1',
    '2,"Sunday,_08 Feb",CCAB,1000,U14 Boys,ORA,PP,ST ANDREW\'S,,Postponed,,,',
  ].join("\n");

  const dataset = parseArchiveCsv(csv);
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
