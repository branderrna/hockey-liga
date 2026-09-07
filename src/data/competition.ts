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

export function playedOf(dataset: CompetitionDataset, divisionId: DivisionId): Match[] {
  return matchesOf(dataset, divisionId).filter(isPlayed);
}

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

const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;
const leagueToday = () => new Date(Date.now() + SGT_OFFSET_MS).toISOString().slice(0, 10);

export function latestWeekendKey(
  dataset: CompetitionDataset,
  divisionId: DivisionId,
): string | null {
  const weekends = weekendsOf(dataset, divisionId);
  const today = leagueToday();
  for (let index = weekends.length - 1; index >= 0; index--) {
    const weekend = weekends[index];
    if (weekend && weekend.key <= today) return weekend.key;
  }
  return weekends[0]?.key ?? null;
}

/** Round values made up of a number are standings rounds, not bracket stages. */
export function isLeagueRound(round: string | undefined): boolean {
  return round ? /^\d+$/.test(round) : true;
}

export function isKnockoutRound(round: string | undefined): boolean {
  if (!round) return false;
  return (
    /^(?:QF|SF)\d+$/i.test(round) ||
    round.toUpperCase() === "FINAL" ||
    /^\d+(?:ST|ND|RD|TH)?(?:\/|-)\d+(?:ST|ND|RD|TH)?$/i.test(round)
  );
}

export function knockoutStage(round: string | undefined): KnockoutStage | null {
  if (!round) return null;
  if (/^QF\d+$/i.test(round)) return "quarter-final";
  if (/^SF\d+$/i.test(round)) return "semi-final";
  if (round.toUpperCase() === "FINAL") return "final";
  if (/^\d+(?:ST|ND|RD|TH)?(?:\/|-)\d+(?:ST|ND|RD|TH)?$/i.test(round)) {
    return "placing";
  }
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

function standingsMatches(
  dataset: CompetitionDataset,
  divisionId: DivisionId,
  round?: string,
): Match[] {
  return playedOf(dataset, divisionId).filter((match) => {
    if (round) return match.round === round;
    return !isKnockoutRound(match.round);
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
