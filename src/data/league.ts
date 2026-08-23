import type { DivisionId, League, Team, Match } from "./types";
export type { DivisionId, Team, Match };

export const SEASON = {
  name: "Hockey Liga 2026",
  subtitle: "\n",
  start: "2026-08-02",
  end: "2026-11-29",
};

const leagues: League[] = [
  {
    id: "women",
    name: "Women's Hockey Liga",
    short: "Women's",
    divisions: [{ id: "women", name: "Women's Hockey Liga", short: "Women's" }],
  },
  {
    id: "premier",
    name: "Premier Hockey Liga",
    short: "Premier",
    divisions: [{ id: "premier", name: "Premier Hockey Liga", short: "Premier" }],
  },
  {
    id: "youth",
    name: "Youth Hockey Liga (U21)",
    short: "Youth U21",
    divisions: [
      { id: "u21-girls", name: "Youth Hockey Liga — U21 Girls", short: "U21 Girls" },
      { id: "u21-boys", name: "Youth Hockey Liga — U21 Boys", short: "U21 Boys" },
    ],
  },
];

export const divisions = leagues.flatMap((l) =>
  l.divisions.map((d) => ({ ...d, leagueId: l.id, leagueName: l.name })),
);

export const divisionById = (id: DivisionId) => divisions.find((d) => d.id === id)!;

export const teams: Team[] = [
  {
    id: "women--lion-city-hockey-club",
    divisionId: "women",
    name: "LION CITY HOCKEY CLUB",
    shirt: "PINK / LIGHT BLUE",
    shorts: "BLACK",
    socks: "BLACK / WHITE & BLUE STRIPES",
    unavailable: "25-26 July, 1-2, 8-9 August, 12-13, 19 September 2026",
  },
  {
    id: "women--tornados",
    divisionId: "women",
    name: "TORNADOS",
    shirt: "MAROON / WHITE",
    shorts: "BLUE",
    socks: "MAROON",
    unavailable: null,
  },
  {
    id: "women--singapore-polytechnic",
    divisionId: "women",
    name: "SINGAPORE POLYTECHNIC",
    shirt: "BLACK / YELLOW",
    shorts: "BLACK",
    socks: "BLACK / RED",
    unavailable: "8-30 August (Examinations + stand down)",
  },
  {
    id: "women--scc",
    divisionId: "women",
    name: "SCC",
    shirt: null,
    shorts: null,
    socks: null,
    unavailable: null,
  },
  {
    id: "women--jansenites",
    divisionId: "women",
    name: "JANSENITES",
    shirt: "GREEN / BLACK",
    shorts: "BLACK",
    socks: "BLACK / RED",
    unavailable: null,
  },
  {
    id: "women--oldham",
    divisionId: "women",
    name: "OLDHAM",
    shirt: null,
    shorts: null,
    socks: null,
    unavailable: null,
  },
  {
    id: "women--sn-alumni",
    divisionId: "women",
    name: "SN ALUMNI",
    shirt: "DARK BLUE / WHITE",
    shorts: "BLACK",
    socks: "BLACK",
    unavailable:
      "special request to have Lion City Hockey and/or Tornados games to be immediately before/after SN Alumni games",
  },
  {
    id: "women--theresian-fielders",
    divisionId: "women",
    name: "THERESIAN FIELDERS",
    shirt: "YELLOW / DARK NAVY BLUE",
    shorts: "BLACK",
    socks: "YELLOW / DARK NAVY BLUE",
    unavailable: null,
  },
  {
    id: "women--sg-masters",
    divisionId: "women",
    name: "SG MASTERS",
    shirt: "RED / WHITE",
    shorts: "BLACK",
    socks: "RED / BLACK",
    unavailable: null,
  },
  {
    id: "women--team-h-i",
    divisionId: "women",
    name: "TEAM H.I.",
    shirt: "BLUE / WHITE",
    shorts: "BLACK",
    socks: "RED / BLACK",
    unavailable:
      "4th-5th, 11th-12th, 18th, 25th July, 1st, 8th-9th, Aug, 10th, 25th Oct, 7th-8th, 14th, 28th Nov",
  },
  {
    id: "women--ora",
    divisionId: "women",
    name: "ORA",
    shirt: "WHITE / BLACK",
    shorts: "BLACK",
    socks: "WHITE / BLACK",
    unavailable:
      "Avoid 28 Sep \u2013 3 Oct, 12 \u2013 18 Oct, and November if possible due to University examinations.",
  },
  {
    id: "women--hollandse",
    divisionId: "women",
    name: "HOLLANDSE",
    shirt: "ORANGE / NAVY",
    shorts: "NAVY",
    socks: "ORANGE",
    unavailable: "8 & 9 AUG, 10 & 11 OKT, 7 & 8 NOV",
  },
  {
    id: "women--silversticks-senoritas",
    divisionId: "women",
    name: "SILVERSTICKS SENORITAS",
    shirt: "WHITE",
    shorts: "BLACK",
    socks: "BLACK",
    unavailable: null,
  },
  {
    id: "women--hypernovas",
    divisionId: "women",
    name: "HYPERNOVAS",
    shirt: "BLACK / PINK",
    shorts: "BLACK",
    socks: "BLACK / RED",
    unavailable: null,
  },
  {
    id: "women--crescent",
    divisionId: "women",
    name: "CRESCENT",
    shirt: "YELLOW / BLUE",
    shorts: "BLACK / BLUE",
    socks: "YELLOW / BLACK",
    unavailable:
      "4 - 26 July, 8 - 9 Aug, 5 Sep - 13 Sep (Sept School Hols), 3 - 4 Oct, 24 Oct - 25 Oct, 7 - 8 Nov",
  },
  {
    id: "premier--ora",
    divisionId: "premier",
    name: "ORA",
    shirt: null,
    shorts: null,
    socks: null,
    unavailable: null,
  },
  {
    id: "premier--thisisri",
    divisionId: "premier",
    name: "THISISRI",
    shirt: null,
    shorts: null,
    socks: null,
    unavailable: null,
  },
  {
    id: "premier--tornados",
    divisionId: "premier",
    name: "TORNADOS",
    shirt: null,
    shorts: null,
    socks: null,
    unavailable: null,
  },
  {
    id: "premier--hollandse",
    divisionId: "premier",
    name: "HOLLANDSE",
    shirt: null,
    shorts: null,
    socks: null,
    unavailable: null,
  },
  {
    id: "premier--singapore-khalsa-association",
    divisionId: "premier",
    name: "SINGAPORE KHALSA ASSOCIATION",
    shirt: "YELLOW / BLUE",
    shorts: "BLACK",
    socks: "BLACK / BLUE",
    unavailable: "8th - 9th, 15th - 16th, 22nd - 23rd Aug, 7th-8th, 21st Nov",
  },
  {
    id: "premier--balestier-lions",
    divisionId: "premier",
    name: "BALESTIER LIONS",
    shirt: "PURPLE / ORANGE",
    shorts: "BLACK",
    socks: "WHITE / BLACK",
    unavailable: null,
  },
  {
    id: "premier--team-h-i",
    divisionId: "premier",
    name: "TEAM H.I.",
    shirt: null,
    shorts: null,
    socks: null,
    unavailable: null,
  },
  {
    id: "premier--jansenites",
    divisionId: "premier",
    name: "JANSENITES",
    shirt: "GREEN / BLACK",
    shorts: "BLACK",
    socks: "BLACK / RED",
    unavailable: null,
  },
  {
    id: "premier--sg-masters",
    divisionId: "premier",
    name: "SG MASTERS",
    shirt: null,
    shorts: null,
    socks: null,
    unavailable: "Have the games played after the World Cup",
  },
  {
    id: "u21-girls--republic-polytechnic",
    divisionId: "u21-girls",
    name: "REPUBLIC POLYTECHNIC",
    shirt: "GREEN / BLACK / PINK",
    shorts: "BLACK",
    socks: "BLACK",
    unavailable: "14 August 2026 \u2013 30 August 2026",
  },
  {
    id: "u21-girls--aha-dc",
    divisionId: "u21-girls",
    name: "AHA DC",
    shirt: null,
    shorts: null,
    socks: null,
    unavailable: null,
  },
  {
    id: "u21-girls--scc",
    divisionId: "u21-girls",
    name: "SCC",
    shirt: null,
    shorts: null,
    socks: null,
    unavailable: null,
  },
  {
    id: "u21-girls--ejc-tannibellies",
    divisionId: "u21-girls",
    name: "EJC TANNIBELLIES",
    shirt: "BLUE / WHITE",
    shorts: "BLACK",
    socks: "BLUE / WHITE",
    unavailable: "25th Aug - 5th Oct",
  },
  {
    id: "u21-girls--crescent-fire-horse",
    divisionId: "u21-girls",
    name: "CRESCENT FIRE HORSE",
    shirt: null,
    shorts: null,
    socks: null,
    unavailable: null,
  },
  {
    id: "u21-girls--uwcsea-dover",
    divisionId: "u21-girls",
    name: "UWCSEA DOVER",
    shirt: "BLUE / WHITE",
    shorts: "BLUE / WHITE",
    socks: null,
    unavailable: "1 July to 16 Aug 2026",
  },
  {
    id: "u21-girls--jansenites",
    divisionId: "u21-girls",
    name: "JANSENITES",
    shirt: "BLUE / WHITE",
    shorts: "BLACK",
    socks: "BLUE / BLACK",
    unavailable: null,
  },
  {
    id: "u21-boys--ora",
    divisionId: "u21-boys",
    name: "ORA",
    shirt: null,
    shorts: null,
    socks: null,
    unavailable: "1st Sept - 18th Oct, 21st Nov, 28th-29th Nov, Dec",
  },
  {
    id: "u21-boys--singapore-polytechnic",
    divisionId: "u21-boys",
    name: "SINGAPORE POLYTECHNIC",
    shirt: "BLACK / YELLOW",
    shorts: "BLACK",
    socks: "BLACK / WHITE",
    unavailable: "8-30 August (Exams)",
  },
  {
    id: "u21-boys--lch-young-boys",
    divisionId: "u21-boys",
    name: "LCH YOUNG BOYS",
    shirt: "PINK / LIGHT BLUE",
    shorts: "BLACK",
    socks: "BLACK / WHITE",
    unavailable: "25-26 July, 1-2, 8-9 August, 12-13, 19 September 2026",
  },
  {
    id: "u21-boys--republic-polytechnic",
    divisionId: "u21-boys",
    name: "REPUBLIC POLYTECHNIC",
    shirt: "GREEN / BLACK / BLUE",
    shorts: "BLACK",
    socks: "BLACK",
    unavailable: "14 August 2026 \u2013 30 August 2026",
  },
];

import { matches } from "./matches.generated.ts";
export const teamsOf = (divisionId: DivisionId) => teams.filter((t) => t.divisionId === divisionId);

export const matchesOf = (divisionId: DivisionId) =>
  matches
    .filter((m) => m.divisionId === divisionId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

export const isPlayed = (m: Match) => m.homeGoals !== null && m.awayGoals !== null && !m.postponed;

export const playedOf = (divisionId: DivisionId) => matchesOf(divisionId).filter(isPlayed);

export const matchDates = (divisionId: DivisionId) => [
  ...new Set(matchesOf(divisionId).map((m) => m.date)),
];

export type Standing = {
  team: Team;
  gp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  form: ("W" | "D" | "L")[];
};

export function standings(divisionId: DivisionId): Standing[] {
  const map = new Map<string, Standing>();
  for (const t of teamsOf(divisionId)) {
    map.set(t.id, { team: t, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] });
  }
  for (const m of playedOf(divisionId)) {
    const h = m.homeId ? map.get(m.homeId) : null;
    const a = m.awayId ? map.get(m.awayId) : null;
    if (!h || !a) continue;
    const hg = m.homeGoals!;
    const ag = m.awayGoals!;
    h.gp++;
    a.gp++;
    h.gf += hg;
    h.ga += ag;
    a.gf += ag;
    a.ga += hg;
    if (hg === ag) {
      h.d++;
      a.d++;
      h.pts++;
      a.pts++;
      h.form.push("D");
      a.form.push("D");
    } else if (hg > ag) {
      h.w++;
      h.pts += 3;
      a.l++;
      h.form.push("W");
      a.form.push("L");
    } else {
      a.w++;
      a.pts += 3;
      h.l++;
      a.form.push("W");
      h.form.push("L");
    }
  }
  return [...map.values()]
    .map((s) => ({ ...s, gd: s.gf - s.ga, form: s.form.slice(-5) }))
    .sort(
      (x, y) =>
        y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.name.localeCompare(y.team.name),
    );
}

export const nextDate = (divisionId: DivisionId) => {
  const up = matchesOf(divisionId).filter((m) => !isPlayed(m));
  return up[0]?.date ?? matchDates(divisionId)[0] ?? SEASON.start;
};
