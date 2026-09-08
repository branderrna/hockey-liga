import assert from "node:assert/strict";
import test from "node:test";

import { formatFixtureRound } from "../src/data/round.ts";

test("formats U14 knockout round abbreviations", () => {
  assert.equal(formatFixtureRound("SF1"), "Semi-final 1");
  assert.equal(formatFixtureRound("qf 2"), "Quarter-final 2");
  assert.equal(formatFixtureRound("FINAL"), "Final");
});

test("formats placing rounds as readable ordinal labels", () => {
  assert.equal(formatFixtureRound("5TH/6TH"), "5th/6th place");
  assert.equal(formatFixtureRound("3rd / 4th"), "3rd/4th place");
  assert.equal(formatFixtureRound("9TH-11TH"), "9th–11th place");
});

test("formats numeric league rounds", () => {
  assert.equal(formatFixtureRound("1"), "Round 1");
  assert.equal(formatFixtureRound("2.0"), "Round 2");
});

test("leaves blank and unknown stage values alone", () => {
  assert.equal(formatFixtureRound(""), "");
  assert.equal(formatFixtureRound("FINAL"), "Final");
});

test("formats a play-in the sheet only marks in its notes", () => {
  assert.equal(formatFixtureRound("PLAY-IN"), "Play-in");
});
