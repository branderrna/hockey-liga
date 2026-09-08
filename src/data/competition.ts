import { ordinal } from "./round.ts";
import type { DivisionId, Match, Standing, Team, Weekend } from "./types.ts";

export type CompetitionDataset = {
  teams: Team[];
  matches: Match[];
};

export type KnockoutStage = "play-in" | "quarter-final" | "semi-final" | "final" | "placing";

export function teamsOf(dataset: CompetitionDataset, divisionId: DivisionId): Team[] {
  return dataset.teams.filter((team) => team.divisionId === divisionId);
}

export function matchesOf(dataset: CompetitionDataset, divisionId: DivisionId): Match[] {
  return dataset.matches
    .filter((match) => match.divisionId === divisionId)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.time.localeCompare(b.time) ||
        a.no - b.no ||
        a.id.localeCompare(b.id),
    );
}

export function isPlayed(match: Match): boolean {
  return match.homeGoals !== null && match.awayGoals !== null && !match.postponed;
}

function playedOf(dataset: CompetitionDataset, divisionId: DivisionId): Match[] {
  return matchesOf(dataset, divisionId).filter(isPlayed);
}

/**
 * Fixtures moved to this date from an earlier, postponed one. The sheet's
 * wording varies ("shifted from", "shiftef from", "shiftefd from"), so match
 * the stem rather than the exact phrase — and do not catch "changed from".
 */
export function isReplayed(match: Match): boolean {
  return !!match.note && /shift\w*\s+from\b/i.test(match.note);
}

const DAY_MS = 86_400_000;
const dayOf = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);

function weekendLabel(dates: string[]): string {
  const format = (iso: string, options: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
      timeZone: "UTC",
      ...options,
    });
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (!first || !last) return "";
  if (first === last) return format(first, { day: "numeric", month: "short" });
  const sameMonth = first.slice(0, 7) === last.slice(0, 7);
  return sameMonth
    ? `${format(first, { day: "numeric" })}–${format(last, { day: "numeric", month: "short" })}`
    : `${format(first, { day: "numeric", month: "short" })} – ${format(last, {
        day: "numeric",
        month: "short",
      })}`;
}

/**
 * Groups a liga's fixtures into playing blocks: match days one calendar day
 * apart belong to the same block, which lumps each Sat/Sun weekend together.
 */
export function weekendsOf(dataset: CompetitionDataset, divisionId: DivisionId): Weekend[] {
  const dates = [...new Set(matchesOf(dataset, divisionId).map((match) => match.date))];
  const blocks: string[][] = [];
  for (const date of dates) {
    const current = blocks[blocks.length - 1];
    const previous = current?.[current.length - 1];
    if (current && previous && dayOf(date) - dayOf(previous) <= 1) current.push(date);
    else blocks.push([date]);
  }

  const schedule = matchesOf(dataset, divisionId);
  return blocks.map((block) => ({
    key: block[0]!,
    dates: block,
    label: weekendLabel(block),
    matches: schedule.filter((match) => block.includes(match.date)),
  }));
}

/**
 * The league plays on Singapore time, which sits at UTC+8 all year with no
 * daylight saving, so shifting the epoch by eight hours gives today's calendar
 * day there. Anchoring to the league's own zone rather than the viewer's also
 * keeps the server render and the browser's hydration on the same day.
 */
const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;
const leagueToday = () => new Date(Date.now() + SGT_OFFSET_MS).toISOString().slice(0, 10);

/**
 * The weekend a visitor most likely wants: the one being played today, else the
 * most recent one to have started. Scores are typed up well after the final
 * whistle, so this follows the calendar instead of waiting for them — on a match
 * day the current weekend wins even while every result is still blank. Before
 * the liga's first fixture there is nothing behind us, so look ahead.
 */
export function latestWeekendKey(
  dataset: CompetitionDataset,
  divisionId: DivisionId,
): string | null {
  const weekends = weekendsOf(dataset, divisionId);
  const today = leagueToday();
  for (let index = weekends.length - 1; index >= 0; index--) {
    const weekend = weekends[index];
    // Keys are the block's first ISO date, so they compare as strings.
    if (weekend && weekend.key <= today) return weekend.key;
  }
  return weekends[0]?.key ?? null;
}

/** Round values made up of a number are standings rounds, not bracket stages. */
export function isLeagueRound(round: string | undefined): boolean {
  return round ? /^\d+$/.test(round) : true;
}

const PLACING_ROUND = /^(\d+)(?:ST|ND|RD|TH)?(?:\/|-)(\d+)(?:ST|ND|RD|TH)?$/i;

export function isKnockoutRound(round: string | undefined): boolean {
  return knockoutStage(round) !== null;
}

export function knockoutStage(round: string | undefined): KnockoutStage | null {
  if (!round) return null;
  const upper = round.toUpperCase();
  if (upper === "PLAY-IN") return "play-in";
  if (/^QF\d+$/.test(upper)) return "quarter-final";
  if (/^SF\d+$/.test(upper)) return "semi-final";
  if (upper === "FINAL") return "final";
  if (PLACING_ROUND.test(upper)) return "placing";
  return null;
}

export function numericRoundsOf(dataset: CompetitionDataset, divisionId: DivisionId): string[] {
  return [
    ...new Set(
      matchesOf(dataset, divisionId)
        .map((match) => match.round)
        .filter((round): round is string => !!round && isLeagueRound(round)),
    ),
  ].sort((a, b) => Number(a) - Number(b));
}

export function hasKnockoutOf(dataset: CompetitionDataset, divisionId: DivisionId): boolean {
  return matchesOf(dataset, divisionId).some((match) => isKnockoutRound(match.round));
}

/**
 * Rounds worth offering as a table. A round whose fixtures are still seeded by
 * finishing position ("1ST v 3RD") has no clubs to count, so its table would be
 * every team on zero — and since the switcher opens on the latest round, that
 * empty table would be the first thing a visitor saw. Such a round still shows
 * in the schedule, where the fixture is the point; it earns a table on the day
 * the names arrive, which is the day the round before it finishes.
 */
export function tableRoundsOf(dataset: CompetitionDataset, divisionId: DivisionId): string[] {
  const seeded = (round: string) =>
    matchesOf(dataset, divisionId).some(
      (match) => match.round === round && match.homeId && match.awayId,
    );
  return numericRoundsOf(dataset, divisionId).filter(seeded);
}

/**
 * A later round carries the earlier ones forward. The league's second round is
 * a continuation of the first, not a separate competition: points and goals
 * accumulate, and all that changes is who a side is scheduled against: the
 * table splits into halves that play among themselves, but it stays one table,
 * and a side from the bottom half can finish above one from the top. Counting
 * a round on its own would drop the leaders to the foot of it on the day it
 * opened. Should a season ever run its second round as a fresh table, that
 * becomes a property of the season rather than a change here — see BACKLOG.md.
 */
function standingsMatches(
  dataset: CompetitionDataset,
  divisionId: DivisionId,
  round?: string,
): Match[] {
  return playedOf(dataset, divisionId).filter((match) => {
    if (!round) return !isKnockoutRound(match.round);
    if (!match.round || !isLeagueRound(match.round)) return false;
    return Number(match.round) <= Number(round);
  });
}

export function standingsFor(
  dataset: CompetitionDataset,
  divisionId: DivisionId,
  round?: string,
): Standing[] {
  const map = new Map<string, Standing>();
  for (const team of teamsOf(dataset, divisionId)) {
    map.set(team.id, { team, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] });
  }

  for (const match of standingsMatches(dataset, divisionId, round)) {
    const home = match.homeId ? map.get(match.homeId) : undefined;
    const away = match.awayId ? map.get(match.awayId) : undefined;
    if (!home || !away || match.homeGoals === null || match.awayGoals === null) continue;

    const homeGoals = match.homeGoals;
    const awayGoals = match.awayGoals;
    home.gp++;
    away.gp++;
    home.gf += homeGoals;
    home.ga += awayGoals;
    away.gf += awayGoals;
    away.ga += homeGoals;

    if (homeGoals === awayGoals) {
      home.d++;
      away.d++;
      home.pts++;
      away.pts++;
      home.form.push("D");
      away.form.push("D");
    } else if (homeGoals > awayGoals) {
      home.w++;
      home.pts += 3;
      away.l++;
      home.form.push("W");
      away.form.push("L");
    } else {
      away.w++;
      away.pts += 3;
      home.l++;
      away.form.push("W");
      home.form.push("L");
    }
  }

  return [...map.values()]
    .map((standing) => ({
      ...standing,
      gd: standing.gf - standing.ga,
      form: standing.form.slice(-5),
    }))
    .sort(
      (a, b) =>
        b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.name.localeCompare(b.team.name),
    );
}

export function winnerId(match: Match): string | null {
  if (!isPlayed(match) || !match.homeId || !match.awayId) return null;
  if (match.homeGoals! > match.awayGoals!) return match.homeId;
  if (match.awayGoals! > match.homeGoals!) return match.awayId;

  const homeShootout = match.shootoutHomeGoals;
  const awayShootout = match.shootoutAwayGoals;
  if (homeShootout == null || awayShootout == null || homeShootout === awayShootout) return null;
  return homeShootout > awayShootout ? match.homeId : match.awayId;
}

function bracketMatchKey(match: Match): string {
  return `${match.round ?? "unknown"}::${match.no}`;
}

/**
 * A postponed knockout row and its later replay share the round and match
 * number. The schedule keeps both source rows; the bracket gets one card and
 * prefers a played row, then the latest non-postponed row.
 */
export function collapseKnockoutMatches(matches: Match[]): Match[] {
  const groups = new Map<string, Match[]>();
  for (const match of matches.filter((item) => isKnockoutRound(item.round))) {
    const key = bracketMatchKey(match);
    const group = groups.get(key) ?? [];
    group.push(match);
    groups.set(key, group);
  }

  const choose = (group: Match[]): Match =>
    [...group].sort((a, b) => {
      const playedDelta = Number(isPlayed(b)) - Number(isPlayed(a));
      if (playedDelta) return playedDelta;
      const postponedDelta = Number(a.postponed) - Number(b.postponed);
      if (postponedDelta) return postponedDelta;
      return (
        b.date.localeCompare(a.date) || b.time.localeCompare(a.time) || b.id.localeCompare(a.id)
      );
    })[0]!;

  return [...groups.values()]
    .map(choose)
    .sort(
      (a, b) =>
        knockoutOrder(a.round) - knockoutOrder(b.round) ||
        a.no - b.no ||
        a.date.localeCompare(b.date),
    );
}

function knockoutOrder(round: string | undefined): number {
  if (!round) return Number.MAX_SAFE_INTEGER;
  const upper = round.toUpperCase();
  const number = Number(upper.match(/\d+/)?.[0] ?? 0);
  if (upper === "PLAY-IN") return 50;
  if (upper.startsWith("QF")) return 100 + number;
  if (upper.startsWith("SF")) return 200 + number;
  if (upper === "FINAL") return 300;
  if (upper.startsWith("3RD")) return 310;
  if (upper.startsWith("5TH")) return 320;
  if (upper.startsWith("7TH")) return 330;
  if (upper.startsWith("9TH")) return 340;
  return 350 + number;
}

export function knockoutMatchesOf(dataset: CompetitionDataset, divisionId: DivisionId): Match[] {
  return collapseKnockoutMatches(matchesOf(dataset, divisionId));
}

/* ---------------------------------- bracket --------------------------------- */

export type BracketSlot = {
  match: Match;
  /** First grid row of the card, and how many rows it spans. */
  row: number;
  span: number;
  /** Earlier games in this bracket whose winner arrives here. */
  feedsIn: number;
  /** Percent of the slot's height where the line joining those games runs. */
  join: { from: number; to: number } | null;
  /** The winner of this game goes on to a later card in the same bracket. */
  advances: boolean;
  /** A losers' decider hung under the bracket it settles, drawn without lines. */
  attached: boolean;
};

/** A stage of one chart. Empty where that chart has no game at this depth. */
type BracketColumn = { title: string; slots: BracketSlot[] };

export type Bracket = {
  key: string;
  title: string;
  rows: number;
  columns: BracketColumn[];
  /** Deciders between beaten sides, hung under the chart rather than in it. */
  extras: BracketSlot[];
};

const STAGE_TITLE: Record<KnockoutStage, string> = {
  "play-in": "Play-in",
  "quarter-final": "Quarter-finals",
  "semi-final": "Semi-finals",
  final: "Final",
  placing: "Placing",
};

type Feeder = { match: Match; outcome: "winner" | "loser" | null };

/** For each side of a game, the last knockout game it played before it. */
function feedersOf(matches: Match[]): Map<string, Feeder[]> {
  const feeders = new Map<string, Feeder[]>();
  for (const match of matches) {
    const list: Feeder[] = [];
    for (const teamId of [match.homeId, match.awayId]) {
      if (!teamId) continue;
      const previous = matches
        .filter(
          (candidate) =>
            knockoutOrder(candidate.round) < knockoutOrder(match.round) &&
            (candidate.homeId === teamId || candidate.awayId === teamId),
        )
        .sort(
          (a, b) =>
            knockoutOrder(b.round) - knockoutOrder(a.round) ||
            b.date.localeCompare(a.date) ||
            b.time.localeCompare(a.time),
        )[0];
      if (!previous || list.some((feeder) => feeder.match.id === previous.id)) continue;
      const winner = winnerId(previous);
      list.push({
        match: previous,
        outcome: winner ? (winner === teamId ? "winner" : "loser") : null,
      });
    }
    list.sort(
      (a, b) =>
        knockoutOrder(a.match.round) - knockoutOrder(b.match.round) || a.match.no - b.match.no,
    );
    feeders.set(match.id, list);
  }
  return feeders;
}

function placingRange(matches: Match[]): string | null {
  const positions = matches.flatMap((match) => {
    const placing = match.round?.toUpperCase().match(PLACING_ROUND);
    return placing ? [Number(placing[1]), Number(placing[2])] : [];
  });
  if (positions.length === 0) return null;
  return `${ordinal(Math.min(...positions))}–${ordinal(Math.max(...positions))} place`;
}

/**
 * Lays the knockout games out as trees, so a chart can draw lines that mean
 * something: a card sits beside the two games its sides won to get there.
 * Games between losers start a bracket of their own — the 5th-8th half of an
 * eight-team draw — or hang under the bracket they settle, like a third-place
 * play-off, so each chart reads as one competition rather than a pile of cards.
 */
export function bracketsOf(dataset: CompetitionDataset, divisionId: DivisionId): Bracket[] {
  const matches = knockoutMatchesOf(dataset, divisionId);
  if (matches.length === 0) return [];
  const feeders = feedersOf(matches);
  const feedersFor = (match: Match) => feeders.get(match.id) ?? [];

  // A game's winner goes on to at most one later game.
  const successor = new Map<string, Match>();
  for (const match of matches) {
    for (const feeder of feedersFor(match)) {
      if (feeder.outcome === "winner" && !successor.has(feeder.match.id)) {
        successor.set(feeder.match.id, match);
      }
    }
  }
  const childrenOf = (match: Match) =>
    feedersFor(match)
      .filter((feeder) => feeder.outcome === "winner" && successor.get(feeder.match.id) === match)
      .map((feeder) => feeder.match);

  const roots = matches.filter((match) => !successor.has(match.id));
  const feederKey = (match: Match) =>
    feedersFor(match)
      .map((feeder) => feeder.match.id)
      .sort()
      .join("|");

  // A decider between two losers belongs to the bracket whose winners went on.
  const hostOf = new Map<string, Match>();
  for (const root of roots) {
    const own = feedersFor(root);
    if (own.length === 0 || own.some((feeder) => feeder.outcome !== "loser")) continue;
    const host = roots.find(
      (other) =>
        other !== root &&
        !hostOf.has(other.id) &&
        feederKey(other) === feederKey(root) &&
        feedersFor(other).some((feeder) => feeder.outcome === "winner"),
    );
    if (host) hostOf.set(root.id, host);
  }

  // The final's tree is the main bracket. Placing games group by their label,
  // so a round-robin for 9th to 11th becomes one chart of three games.
  const groups = new Map<string, Match[]>();
  for (const root of roots) {
    if (hostOf.has(root.id)) continue;
    const key = knockoutStage(root.round) === "placing" ? (root.round ?? root.id) : "main";
    groups.set(key, [...(groups.get(key) ?? []), root]);
  }

  const height = (match: Match): number =>
    Math.max(
      1,
      childrenOf(match).reduce((sum, child) => sum + height(child), 0),
    );

  type Placed = { stage: KnockoutStage; slot: BracketSlot };

  const charts = [...groups.entries()].map(([key, groupRoots]) => {
    // Keyed by rounds from this chart's decider, not by stage name, so every
    // chart can be laid out right to left against the same column hierarchy.
    const byDepth = new Map<number, Placed[]>();
    const push = (depth: number, placed: Placed) =>
      byDepth.set(depth, [...(byDepth.get(depth) ?? []), placed]);

    const place = (match: Match, top: number, depth: number): BracketSlot => {
      const span = height(match);
      let cursor = top;
      const children = childrenOf(match).map((child) => {
        const slot = place(child, cursor, depth + 1);
        cursor += slot.span;
        return slot;
      });
      const first = children[0];
      const last = children[children.length - 1];
      const centre = (slot: BracketSlot) => ((slot.row - top + slot.span / 2) / span) * 100;
      const slot: BracketSlot = {
        match,
        row: top,
        span,
        feedsIn: children.length,
        join: first && last ? { from: centre(first), to: centre(last) } : null,
        advances: successor.has(match.id),
        attached: false,
      };
      push(depth, { stage: knockoutStage(match.round) ?? "placing", slot });
      return slot;
    };

    let rows = 0;
    for (const root of groupRoots) rows += place(root, rows, 0).span;

    /*
     * Deciders between two beaten sides belong to this bracket but sit on no
     * path through it, so they hang under the chart rather than taking a row
     * of the grid. A row of their own was a row every other column left blank,
     * which on a phone showing the left of the chart was a screen of nothing
     * between one chart and the next.
     */
    const attached = roots.filter((root) => groupRoots.includes(hostOf.get(root.id) as Match));
    const extras: BracketSlot[] = attached.map((match) => ({
      match,
      row: 0,
      span: 1,
      feedsIn: 0,
      join: null,
      advances: false,
      attached: true,
    }));

    return {
      key,
      title: key === "main" ? "Championship" : (placingRange([...groupRoots, ...attached]) ?? key),
      rows,
      extras,
      byDepth,
      order: key === "main" ? -1 : knockoutOrder(groupRoots[0]?.round),
    };
  });

  /*
   * One column hierarchy across every chart, aligned on the deciders rather
   * than on stage names. Each chart is laid out right to left from its own
   * final, so the semi-finals of a 5th-8th bracket sit under the semi-finals
   * of the championship, and a chart that starts later simply leaves its
   * leading columns empty rather than sliding left and reading as an earlier
   * round. Titles stay per chart, because that column is a final in one and a
   * placing game in another.
   */
  const depth = Math.max(0, ...charts.flatMap((chart) => [...chart.byDepth.keys()]));

  return charts
    .sort((a, b) => a.order - b.order)
    .map((chart) => ({
      key: chart.key,
      title: chart.title,
      rows: chart.rows,
      extras: chart.extras,
      columns: Array.from({ length: depth + 1 }, (_, index) => {
        const placed = chart.byDepth.get(depth - index) ?? [];
        const named = placed.find((entry) => !entry.slot.attached) ?? placed[0];
        return {
          title: named ? STAGE_TITLE[named.stage] : "",
          slots: placed.map((entry) => entry.slot),
        };
      }),
    }));
}
