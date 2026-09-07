import assert from "node:assert/strict";
import test from "node:test";

import {
  collapseKnockoutMatches,
  isKnockoutRound,
  knockoutStage,
  numericRoundsOf,
  standingsFor,
  winnerId,
} from "../src/data/competition.ts";
import type { CompetitionDataset } from "../src/data/competition.ts";
import type { Match, Team } from "../src/data/types.ts";

const team = (id: string, name = id): Team => ({
  id,
  divisionId: "social",
  name,
  shirt: null,
  shorts: null,
  socks: null,
  unavailable: null,
});

const match = (overrides: Partial<Match>): Match => ({
  id: overrides.id ?? "match",
  no: overrides.no ?? 1,
  divisionId: "social",
  date: overrides.date ?? "2026-02-07",
  time: overrides.time ?? "15:00",
  venue: "DELTA",
  homeId: overrides.homeId ?? "a",
  awayId: overrides.awayId ?? "b",
  homeName: overrides.homeName ?? "A",
  awayName: overrides.awayName ?? "B",
  homeGoals: overrides.homeGoals ?? null,
  awayGoals: overrides.awayGoals ?? null,
  postponed: overrides.postponed ?? false,
  note: null,
  ...overrides,
});

const dataset: CompetitionDataset = {
  teams: [team("a", "A"), team("b", "B"), team("c", "C")],
  matches: [
    match({ id: "r1", no: 1, round: "1", homeGoals: 2, awayGoals: 0 }),
    match({
      id: "r2",
      no: 2,
      round: "2",
      homeId: "a",
      awayId: "c",
      homeName: "A",
      awayName: "C",
      homeGoals: 0,
      awayGoals: 1,
    }),
    match({ id: "qf", no: 3, round: "QF1", homeId: "a", awayId: "b", homeGoals: 4, awayGoals: 0 }),
    match({
      id: "final",
      no: 4,
      round: "FINAL",
      homeId: "a",
      awayId: "b",
      homeGoals: 2,
      awayGoals: 2,
      shootoutHomeGoals: 1,
      shootoutAwayGoals: 3,
    }),
  ],
};

test("numeric round discovery and standings filtering exclude knockout games", () => {
  assert.deepEqual(numericRoundsOf(dataset, "social"), ["1", "2"]);
  assert.equal(standingsFor(dataset, "social", "1").find((row) => row.team.id === "a")?.gp, 1);
  assert.equal(standingsFor(dataset, "social", "2").find((row) => row.team.id === "a")?.gp, 1);
  assert.equal(standingsFor(dataset, "social").find((row) => row.team.id === "a")?.gp, 2);
});

test("knockout classification and shootout winner resolution are explicit", () => {
  assert.equal(isKnockoutRound("QF1"), true);
  assert.equal(isKnockoutRound("3RD/4TH"), true);
  assert.equal(isKnockoutRound("2"), false);
  assert.equal(knockoutStage("FINAL"), "final");
  assert.equal(knockoutStage("3RD/4TH"), "placing");
  assert.equal(winnerId(dataset.matches[3]!), "b");
});

test("bracket collapse prefers the played replay over a postponed attempt", () => {
  const attempts = [
    match({ id: "qf-pp", no: 7, round: "QF1", postponed: true }),
    match({ id: "qf-played", no: 7, round: "QF1", date: "2026-05-23", homeGoals: 3, awayGoals: 1 }),
  ];
  const collapsed = collapseKnockoutMatches(attempts);
  assert.equal(collapsed.length, 1);
  assert.equal(collapsed[0]?.id, "qf-played");
});
