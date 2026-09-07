import assert from "node:assert/strict";
import test from "node:test";

import { formatFixtureRound } from "../src/data/round.ts";

test("formats U14 knockout round abbreviations", () => {
  assert.equal(formatFixtureRound("SF1"), "Semi Final 1");
  assert.equal(formatFixtureRound("qf 2"), "Quarter Final 2");
});

test("formats ordinal placing rounds without changing the source value", () => {
  assert.equal(formatFixtureRound("5TH/6TH"), "5TH/6TH Placing");
  assert.equal(formatFixtureRound("3rd / 4th"), "3rd/4th Placing");
});

test("formats numeric league rounds", () => {
  assert.equal(formatFixtureRound("1"), "Round 1");
  assert.equal(formatFixtureRound("2.0"), "Round 2");
});

test("leaves blank and unknown stage values alone", () => {
  assert.equal(formatFixtureRound(""), "");
  assert.equal(formatFixtureRound("FINAL"), "FINAL");
});
