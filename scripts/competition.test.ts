import assert from "node:assert/strict";
import test from "node:test";

import {
  bracketsOf,
  matchesOf,
  collapseKnockoutMatches,
  isKnockoutRound,
  knockoutStage,
  numericRoundsOf,
  poolsOf,
  pooledStandingsFor,
  standingsFor,
  tableRoundsOf,
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

test("a later round carries the earlier ones forward, and never the knockout", () => {
  assert.deepEqual(numericRoundsOf(dataset, "social"), ["1", "2"]);
  const gpAfter = (round?: string) =>
    standingsFor(dataset, "social", round).find((row) => row.team.id === "a")?.gp;
  // Team A played once in each round, so round 2 stands at two games, not one.
  assert.equal(gpAfter("1"), 1);
  assert.equal(gpAfter("2"), 2);
  assert.equal(gpAfter(), 2);
  // A knockout win is not a league game at any round.
  assert.equal(standingsFor(dataset, "social", "2").find((row) => row.team.id === "b")?.gp, 1);
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

/* An eight-team draw: four quarter-finals into two semi-finals into a final,
   with the beaten sides playing off for 5th to 8th alongside it. */
const seeds = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];
const tie = (
  id: string,
  no: number,
  round: string,
  home: string,
  away: string,
  homeGoals: number,
  awayGoals: number,
) =>
  match({
    id,
    no,
    round,
    homeId: home,
    awayId: away,
    homeName: home,
    awayName: away,
    homeGoals,
    awayGoals,
  });

const drawDataset: CompetitionDataset = {
  teams: seeds.map((id) => team(id)),
  matches: [
    tie("qf1", 1, "QF1", "s1", "s8", 3, 0),
    tie("qf2", 2, "QF2", "s2", "s7", 2, 1),
    tie("qf3", 3, "QF3", "s3", "s6", 4, 1),
    tie("qf4", 4, "QF4", "s4", "s5", 1, 0),
    tie("sf1", 5, "SF1", "s1", "s4", 2, 1),
    tie("sf2", 6, "SF2", "s2", "s3", 0, 1),
    tie("sf3", 7, "SF3", "s8", "s5", 1, 2),
    tie("sf4", 8, "SF4", "s7", "s6", 3, 2),
    tie("final", 9, "FINAL", "s1", "s3", 2, 0),
    tie("third", 10, "3RD/4TH", "s4", "s2", 1, 2),
    tie("fifth", 11, "5TH/6TH", "s5", "s7", 0, 1),
    tie("seventh", 12, "7TH/8TH", "s8", "s6", 2, 3),
  ],
};

test("a knockout draw becomes one tree per competition, not a pile of cards", () => {
  const [championship, consolation] = bracketsOf(drawDataset, "social");
  assert.equal(bracketsOf(drawDataset, "social").length, 2);

  assert.equal(championship?.title, "Championship");
  assert.deepEqual(
    championship?.columns.map((column) => [column.title, column.slots.length]),
    [
      ["Quarter-finals", 4],
      ["Semi-finals", 2],
      ["Final", 1],
    ],
  );
  // The third-place play-off settles this bracket but sits on no path through
  // it, so it hangs under the chart instead of taking a row of the grid.
  assert.deepEqual(
    championship?.extras.map((slot) => [slot.match.round, slot.attached]),
    [["3RD/4TH", true]],
  );
  assert.equal(championship?.rows, 4);

  assert.equal(consolation?.title, "5th–8th place");
  assert.deepEqual(
    consolation?.columns.map((column) => column.title),
    ["", "Semi-finals", "Placing"],
  );
});

test("every card sits centred between the two games that feed it", () => {
  const [championship] = bracketsOf(drawDataset, "social");
  const centre = (slot: { row: number; span: number }) => slot.row + slot.span / 2;
  const columns = championship?.columns ?? [];
  const quarters = columns[0]?.slots ?? [];
  const semis = columns[1]?.slots ?? [];
  const final = columns[2]?.slots[0];

  // Winners' paths meet: QF1/QF4 feed SF1, QF2/QF3 feed SF2.
  assert.deepEqual(
    quarters.map((slot) => slot.match.round),
    ["QF1", "QF4", "QF2", "QF3"],
  );
  assert.equal(centre(semis[0]!), (centre(quarters[0]!) + centre(quarters[1]!)) / 2);
  assert.equal(centre(semis[1]!), (centre(quarters[2]!) + centre(quarters[3]!)) / 2);
  assert.equal(centre(final!), (centre(semis[0]!) + centre(semis[1]!)) / 2);

  assert.deepEqual(final?.join, { from: 25, to: 75 });
  assert.equal(
    quarters.every((slot) => slot.advances && slot.join === null),
    true,
  );
  assert.equal(final?.advances, false);
});

/* A round the two halves of the table played separately. */
const pooledDataset: CompetitionDataset = {
  teams: ["a", "b", "c", "d", "e", "f"].map((id) => team(id, id.toUpperCase())),
  matches: [
    tie("r1-1", 1, "1", "a", "d", 3, 0),
    tie("r1-2", 2, "1", "b", "e", 3, 0),
    tie("r1-3", 3, "1", "c", "f", 3, 0),
    tie("r1-4", 4, "1", "a", "b", 1, 0),
    tie("r1-5", 5, "1", "d", "e", 1, 0),
    tie("r2-1", 6, "2", "a", "b", 1, 0),
    tie("r2-2", 7, "2", "b", "c", 1, 0),
    tie("r2-3", 8, "2", "a", "c", 1, 0),
    tie("r2-4", 9, "2", "d", "e", 1, 0),
    tie("r2-5", 10, "2", "e", "f", 1, 0),
    tie("r2-6", 11, "2", "d", "f", 1, 0),
  ],
};

test("a round whose halves never meet is read as two pools, seeded off the round before", () => {
  assert.deepEqual(poolsOf(pooledDataset, "social", "1"), []);

  const groups = pooledStandingsFor(pooledDataset, "social", "2");
  assert.deepEqual(
    groups.map((group) => [group.pool?.label, group.pool?.detail, group.rows.length]),
    [
      ["Top 3", "1st–3rd after Round 1", 3],
      ["Bottom 3", "4th–6th after Round 1", 3],
    ],
  );
  assert.deepEqual(
    groups[0]?.rows.map((row) => row.team.id),
    ["a", "b", "c"],
  );
  // Without a round to seed from there is one table, as before.
  assert.equal(pooledStandingsFor(pooledDataset, "social").length, 1);
});

test("every chart in a division shares one column hierarchy, aligned on its decider", () => {
  const charts = bracketsOf(drawDataset, "social");
  const widths = new Set(charts.map((chart) => chart.columns.length));
  assert.equal(widths.size, 1, "charts must be the same number of columns wide");

  // The 5th-8th semi-finals sit under the championship semi-finals, and its
  // decider under the final, rather than sliding left into the first round.
  const columnOf = (chart: (typeof charts)[number], round: string) =>
    chart.columns.findIndex((column) => column.slots.some((slot) => slot.match.round === round));
  const [championship, consolation] = charts;
  assert.equal(columnOf(consolation!, "SF3"), columnOf(championship!, "SF1"));
  assert.equal(columnOf(consolation!, "5TH/6TH"), columnOf(championship!, "FINAL"));
  // Columns a chart does not reach are empty and unnamed, not missing.
  assert.deepEqual(consolation?.columns[0], { title: "", slots: [] });
});

test("a hung decider costs the grid no row the other columns would leave blank", () => {
  for (const chart of bracketsOf(drawDataset, "social")) {
    const deepest = Math.max(
      ...chart.columns.flatMap((column) => column.slots.map((s) => s.row + s.span)),
    );
    assert.equal(chart.rows, deepest, `${chart.title} reserves rows nothing occupies`);
    assert.equal(
      chart.columns.every((column) => column.slots.every((slot) => !slot.attached)),
      true,
      `${chart.title} still places a hung decider in the grid`,
    );
  }
});

test("a round still seeded by finishing position is not offered as a table", () => {
  const seeded: CompetitionDataset = {
    teams: [team("a", "A"), team("b", "B"), team("c", "C")],
    matches: [
      tie("r1-1", 1, "1", "a", "b", 2, 0),
      tie("r1-2", 2, "1", "b", "c", 1, 0),
      tie("r1-3", 3, "1", "a", "c", 3, 1),
      // Round 2 is published but its sides are still "1ST" and "3RD".
      match({
        id: "r2-1",
        no: 4,
        round: "2",
        homeId: null,
        awayId: null,
        homeName: "1ST",
        awayName: "3RD",
        note: "1st vs 3rd",
      }),
    ],
  };

  assert.deepEqual(numericRoundsOf(seeded, "social"), ["1", "2"]);
  // Offering it would open the table on nine teams at zero, so it waits.
  assert.deepEqual(tableRoundsOf(seeded, "social"), ["1"]);
  // The fixture is still in the schedule, which is where it is useful.
  assert.equal(matchesOf(seeded, "social").filter((m) => m.round === "2").length, 1);

  // The day the clubs are named, the round earns its table.
  const named: CompetitionDataset = {
    teams: seeded.teams,
    matches: [...seeded.matches.slice(0, 3), tie("r2-1", 4, "2", "a", "c", 1, 1)],
  };
  assert.deepEqual(tableRoundsOf(named, "social"), ["1", "2"]);
  assert.equal(standingsFor(named, "social", "2").find((row) => row.team.id === "a")?.gp, 3);
});
