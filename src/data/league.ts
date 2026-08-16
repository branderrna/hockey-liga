export type DivisionId = "women" | "premier" | "u21-girls" | "u21-boys";

export type League = {
  id: string;
  name: string;
  short: string;
  divisions: { id: DivisionId; name: string; short: string }[];
};

export type Team = {
  id: string;
  divisionId: DivisionId;
  name: string;
  shirt: string | null;
  shorts: string | null;
  socks: string | null;
  unavailable: string | null;
};

export type Match = {
  id: string;
  divisionId: DivisionId;
  date: string;
  time: string;
  venue: string;
  homeId: string | null;
  awayId: string | null;
  homeName: string;
  awayName: string;
  homeGoals: number | null;
  awayGoals: number | null;
  postponed: boolean;
  note: string | null;
};

export const SEASON = {
  name: "Hockey Liga 2026",
  subtitle: "Women's · Premier · Youth (U21) — three concurrent ligas",
  start: "2026-08-02",
  end: "2026-11-29",
};

export const leagues: League[] = [
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

export const divisions = leagues.flatMap((l) => l.divisions.map((d) => ({ ...d, leagueId: l.id, leagueName: l.name })));

export const divisionById = (id: DivisionId) => divisions.find((d) => d.id === id)!;

export const teams: Team[] = [
  { id: "women--lion-city-hockey-club", divisionId: "women", name: "LION CITY HOCKEY CLUB", shirt: "PINK / LIGHT BLUE", shorts: "BLACK", socks: "BLACK / WHITE & BLUE STRIPES", unavailable: "25-26 July, 1-2, 8-9 August, 12-13, 19 September 2026" },
  { id: "women--tornados", divisionId: "women", name: "TORNADOS", shirt: "MAROON / WHITE", shorts: "BLUE", socks: "MAROON", unavailable: null },
  { id: "women--singapore-polytechnic", divisionId: "women", name: "SINGAPORE POLYTECHNIC", shirt: "BLACK / YELLOW", shorts: "BLACK", socks: "BLACK / RED", unavailable: "8-30 August (Examinations + stand down)" },
  { id: "women--scc", divisionId: "women", name: "SCC", shirt: null, shorts: null, socks: null, unavailable: null },
  { id: "women--jansenites", divisionId: "women", name: "JANSENITES", shirt: "GREEN / BLACK", shorts: "BLACK", socks: "BLACK / RED", unavailable: null },
  { id: "women--oldham", divisionId: "women", name: "OLDHAM", shirt: null, shorts: null, socks: null, unavailable: null },
  { id: "women--sn-alumni", divisionId: "women", name: "SN ALUMNI", shirt: "DARK BLUE / WHITE", shorts: "BLACK", socks: "BLACK", unavailable: "special request to have Lion City Hockey and/or Tornados games to be immediately before/after SN Alumni games" },
  { id: "women--theresian-fielders", divisionId: "women", name: "THERESIAN FIELDERS", shirt: "YELLOW / DARK NAVY BLUE", shorts: "BLACK", socks: "YELLOW / DARK NAVY BLUE", unavailable: null },
  { id: "women--sg-masters", divisionId: "women", name: "SG MASTERS", shirt: "RED / WHITE", shorts: "BLACK", socks: "RED / BLACK", unavailable: null },
  { id: "women--team-h-i", divisionId: "women", name: "TEAM H.I.", shirt: "BLUE / WHITE", shorts: "BLACK", socks: "RED / BLACK", unavailable: "4th-5th, 11th-12th, 18th, 25th July, 1st, 8th-9th, Aug, 10th, 25th Oct, 7th-8th, 14th, 28th Nov" },
  { id: "women--ora", divisionId: "women", name: "ORA", shirt: "WHITE / BLACK", shorts: "BLACK", socks: "WHITE / BLACK", unavailable: "Avoid 28 Sep \u2013 3 Oct, 12 \u2013 18 Oct, and November if possible due to University examinations." },
  { id: "women--hollandse", divisionId: "women", name: "HOLLANDSE", shirt: "ORANGE / NAVY", shorts: "NAVY", socks: "ORANGE", unavailable: "8 & 9 AUG, 10 & 11 OKT, 7 & 8 NOV" },
  { id: "women--silversticks-senoritas", divisionId: "women", name: "SILVERSTICKS SENORITAS", shirt: "WHITE", shorts: "BLACK", socks: "BLACK", unavailable: null },
  { id: "women--hypernovas", divisionId: "women", name: "HYPERNOVAS", shirt: "BLACK / PINK", shorts: "BLACK", socks: "BLACK / RED", unavailable: null },
  { id: "women--crescent", divisionId: "women", name: "CRESCENT", shirt: "YELLOW / BLUE", shorts: "BLACK / BLUE", socks: "YELLOW / BLACK", unavailable: "4 - 26 July, 8 - 9 Aug, 5 Sep - 13 Sep (Sept School Hols), 3 - 4 Oct, 24 Oct - 25 Oct, 7 - 8 Nov" },
  { id: "premier--ora", divisionId: "premier", name: "ORA", shirt: null, shorts: null, socks: null, unavailable: null },
  { id: "premier--thisisri", divisionId: "premier", name: "THISISRI", shirt: null, shorts: null, socks: null, unavailable: null },
  { id: "premier--tornados", divisionId: "premier", name: "TORNADOS", shirt: null, shorts: null, socks: null, unavailable: null },
  { id: "premier--hollandse", divisionId: "premier", name: "HOLLANDSE", shirt: null, shorts: null, socks: null, unavailable: null },
  { id: "premier--singapore-khalsa-association", divisionId: "premier", name: "SINGAPORE KHALSA ASSOCIATION", shirt: "YELLOW / BLUE", shorts: "BLACK", socks: "BLACK / BLUE", unavailable: "8th - 9th, 15th - 16th, 22nd - 23rd Aug, 7th-8th, 21st Nov" },
  { id: "premier--balestier-lions", divisionId: "premier", name: "BALESTIER LIONS", shirt: "PURPLE / ORANGE", shorts: "BLACK", socks: "WHITE / BLACK", unavailable: null },
  { id: "premier--team-h-i", divisionId: "premier", name: "TEAM H.I.", shirt: null, shorts: null, socks: null, unavailable: null },
  { id: "premier--jansenites", divisionId: "premier", name: "JANSENITES", shirt: "GREEN / BLACK", shorts: "BLACK", socks: "BLACK / RED", unavailable: null },
  { id: "premier--sg-masters", divisionId: "premier", name: "SG MASTERS", shirt: null, shorts: null, socks: null, unavailable: "Have the games played after the World Cup" },
  { id: "u21-girls--republic-polytechnic", divisionId: "u21-girls", name: "REPUBLIC POLYTECHNIC", shirt: "GREEN / BLACK / PINK", shorts: "BLACK", socks: "BLACK", unavailable: "14 August 2026 \u2013 30 August 2026" },
  { id: "u21-girls--aha-dc", divisionId: "u21-girls", name: "AHA DC", shirt: null, shorts: null, socks: null, unavailable: null },
  { id: "u21-girls--scc", divisionId: "u21-girls", name: "SCC", shirt: null, shorts: null, socks: null, unavailable: null },
  { id: "u21-girls--ejc-tannibellies", divisionId: "u21-girls", name: "EJC TANNIBELLIES", shirt: "BLUE / WHITE", shorts: "BLACK", socks: "BLUE / WHITE", unavailable: "25th Aug - 5th Oct" },
  { id: "u21-girls--crescent-fire-horse", divisionId: "u21-girls", name: "CRESCENT FIRE HORSE", shirt: null, shorts: null, socks: null, unavailable: null },
  { id: "u21-girls--uwcsea-dover", divisionId: "u21-girls", name: "UWCSEA DOVER", shirt: "BLUE / WHITE", shorts: "BLUE / WHITE", socks: null, unavailable: "1 July to 16 Aug 2026" },
  { id: "u21-girls--jansenites", divisionId: "u21-girls", name: "JANSENITES", shirt: "BLUE / WHITE", shorts: "BLACK", socks: "BLUE / BLACK", unavailable: null },
  { id: "u21-boys--ora", divisionId: "u21-boys", name: "ORA", shirt: null, shorts: null, socks: null, unavailable: "1st Sept - 18th Oct, 21st Nov, 28th-29th Nov, Dec" },
  { id: "u21-boys--singapore-polytechnic", divisionId: "u21-boys", name: "SINGAPORE POLYTECHNIC", shirt: "BLACK / YELLOW", shorts: "BLACK", socks: "BLACK / WHITE", unavailable: "8-30 August (Exams)" },
  { id: "u21-boys--lch-young-boys", divisionId: "u21-boys", name: "LCH YOUNG BOYS", shirt: "PINK / LIGHT BLUE", shorts: "BLACK", socks: "BLACK / WHITE", unavailable: "25-26 July, 1-2, 8-9 August, 12-13, 19 September 2026" },
  { id: "u21-boys--republic-polytechnic", divisionId: "u21-boys", name: "REPUBLIC POLYTECHNIC", shirt: "GREEN / BLACK / BLUE", shorts: "BLACK", socks: "BLACK", unavailable: "14 August 2026 \u2013 30 August 2026" }
];

export const matches: Match[] = [
  { id: "m2", divisionId: "u21-girls", date: "2026-08-02", time: "16:00", venue: "CCAB", homeId: "u21-girls--ejc-tannibellies", awayId: "u21-girls--crescent-fire-horse", homeName: "EJC TANNIBELLIES", awayName: "CRESCENT FIRE HORSE", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 13th Oct, 5pm" },
  { id: "m3", divisionId: "premier", date: "2026-08-02", time: "16:00", venue: "CCAB", homeId: "premier--hollandse", awayId: "premier--jansenites", homeName: "HOLLANDSE", awayName: "JANSENITES", homeGoals: 4, awayGoals: 0, postponed: false, note: "Timing changed from 6pm to 4pm" },
  { id: "m4", divisionId: "u21-boys", date: "2026-08-02", time: "15:00", venue: "DELTA", homeId: "u21-boys--ora", awayId: "u21-boys--republic-polytechnic", homeName: "ORA", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 1st Nov, 6pm" },
  { id: "m5", divisionId: "u21-girls", date: "2026-08-02", time: "16:00", venue: "DELTA", homeId: "u21-girls--republic-polytechnic", awayId: "u21-girls--aha-dc", homeName: "REPUBLIC POLYTECHNIC", awayName: "AHA DC", homeGoals: 0, awayGoals: 0, postponed: true, note: "Game shifted to 13th Sept, 7pm, 15 min played" },
  { id: "m6", divisionId: "u21-girls", date: "2026-08-02", time: "17:00", venue: "DELTA", homeId: "u21-girls--scc", awayId: "u21-girls--jansenites", homeName: "SCC", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 13th Sept, 6pm" },
  { id: "m7", divisionId: "premier", date: "2026-08-02", time: "18:00", venue: "DELTA", homeId: "premier--singapore-khalsa-association", awayId: "premier--team-h-i", homeName: "SINGAPORE KHALSA ASSOCIATION", awayName: "TEAM H.I.", homeGoals: 3, awayGoals: 3, postponed: false, note: null },
  { id: "m8", divisionId: "premier", date: "2026-08-02", time: "19:00", venue: "DELTA", homeId: "premier--tornados", awayId: "premier--balestier-lions", homeName: "TORNADOS", awayName: "BALESTIER LIONS", homeGoals: 1, awayGoals: 0, postponed: false, note: null },
  { id: "m9", divisionId: "u21-girls", date: "2026-08-15", time: "15:00", venue: "CCAB", homeId: "u21-girls--crescent-fire-horse", awayId: "u21-girls--jansenites", homeName: "CRESCENT FIRE HORSE", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m10", divisionId: "u21-girls", date: "2026-08-15", time: "16:00", venue: "CCAB", homeId: "u21-girls--aha-dc", awayId: "u21-girls--ejc-tannibellies", homeName: "AHA DC", awayName: "EJC TANNIBELLIES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m11", divisionId: "u21-boys", date: "2026-08-15", time: "17:00", venue: "CCAB", homeId: "u21-boys--ora", awayId: "u21-boys--lch-young-boys", homeName: "ORA", awayName: "LCH YOUNG BOYS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m12", divisionId: "women", date: "2026-08-15", time: "18:00", venue: "CCAB", homeId: "women--scc", awayId: "women--hypernovas", homeName: "SCC", awayName: "HYPERNOVAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m13", divisionId: "premier", date: "2026-08-15", time: "19:00", venue: "CCAB", homeId: "premier--hollandse", awayId: "premier--sg-masters", homeName: "HOLLANDSE", awayName: "SG MASTERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m14", divisionId: "women", date: "2026-08-15", time: "17:00", venue: "DELTA", homeId: "women--lion-city-hockey-club", awayId: "women--tornados", homeName: "LION CITY HOCKEY CLUB", awayName: "TORNADOS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m15", divisionId: "women", date: "2026-08-15", time: "18:00", venue: "DELTA", homeId: "women--sn-alumni", awayId: "women--ora", homeName: "SN ALUMNI", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m16", divisionId: "premier", date: "2026-08-15", time: "19:00", venue: "DELTA", homeId: "premier--tornados", awayId: "premier--team-h-i", homeName: "TORNADOS", awayName: "TEAM H.I.", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m17", divisionId: "women", date: "2026-08-16", time: "15:00", venue: "CCAB", homeId: "women--theresian-fielders", awayId: "women--team-h-i", homeName: "THERESIAN FIELDERS", awayName: "TEAM H.I.", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m18", divisionId: "women", date: "2026-08-16", time: "16:00", venue: "CCAB", homeId: "women--sg-masters", awayId: "women--crescent", homeName: "SG MASTERS", awayName: "CRESCENT", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m19", divisionId: "women", date: "2026-08-16", time: "15:00", venue: "DELTA", homeId: "women--jansenites", awayId: "women--silversticks-senoritas", homeName: "JANSENITES", awayName: "SILVERSTICKS SENORITAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m20", divisionId: "women", date: "2026-08-16", time: "16:00", venue: "DELTA", homeId: "women--oldham", awayId: "women--hollandse", homeName: "OLDHAM", awayName: "HOLLANDSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m21", divisionId: "premier", date: "2026-08-16", time: "17:00", venue: "DELTA", homeId: "premier--ora", awayId: "premier--balestier-lions", homeName: "ORA", awayName: "BALESTIER LIONS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m22", divisionId: "premier", date: "2026-08-16", time: "18:00", venue: "DELTA", homeId: "premier--jansenites", awayId: "premier--thisisri", homeName: "JANSENITES", awayName: "THISISRI", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m23", divisionId: "u21-girls", date: "2026-08-22", time: "15:00", venue: "CCAB", homeId: "u21-girls--scc", awayId: "u21-girls--crescent-fire-horse", homeName: "SCC", awayName: "CRESCENT FIRE HORSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m24", divisionId: "u21-girls", date: "2026-08-22", time: "16:00", venue: "CCAB", homeId: "u21-girls--aha-dc", awayId: "u21-girls--jansenites", homeName: "AHA DC", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m25", divisionId: "u21-girls", date: "2026-08-22", time: "17:00", venue: "CCAB", homeId: "u21-girls--ejc-tannibellies", awayId: "u21-girls--uwcsea-dover", homeName: "EJC TANNIBELLIES", awayName: "UWCSEA DOVER", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m26", divisionId: "u21-boys", date: "2026-08-22", time: "18:00", venue: "CCAB", homeId: "u21-boys--ora", awayId: "u21-boys--lch-young-boys", homeName: "ORA", awayName: "LCH YOUNG BOYS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m27", divisionId: "women", date: "2026-08-22", time: "19:00", venue: "CCAB", homeId: "women--lion-city-hockey-club", awayId: "women--sg-masters", homeName: "LION CITY HOCKEY CLUB", awayName: "SG MASTERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m28", divisionId: "women", date: "2026-08-22", time: "17:00", venue: "DELTA", homeId: "women--theresian-fielders", awayId: "women--ora", homeName: "THERESIAN FIELDERS", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m29", divisionId: "premier", date: "2026-08-22", time: "18:00", venue: "DELTA", homeId: "premier--ora", awayId: "premier--hollandse", homeName: "ORA", awayName: "HOLLANDSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m30", divisionId: "premier", date: "2026-08-22", time: "19:00", venue: "DELTA", homeId: "premier--thisisri", awayId: "premier--tornados", homeName: "THISISRI", awayName: "TORNADOS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m31", divisionId: "women", date: "2026-08-23", time: "15:00", venue: "CCAB", homeId: "women--team-h-i", awayId: "women--ora", homeName: "TEAM H.I.", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m32", divisionId: "women", date: "2026-08-23", time: "16:00", venue: "CCAB", homeId: "women--sn-alumni", awayId: "women--hollandse", homeName: "SN ALUMNI", awayName: "HOLLANDSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m33", divisionId: "u21-girls", date: "2026-08-23", time: "15:00", venue: "DELTA", homeId: "u21-girls--crescent-fire-horse", awayId: "u21-girls--ejc-tannibellies", homeName: "CRESCENT FIRE HORSE", awayName: "EJC TANNIBELLIES", homeGoals: null, awayGoals: null, postponed: false, note: "Venue changed" },
  { id: "m34", divisionId: "women", date: "2026-08-23", time: "16:00", venue: "DELTA", homeId: "women--crescent", awayId: "women--scc", homeName: "CRESCENT", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m35", divisionId: "women", date: "2026-08-23", time: "17:00", venue: "DELTA", homeId: "women--silversticks-senoritas", awayId: "women--oldham", homeName: "SILVERSTICKS SENORITAS", awayName: "OLDHAM", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m36", divisionId: "women", date: "2026-08-23", time: "18:00", venue: "DELTA", homeId: "women--hypernovas", awayId: "women--jansenites", homeName: "HYPERNOVAS", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 31st Oct, 6pm" },
  { id: "m1", divisionId: "premier", date: "2026-08-23", time: "18:00", venue: "DELTA", homeId: "premier--ora", awayId: "premier--thisisri", homeName: "ORA", awayName: "THISISRI", homeGoals: 1, awayGoals: 0, postponed: true, note: "Game shifted from 2nd Aug, 3pm. 9 min played" },
  { id: "m37", divisionId: "premier", date: "2026-08-23", time: "19:00", venue: "DELTA", homeId: "premier--sg-masters", awayId: "premier--jansenites", homeName: "SG MASTERS", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m38", divisionId: "u21-girls", date: "2026-08-29", time: "15:00", venue: "CCAB", homeId: "u21-girls--aha-dc", awayId: "u21-girls--scc", homeName: "AHA DC", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m39", divisionId: "u21-girls", date: "2026-08-29", time: "16:00", venue: "CCAB", homeId: "u21-girls--uwcsea-dover", awayId: "u21-girls--jansenites", homeName: "UWCSEA DOVER", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m40", divisionId: "women", date: "2026-08-29", time: "17:00", venue: "CCAB", homeId: "women--jansenites", awayId: "women--sn-alumni", homeName: "JANSENITES", awayName: "SN ALUMNI", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m132", divisionId: "women", date: "2026-08-29", time: "18:00", venue: "CCAB", homeId: "women--scc", awayId: "women--oldham", homeName: "SCC", awayName: "OLDHAM", homeGoals: null, awayGoals: null, postponed: false, note: "Game shifted from 10th Oct, 5pm" },
  { id: "m41", divisionId: "women", date: "2026-08-29", time: "17:00", venue: "DELTA", homeId: "women--ora", awayId: "women--lion-city-hockey-club", homeName: "ORA", awayName: "LION CITY HOCKEY CLUB", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m42", divisionId: "women", date: "2026-08-29", time: "18:00", venue: "DELTA", homeId: "women--silversticks-senoritas", awayId: "women--hypernovas", homeName: "SILVERSTICKS SENORITAS", awayName: "HYPERNOVAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m43", divisionId: "premier", date: "2026-08-29", time: "19:00", venue: "DELTA", homeId: "premier--sg-masters", awayId: "premier--tornados", homeName: "SG MASTERS", awayName: "TORNADOS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m44", divisionId: "premier", date: "2026-08-29", time: "20:00", venue: "DELTA", homeId: "premier--balestier-lions", awayId: "premier--singapore-khalsa-association", homeName: "BALESTIER LIONS", awayName: "SINGAPORE KHALSA ASSOCIATION", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m45", divisionId: "women", date: "2026-08-30", time: "15:00", venue: "CCAB", homeId: "women--hollandse", awayId: "women--crescent", homeName: "HOLLANDSE", awayName: "CRESCENT", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m46", divisionId: "premier", date: "2026-08-30", time: "16:00", venue: "CCAB", homeId: "premier--hollandse", awayId: "premier--singapore-khalsa-association", homeName: "HOLLANDSE", awayName: "SINGAPORE KHALSA ASSOCIATION", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m47", divisionId: "women", date: "2026-08-30", time: "15:00", venue: "DELTA", homeId: "women--scc", awayId: "women--theresian-fielders", homeName: "SCC", awayName: "THERESIAN FIELDERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m48", divisionId: "women", date: "2026-08-30", time: "16:00", venue: "DELTA", homeId: "women--tornados", awayId: "women--team-h-i", homeName: "TORNADOS", awayName: "TEAM H.I.", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m49", divisionId: "women", date: "2026-08-30", time: "17:00", venue: "DELTA", homeId: "women--ora", awayId: "women--sg-masters", homeName: "ORA", awayName: "SG MASTERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m50", divisionId: "premier", date: "2026-08-30", time: "18:00", venue: "DELTA", homeId: "premier--jansenites", awayId: "premier--ora", homeName: "JANSENITES", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m51", divisionId: "premier", date: "2026-08-30", time: "19:00", venue: "DELTA", homeId: "premier--team-h-i", awayId: "premier--thisisri", homeName: "TEAM H.I.", awayName: "THISISRI", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m52", divisionId: "u21-boys", date: "2026-09-05", time: "15:00", venue: "CCAB", homeId: "u21-boys--singapore-polytechnic", awayId: "u21-boys--republic-polytechnic", homeName: "SINGAPORE POLYTECHNIC", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m53", divisionId: "u21-girls", date: "2026-09-05", time: "16:00", venue: "CCAB", homeId: "u21-girls--republic-polytechnic", awayId: "u21-girls--uwcsea-dover", homeName: "REPUBLIC POLYTECHNIC", awayName: "UWCSEA DOVER", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m54", divisionId: "u21-girls", date: "2026-09-05", time: "17:00", venue: "CCAB", homeId: "u21-girls--aha-dc", awayId: "u21-girls--crescent-fire-horse", homeName: "AHA DC", awayName: "CRESCENT FIRE HORSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m55", divisionId: "women", date: "2026-09-05", time: "18:00", venue: "CCAB", homeId: "women--silversticks-senoritas", awayId: "women--tornados", homeName: "SILVERSTICKS SENORITAS", awayName: "TORNADOS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m56", divisionId: "premier", date: "2026-09-05", time: "19:00", venue: "CCAB", homeId: "premier--ora", awayId: "premier--tornados", homeName: "ORA", awayName: "TORNADOS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m57", divisionId: "women", date: "2026-09-05", time: "17:00", venue: "DELTA", homeId: "women--hypernovas", awayId: "women--lion-city-hockey-club", homeName: "HYPERNOVAS", awayName: "LION CITY HOCKEY CLUB", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m58", divisionId: "women", date: "2026-09-05", time: "18:00", venue: "DELTA", homeId: "women--jansenites", awayId: "women--team-h-i", homeName: "JANSENITES", awayName: "TEAM H.I.", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m59", divisionId: "women", date: "2026-09-05", time: "19:00", venue: "DELTA", homeId: "women--oldham", awayId: "women--singapore-polytechnic", homeName: "OLDHAM", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m60", divisionId: "premier", date: "2026-09-05", time: "19:00", venue: "DELTA", homeId: "premier--balestier-lions", awayId: "premier--hollandse", homeName: "BALESTIER LIONS", awayName: "HOLLANDSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m61", divisionId: "u21-girls", date: "2026-09-06", time: "15:00", venue: "CCAB", homeId: "u21-girls--republic-polytechnic", awayId: "u21-girls--jansenites", homeName: "REPUBLIC POLYTECHNIC", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m62", divisionId: "u21-boys", date: "2026-09-06", time: "16:00", venue: "CCAB", homeId: "u21-boys--lch-young-boys", awayId: "u21-boys--republic-polytechnic", homeName: "LCH YOUNG BOYS", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m63", divisionId: "premier", date: "2026-09-06", time: "18:00", venue: "CCAB", homeId: "premier--sg-masters", awayId: "premier--team-h-i", homeName: "SG MASTERS", awayName: "TEAM H.I.", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m64", divisionId: "u21-girls", date: "2026-09-06", time: "15:00", venue: "DELTA", homeId: "u21-girls--scc", awayId: "u21-girls--uwcsea-dover", homeName: "SCC", awayName: "UWCSEA DOVER", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m65", divisionId: "women", date: "2026-09-06", time: "16:00", venue: "DELTA", homeId: "women--scc", awayId: "women--ora", homeName: "SCC", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m66", divisionId: "women", date: "2026-09-06", time: "17:00", venue: "DELTA", homeId: "women--sn-alumni", awayId: "women--theresian-fielders", homeName: "SN ALUMNI", awayName: "THERESIAN FIELDERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m67", divisionId: "women", date: "2026-09-06", time: "18:00", venue: "DELTA", homeId: "women--hollandse", awayId: "women--sg-masters", homeName: "HOLLANDSE", awayName: "SG MASTERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m68", divisionId: "premier", date: "2026-09-06", time: "19:00", venue: "DELTA", homeId: "premier--singapore-khalsa-association", awayId: "premier--jansenites", homeName: "SINGAPORE KHALSA ASSOCIATION", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m69", divisionId: "u21-boys", date: "2026-09-12", time: "15:00", venue: "CCAB", homeId: "u21-boys--republic-polytechnic", awayId: "u21-boys--singapore-polytechnic", homeName: "REPUBLIC POLYTECHNIC", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m70", divisionId: "u21-girls", date: "2026-09-12", time: "16:00", venue: "CCAB", homeId: "u21-girls--republic-polytechnic", awayId: "u21-girls--scc", homeName: "REPUBLIC POLYTECHNIC", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m71", divisionId: "women", date: "2026-09-12", time: "17:00", venue: "CCAB", homeId: "women--silversticks-senoritas", awayId: "women--scc", homeName: "SILVERSTICKS SENORITAS", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m72", divisionId: "women", date: "2026-09-12", time: "18:00", venue: "CCAB", homeId: "women--ora", awayId: "women--tornados", homeName: "ORA", awayName: "TORNADOS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m73", divisionId: "women", date: "2026-09-12", time: "19:00", venue: "CCAB", homeId: "women--hypernovas", awayId: "women--sg-masters", homeName: "HYPERNOVAS", awayName: "SG MASTERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m74", divisionId: "u21-girls", date: "2026-09-12", time: "17:00", venue: "DELTA", homeId: "u21-girls--jansenites", awayId: "u21-girls--aha-dc", homeName: "JANSENITES", awayName: "AHA DC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m75", divisionId: "women", date: "2026-09-12", time: "18:00", venue: "DELTA", homeId: "women--jansenites", awayId: "women--hollandse", homeName: "JANSENITES", awayName: "HOLLANDSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m76", divisionId: "premier", date: "2026-09-12", time: "19:00", venue: "DELTA", homeId: "premier--team-h-i", awayId: "premier--jansenites", homeName: "TEAM H.I.", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m77", divisionId: "premier", date: "2026-09-12", time: "20:00", venue: "DELTA", homeId: "premier--balestier-lions", awayId: "premier--sg-masters", homeName: "BALESTIER LIONS", awayName: "SG MASTERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m78", divisionId: "premier", date: "2026-09-13", time: "15:00", venue: "CCAB", homeId: "premier--singapore-khalsa-association", awayId: "premier--ora", homeName: "SINGAPORE KHALSA ASSOCIATION", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m79", divisionId: "premier", date: "2026-09-13", time: "16:00", venue: "CCAB", homeId: "premier--thisisri", awayId: "premier--hollandse", homeName: "THISISRI", awayName: "HOLLANDSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m6", divisionId: "u21-girls", date: "2026-09-13", time: "18:00", venue: "CCAB", homeId: "u21-girls--scc", awayId: "u21-girls--jansenites", homeName: "SCC", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: "Game shifted from 2nd Aug, 5pm" },
  { id: "m80", divisionId: "u21-girls", date: "2026-09-13", time: "15:00", venue: "DELTA", homeId: "u21-girls--uwcsea-dover", awayId: "u21-girls--crescent-fire-horse", homeName: "UWCSEA DOVER", awayName: "CRESCENT FIRE HORSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m81", divisionId: "women", date: "2026-09-13", time: "16:00", venue: "DELTA", homeId: "women--oldham", awayId: "women--ora", homeName: "OLDHAM", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m82", divisionId: "women", date: "2026-09-13", time: "17:00", venue: "DELTA", homeId: "women--sn-alumni", awayId: "women--team-h-i", homeName: "SN ALUMNI", awayName: "TEAM H.I.", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m83", divisionId: "women", date: "2026-09-13", time: "18:00", venue: "DELTA", homeId: "women--theresian-fielders", awayId: "women--singapore-polytechnic", homeName: "THERESIAN FIELDERS", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m5", divisionId: "u21-girls", date: "2026-09-13", time: "19:00", venue: "DELTA", homeId: "u21-girls--republic-polytechnic", awayId: "u21-girls--aha-dc", homeName: "REPUBLIC POLYTECHNIC", awayName: "AHA DC", homeGoals: 0, awayGoals: 0, postponed: true, note: "Game shifted from 2nd Aug, 15 min played" },
  { id: "m84", divisionId: "u21-girls", date: "2026-09-19", time: "15:00", venue: "CCAB", homeId: "u21-girls--republic-polytechnic", awayId: "u21-girls--crescent-fire-horse", homeName: "REPUBLIC POLYTECHNIC", awayName: "CRESCENT FIRE HORSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m85", divisionId: "u21-girls", date: "2026-09-19", time: "16:00", venue: "CCAB", homeId: "u21-girls--aha-dc", awayId: "u21-girls--uwcsea-dover", homeName: "AHA DC", awayName: "UWCSEA DOVER", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m86", divisionId: "women", date: "2026-09-19", time: "17:00", venue: "CCAB", homeId: "women--singapore-polytechnic", awayId: "women--team-h-i", homeName: "SINGAPORE POLYTECHNIC", awayName: "TEAM H.I.", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m87", divisionId: "women", date: "2026-09-19", time: "18:00", venue: "CCAB", homeId: "women--oldham", awayId: "women--hypernovas", homeName: "OLDHAM", awayName: "HYPERNOVAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m88", divisionId: "premier", date: "2026-09-19", time: "19:00", venue: "CCAB", homeId: "premier--team-h-i", awayId: "premier--balestier-lions", homeName: "TEAM H.I.", awayName: "BALESTIER LIONS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m89", divisionId: "women", date: "2026-09-19", time: "17:00", venue: "DELTA", homeId: "women--theresian-fielders", awayId: "women--hollandse", homeName: "THERESIAN FIELDERS", awayName: "HOLLANDSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m90", divisionId: "women", date: "2026-09-19", time: "18:00", venue: "DELTA", homeId: "women--tornados", awayId: "women--sg-masters", homeName: "TORNADOS", awayName: "SG MASTERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m91", divisionId: "premier", date: "2026-09-19", time: "19:00", venue: "DELTA", homeId: "premier--sg-masters", awayId: "premier--ora", homeName: "SG MASTERS", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m92", divisionId: "premier", date: "2026-09-19", time: "20:00", venue: "DELTA", homeId: "premier--thisisri", awayId: "premier--singapore-khalsa-association", homeName: "THISISRI", awayName: "SINGAPORE KHALSA ASSOCIATION", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m93", divisionId: "u21-girls", date: "2026-09-20", time: "15:00", venue: "CCAB", homeId: "u21-girls--jansenites", awayId: "u21-girls--scc", homeName: "JANSENITES", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m94", divisionId: "women", date: "2026-09-20", time: "16:00", venue: "CCAB", homeId: "women--crescent", awayId: "women--jansenites", homeName: "CRESCENT", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m95", divisionId: "u21-boys", date: "2026-09-20", time: "15:00", venue: "DELTA", homeId: "u21-boys--singapore-polytechnic", awayId: "u21-boys--lch-young-boys", homeName: "SINGAPORE POLYTECHNIC", awayName: "LCH YOUNG BOYS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m96", divisionId: "women", date: "2026-09-20", time: "16:00", venue: "DELTA", homeId: "women--singapore-polytechnic", awayId: "women--ora", homeName: "SINGAPORE POLYTECHNIC", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m97", divisionId: "women", date: "2026-09-20", time: "17:00", venue: "DELTA", homeId: "women--sn-alumni", awayId: "women--silversticks-senoritas", homeName: "SN ALUMNI", awayName: "SILVERSTICKS SENORITAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m98", divisionId: "women", date: "2026-09-20", time: "18:00", venue: "DELTA", homeId: "women--lion-city-hockey-club", awayId: "women--scc", homeName: "LION CITY HOCKEY CLUB", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m99", divisionId: "premier", date: "2026-09-20", time: "19:00", venue: "DELTA", homeId: "premier--tornados", awayId: "premier--hollandse", homeName: "TORNADOS", awayName: "HOLLANDSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m100", divisionId: "u21-boys", date: "2026-09-26", time: "15:00", venue: "CCAB", homeId: "u21-boys--lch-young-boys", awayId: "u21-boys--singapore-polytechnic", homeName: "LCH YOUNG BOYS", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: true, note: "Game postponed to 11th Oct" },
  { id: "m213", divisionId: "women", date: "2026-09-26", time: "15:00", venue: "CCAB", homeId: "women--tornados", awayId: "women--scc", homeName: "TORNADOS", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: "Game shifted from 28th Nov" },
  { id: "m101", divisionId: "u21-boys", date: "2026-09-26", time: "16:00", venue: "CCAB", homeId: "u21-boys--republic-polytechnic", awayId: "u21-boys--lch-young-boys", homeName: "REPUBLIC POLYTECHNIC", awayName: "LCH YOUNG BOYS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m102", divisionId: "u21-girls", date: "2026-09-26", time: "17:00", venue: "CCAB", homeId: "u21-girls--jansenites", awayId: "u21-girls--republic-polytechnic", homeName: "JANSENITES", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m103", divisionId: "women", date: "2026-09-26", time: "18:00", venue: "CCAB", homeId: "women--sg-masters", awayId: "women--jansenites", homeName: "SG MASTERS", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m104", divisionId: "premier", date: "2026-09-26", time: "19:00", venue: "CCAB", homeId: "premier--jansenites", awayId: "premier--balestier-lions", homeName: "JANSENITES", awayName: "BALESTIER LIONS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m105", divisionId: "women", date: "2026-09-26", time: "17:00", venue: "DELTA", homeId: "women--crescent", awayId: "women--theresian-fielders", homeName: "CRESCENT", awayName: "THERESIAN FIELDERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m106", divisionId: "women", date: "2026-09-26", time: "18:00", venue: "DELTA", homeId: "women--ora", awayId: "women--hollandse", homeName: "ORA", awayName: "HOLLANDSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m107", divisionId: "premier", date: "2026-09-26", time: "19:00", venue: "DELTA", homeId: "premier--team-h-i", awayId: "premier--ora", homeName: "TEAM H.I.", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m108", divisionId: "premier", date: "2026-09-26", time: "20:00", venue: "DELTA", homeId: "premier--thisisri", awayId: "premier--sg-masters", homeName: "THISISRI", awayName: "SG MASTERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m109", divisionId: "u21-girls", date: "2026-09-27", time: "15:00", venue: "CCAB", homeId: "u21-girls--crescent-fire-horse", awayId: "u21-girls--aha-dc", homeName: "CRESCENT FIRE HORSE", awayName: "AHA DC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m110", divisionId: "u21-girls", date: "2026-09-27", time: "16:00", venue: "CCAB", homeId: "u21-girls--uwcsea-dover", awayId: "u21-girls--scc", homeName: "UWCSEA DOVER", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m111", divisionId: "women", date: "2026-09-27", time: "15:00", venue: "DELTA", homeId: "women--singapore-polytechnic", awayId: "women--hypernovas", homeName: "SINGAPORE POLYTECHNIC", awayName: "HYPERNOVAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m112", divisionId: "women", date: "2026-09-27", time: "16:00", venue: "DELTA", homeId: "women--team-h-i", awayId: "women--silversticks-senoritas", homeName: "TEAM H.I.", awayName: "SILVERSTICKS SENORITAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m113", divisionId: "women", date: "2026-09-27", time: "17:00", venue: "DELTA", homeId: "women--lion-city-hockey-club", awayId: "women--sn-alumni", homeName: "LION CITY HOCKEY CLUB", awayName: "SN ALUMNI", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m114", divisionId: "women", date: "2026-09-27", time: "18:00", venue: "DELTA", homeId: "women--tornados", awayId: "women--oldham", homeName: "TORNADOS", awayName: "OLDHAM", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m115", divisionId: "premier", date: "2026-09-27", time: "19:00", venue: "DELTA", homeId: "premier--tornados", awayId: "premier--singapore-khalsa-association", homeName: "TORNADOS", awayName: "SINGAPORE KHALSA ASSOCIATION", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m116", divisionId: "u21-boys", date: "2026-10-03", time: "15:00", venue: "CCAB", homeId: "u21-boys--singapore-polytechnic", awayId: "u21-boys--republic-polytechnic", homeName: "SINGAPORE POLYTECHNIC", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m117", divisionId: "u21-girls", date: "2026-10-03", time: "16:00", venue: "CCAB", homeId: "u21-girls--crescent-fire-horse", awayId: "u21-girls--republic-polytechnic", homeName: "CRESCENT FIRE HORSE", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m118", divisionId: "women", date: "2026-10-03", time: "17:00", venue: "CCAB", homeId: "women--oldham", awayId: "women--jansenites", homeName: "OLDHAM", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m119", divisionId: "women", date: "2026-10-03", time: "18:00", venue: "CCAB", homeId: "women--hollandse", awayId: "women--hypernovas", homeName: "HOLLANDSE", awayName: "HYPERNOVAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m120", divisionId: "premier", date: "2026-10-03", time: "19:00", venue: "CCAB", homeId: "premier--singapore-khalsa-association", awayId: "premier--sg-masters", homeName: "SINGAPORE KHALSA ASSOCIATION", awayName: "SG MASTERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m121", divisionId: "women", date: "2026-10-03", time: "17:00", venue: "DELTA", homeId: "women--scc", awayId: "women--sn-alumni", homeName: "SCC", awayName: "SN ALUMNI", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m122", divisionId: "premier", date: "2026-10-03", time: "18:00", venue: "DELTA", homeId: "premier--hollandse", awayId: "premier--team-h-i", homeName: "HOLLANDSE", awayName: "TEAM H.I.", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m123", divisionId: "premier", date: "2026-10-03", time: "19:00", venue: "DELTA", homeId: "premier--jansenites", awayId: "premier--tornados", homeName: "JANSENITES", awayName: "TORNADOS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m124", divisionId: "u21-girls", date: "2026-10-04", time: "15:00", venue: "CCAB", homeId: "u21-girls--scc", awayId: "u21-girls--aha-dc", homeName: "SCC", awayName: "AHA DC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m125", divisionId: "u21-girls", date: "2026-10-04", time: "16:00", venue: "CCAB", homeId: "u21-girls--jansenites", awayId: "u21-girls--uwcsea-dover", homeName: "JANSENITES", awayName: "UWCSEA DOVER", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m126", divisionId: "women", date: "2026-10-04", time: "15:00", venue: "DELTA", homeId: "women--team-h-i", awayId: "women--lion-city-hockey-club", homeName: "TEAM H.I.", awayName: "LION CITY HOCKEY CLUB", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m127", divisionId: "women", date: "2026-10-04", time: "16:00", venue: "DELTA", homeId: "women--tornados", awayId: "women--singapore-polytechnic", homeName: "TORNADOS", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m128", divisionId: "women", date: "2026-10-04", time: "17:00", venue: "DELTA", homeId: "women--sg-masters", awayId: "women--theresian-fielders", homeName: "SG MASTERS", awayName: "THERESIAN FIELDERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m129", divisionId: "premier", date: "2026-10-04", time: "18:00", venue: "DELTA", homeId: "premier--balestier-lions", awayId: "premier--thisisri", homeName: "BALESTIER LIONS", awayName: "THISISRI", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m130", divisionId: "u21-girls", date: "2026-10-10", time: "15:00", venue: "CCAB", homeId: "u21-girls--uwcsea-dover", awayId: "u21-girls--republic-polytechnic", homeName: "UWCSEA DOVER", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m205", divisionId: "women", date: "2026-10-10", time: "16:00", venue: "CCAB", homeId: "women--theresian-fielders", awayId: "women--hypernovas", homeName: "THERESIAN FIELDERS", awayName: "HYPERNOVAS", homeGoals: null, awayGoals: null, postponed: false, note: "Game shifted from 21st Nov" },
  { id: "m134", divisionId: "premier", date: "2026-10-10", time: "17:00", venue: "CCAB", homeId: null, awayId: null, homeName: "6TH", awayName: "8TH", homeGoals: null, awayGoals: null, postponed: false, note: "Timing changed, venue remains" },
  { id: "m131", divisionId: "u21-girls", date: "2026-10-10", time: "16:00", venue: "CCAB", homeId: "u21-girls--scc", awayId: "u21-girls--ejc-tannibellies", homeName: "SCC", awayName: "EJC TANNIBELLIES", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 20th Oct" },
  { id: "m132", divisionId: "women", date: "2026-10-10", time: "17:00", venue: "CCAB", homeId: "women--scc", awayId: "women--oldham", homeName: "SCC", awayName: "OLDHAM", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 29th Aug, 6pm" },
  { id: "m133", divisionId: "women", date: "2026-10-10", time: "18:00", venue: "CCAB", homeId: "women--tornados", awayId: "women--theresian-fielders", homeName: "TORNADOS", awayName: "THERESIAN FIELDERS", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 21st Nov, 5pm" },
  { id: "m135", divisionId: "women", date: "2026-10-10", time: "17:00", venue: "DELTA", homeId: "women--ora", awayId: "women--crescent", homeName: "ORA", awayName: "CRESCENT", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m140", divisionId: "women", date: "2026-10-10", time: "18:00", venue: "DELTA", homeId: "women--lion-city-hockey-club", awayId: "women--singapore-polytechnic", homeName: "LION CITY HOCKEY CLUB", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: "Game shifted from 11th Oct, 3pm" },
  { id: "m136", divisionId: "premier", date: "2026-10-10", time: "18:00", venue: "DELTA", homeId: null, awayId: null, homeName: "1ST", awayName: "3RD", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 11th Oct, 3pm" },
  { id: "m137", divisionId: "premier", date: "2026-10-10", time: "19:00", venue: "DELTA", homeId: null, awayId: null, homeName: "5TH", awayName: "4TH", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m138", divisionId: "u21-girls", date: "2026-10-11", time: "15:00", venue: "CCAB", homeId: "u21-girls--jansenites", awayId: "u21-girls--crescent-fire-horse", homeName: "JANSENITES", awayName: "CRESCENT FIRE HORSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m139", divisionId: "u21-girls", date: "2026-10-11", time: "16:00", venue: "CCAB", homeId: "u21-girls--ejc-tannibellies", awayId: "u21-girls--aha-dc", homeName: "EJC TANNIBELLIES", awayName: "AHA DC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m137", divisionId: "premier", date: "2026-10-11", time: "15:00", venue: "DELTA", homeId: null, awayId: null, homeName: "1ST", awayName: "3RD", homeGoals: null, awayGoals: null, postponed: false, note: "Game shifted from 10th Oct, 6pm" },
  { id: "m140", divisionId: "women", date: "2026-10-11", time: "15:00", venue: "DELTA", homeId: "women--lion-city-hockey-club", awayId: "women--singapore-polytechnic", homeName: "LION CITY HOCKEY CLUB", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 10th Oct, 6pm" },
  { id: "m141", divisionId: "women", date: "2026-10-11", time: "16:00", venue: "DELTA", homeId: "women--sg-masters", awayId: "women--sn-alumni", homeName: "SG MASTERS", awayName: "SN ALUMNI", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m142", divisionId: "women", date: "2026-10-11", time: "17:00", venue: "DELTA", homeId: "women--ora", awayId: "women--hypernovas", homeName: "ORA", awayName: "HYPERNOVAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m143", divisionId: "women", date: "2026-10-11", time: "18:00", venue: "DELTA", homeId: "women--singapore-polytechnic", awayId: "women--crescent", homeName: "SINGAPORE POLYTECHNIC", awayName: "CRESCENT", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m100", divisionId: "u21-boys", date: "2026-10-11", time: "19:00", venue: "DELTA", homeId: "u21-boys--lch-young-boys", awayId: "u21-boys--singapore-polytechnic", homeName: "LCH YOUNG BOYS", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: "Game shifted from 26th Sept" },
  { id: "m2", divisionId: "u21-girls", date: "2026-10-13", time: "17:00", venue: "CCAB", homeId: "u21-girls--ejc-tannibellies", awayId: "u21-girls--crescent-fire-horse", homeName: "EJC TANNIBELLIES", awayName: "CRESCENT FIRE HORSE", homeGoals: null, awayGoals: null, postponed: false, note: "Game shifted from 2nd Aug, 4pm" },
  { id: "m144", divisionId: "u21-girls", date: "2026-10-17", time: "15:00", venue: "CCAB", homeId: "u21-girls--crescent-fire-horse", awayId: "u21-girls--uwcsea-dover", homeName: "CRESCENT FIRE HORSE", awayName: "UWCSEA DOVER", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m145", divisionId: "women", date: "2026-10-17", time: "16:00", venue: "CCAB", homeId: "women--team-h-i", awayId: "women--crescent", homeName: "TEAM H.I.", awayName: "CRESCENT", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m146", divisionId: "women", date: "2026-10-17", time: "17:00", venue: "CCAB", homeId: "women--hollandse", awayId: "women--silversticks-senoritas", homeName: "HOLLANDSE", awayName: "SILVERSTICKS SENORITAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m150", divisionId: "women", date: "2026-10-17", time: "18:00", venue: "CCAB", homeId: "women--jansenites", awayId: "women--singapore-polytechnic", homeName: "JANSENITES", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: "Venue Changed, timing remains" },
  { id: "m148", divisionId: "premier", date: "2026-10-17", time: "19:00", venue: "CCAB", homeId: null, awayId: null, homeName: "7TH", awayName: "9TH", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m149", divisionId: "u21-girls", date: "2026-10-17", time: "17:00", venue: "DELTA", homeId: "u21-girls--jansenites", awayId: "u21-girls--ejc-tannibellies", homeName: "JANSENITES", awayName: "EJC TANNIBELLIES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m147", divisionId: "premier", date: "2026-10-17", time: "18:00", venue: "DELTA", homeId: null, awayId: null, homeName: "2ND", awayName: "3RD", homeGoals: null, awayGoals: null, postponed: false, note: "Venue Changed, timinmg remains" },
  { id: "m151", divisionId: "premier", date: "2026-10-17", time: "19:00", venue: "DELTA", homeId: null, awayId: null, homeName: "1ST", awayName: "5TH", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m152", divisionId: "u21-girls", date: "2026-10-18", time: "15:00", venue: "CCAB", homeId: "u21-girls--scc", awayId: "u21-girls--republic-polytechnic", homeName: "SCC", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m153", divisionId: "women", date: "2026-10-18", time: "16:00", venue: "CCAB", homeId: "women--team-h-i", awayId: "women--scc", homeName: "TEAM H.I.", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m154", divisionId: "women", date: "2026-10-18", time: "15:00", venue: "DELTA", homeId: "women--hollandse", awayId: "women--tornados", homeName: "HOLLANDSE", awayName: "TORNADOS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m155", divisionId: "women", date: "2026-10-18", time: "16:00", venue: "DELTA", homeId: "women--theresian-fielders", awayId: "women--oldham", homeName: "THERESIAN FIELDERS", awayName: "OLDHAM", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m156", divisionId: "women", date: "2026-10-18", time: "17:00", venue: "DELTA", homeId: "women--hypernovas", awayId: "women--crescent", homeName: "HYPERNOVAS", awayName: "CRESCENT", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 22nd Nov, 3pm" },
  { id: "m179", divisionId: "women", date: "2026-10-18", time: "17:00", venue: "DELTA", homeId: "women--jansenites", awayId: "women--ora", homeName: "JANSENITES", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: "Game shiftefd from 31st Oct" },
  { id: "m157", divisionId: "women", date: "2026-10-18", time: "18:00", venue: "DELTA", homeId: "women--silversticks-senoritas", awayId: "women--lion-city-hockey-club", homeName: "SILVERSTICKS SENORITAS", awayName: "LION CITY HOCKEY CLUB", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m131", divisionId: "u21-girls", date: "2026-10-20", time: "17:00", venue: "CCAB", homeId: "u21-girls--scc", awayId: "u21-girls--ejc-tannibellies", homeName: "SCC", awayName: "EJC TANNIBELLIES", homeGoals: null, awayGoals: null, postponed: false, note: "Game shifted from 10th Oct" },
  { id: "m158", divisionId: "u21-boys", date: "2026-10-24", time: "15:00", venue: "CCAB", homeId: "u21-boys--ora", awayId: "u21-boys--singapore-polytechnic", homeName: "ORA", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m159", divisionId: "u21-girls", date: "2026-10-24", time: "16:00", venue: "CCAB", homeId: "u21-girls--ejc-tannibellies", awayId: "u21-girls--republic-polytechnic", homeName: "EJC TANNIBELLIES", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m160", divisionId: "u21-girls", date: "2026-10-24", time: "17:00", venue: "CCAB", homeId: "u21-girls--uwcsea-dover", awayId: "u21-girls--aha-dc", homeName: "UWCSEA DOVER", awayName: "AHA DC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m161", divisionId: "women", date: "2026-10-24", time: "18:00", venue: "CCAB", homeId: "women--hypernovas", awayId: "women--team-h-i", homeName: "HYPERNOVAS", awayName: "TEAM H.I.", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m162", divisionId: "premier", date: "2026-10-24", time: "19:00", venue: "CCAB", homeId: null, awayId: null, homeName: "6TH", awayName: "9TH", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m163", divisionId: "women", date: "2026-10-24", time: "17:00", venue: "DELTA", homeId: "women--lion-city-hockey-club", awayId: "women--theresian-fielders", homeName: "LION CITY HOCKEY CLUB", awayName: "THERESIAN FIELDERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m164", divisionId: "women", date: "2026-10-24", time: "18:00", venue: "DELTA", homeId: "women--sn-alumni", awayId: "women--tornados", homeName: "SN ALUMNI", awayName: "TORNADOS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m165", divisionId: "premier", date: "2026-10-24", time: "19:00", venue: "DELTA", homeId: null, awayId: null, homeName: "1ST", awayName: "4TH", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m166", divisionId: "premier", date: "2026-10-24", time: "20:00", venue: "DELTA", homeId: null, awayId: null, homeName: "2ND", awayName: "5TH", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m167", divisionId: "u21-girls", date: "2026-10-25", time: "15:00", venue: "CCAB", homeId: "u21-girls--ejc-tannibellies", awayId: "u21-girls--scc", homeName: "EJC TANNIBELLIES", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m168", divisionId: "women", date: "2026-10-25", time: "16:00", venue: "CCAB", homeId: "women--scc", awayId: "women--jansenites", homeName: "SCC", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m169", divisionId: "u21-boys", date: "2026-10-25", time: "15:00", venue: "DELTA", homeId: "u21-boys--lch-young-boys", awayId: "u21-boys--ora", homeName: "LCH YOUNG BOYS", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m170", divisionId: "women", date: "2026-10-25", time: "16:00", venue: "DELTA", homeId: "women--singapore-polytechnic", awayId: "women--hollandse", homeName: "SINGAPORE POLYTECHNIC", awayName: "HOLLANDSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m171", divisionId: "women", date: "2026-10-25", time: "17:00", venue: "DELTA", homeId: "women--ora", awayId: "women--silversticks-senoritas", homeName: "ORA", awayName: "SILVERSTICKS SENORITAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m172", divisionId: "women", date: "2026-10-25", time: "18:00", venue: "DELTA", homeId: "women--sg-masters", awayId: "women--oldham", homeName: "SG MASTERS", awayName: "OLDHAM", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m173", divisionId: "u21-boys", date: "2026-10-31", time: "15:00", venue: "CCAB", homeId: "u21-boys--ora", awayId: "u21-boys--republic-polytechnic", homeName: "ORA", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m174", divisionId: "u21-girls", date: "2026-10-31", time: "16:00", venue: "CCAB", homeId: "u21-girls--republic-polytechnic", awayId: "u21-girls--ejc-tannibellies", homeName: "REPUBLIC POLYTECHNIC", awayName: "EJC TANNIBELLIES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m175", divisionId: "women", date: "2026-10-31", time: "17:00", venue: "CCAB", homeId: "women--hollandse", awayId: "women--scc", homeName: "HOLLANDSE", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m176", divisionId: "women", date: "2026-10-31", time: "18:00", venue: "CCAB", homeId: "women--crescent", awayId: "women--lion-city-hockey-club", homeName: "CRESCENT", awayName: "LION CITY HOCKEY CLUB", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m177", divisionId: "premier", date: "2026-10-31", time: "19:00", venue: "CCAB", homeId: null, awayId: null, homeName: "7TH", awayName: "8TH", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m178", divisionId: "women", date: "2026-10-31", time: "17:00", venue: "DELTA", homeId: "women--team-h-i", awayId: "women--oldham", homeName: "TEAM H.I.", awayName: "OLDHAM", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m179", divisionId: "women", date: "2026-10-31", time: "18:00", venue: "DELTA", homeId: "women--jansenites", awayId: "women--ora", homeName: "JANSENITES", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 18th Oct, 5pm" },
  { id: "m36", divisionId: "women", date: "2026-10-31", time: "18:00", venue: "DELTA", homeId: "women--hypernovas", awayId: "women--jansenites", homeName: "HYPERNOVAS", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: "Game shiftef from 23rd Aug, 6pm" },
  { id: "m180", divisionId: "premier", date: "2026-10-31", time: "19:00", venue: "DELTA", homeId: null, awayId: null, homeName: "2ND", awayName: "4TH", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m181", divisionId: "u21-boys", date: "2026-11-01", time: "15:00", venue: "CCAB", homeId: "u21-boys--singapore-polytechnic", awayId: "u21-boys--lch-young-boys", homeName: "SINGAPORE POLYTECHNIC", awayName: "LCH YOUNG BOYS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m182", divisionId: "u21-girls", date: "2026-11-01", time: "16:00", venue: "CCAB", homeId: "u21-girls--ejc-tannibellies", awayId: "u21-girls--jansenites", homeName: "EJC TANNIBELLIES", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m183", divisionId: "women", date: "2026-11-01", time: "15:00", venue: "DELTA", homeId: "women--silversticks-senoritas", awayId: "women--sg-masters", homeName: "SILVERSTICKS SENORITAS", awayName: "SG MASTERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m184", divisionId: "women", date: "2026-11-01", time: "16:00", venue: "DELTA", homeId: "women--sn-alumni", awayId: "women--singapore-polytechnic", homeName: "SN ALUMNI", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m185", divisionId: "women", date: "2026-11-01", time: "17:00", venue: "DELTA", homeId: "women--hypernovas", awayId: "women--tornados", homeName: "HYPERNOVAS", awayName: "TORNADOS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m4", divisionId: "u21-boys", date: "2026-11-01", time: "18:00", venue: "DELTA", homeId: "u21-boys--ora", awayId: "u21-boys--republic-polytechnic", homeName: "ORA", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: "Game shifted from 2nd Aug, 3pm." },
  { id: "m186", divisionId: "premier", date: "2026-11-01", time: "19:00", venue: "DELTA", homeId: null, awayId: null, homeName: "3RD", awayName: "5TH", homeGoals: null, awayGoals: null, postponed: false, note: "Timing changed, venue remains" },
  { id: "m187", divisionId: "u21-boys", date: "2026-11-14", time: "15:00", venue: "CCAB", homeId: "u21-boys--republic-polytechnic", awayId: "u21-boys--ora", homeName: "REPUBLIC POLYTECHNIC", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m188", divisionId: "u21-girls", date: "2026-11-14", time: "16:00", venue: "CCAB", homeId: "u21-girls--aha-dc", awayId: "u21-girls--republic-polytechnic", homeName: "AHA DC", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m189", divisionId: "u21-girls", date: "2026-11-14", time: "17:00", venue: "CCAB", homeId: "u21-girls--uwcsea-dover", awayId: "u21-girls--ejc-tannibellies", homeName: "UWCSEA DOVER", awayName: "EJC TANNIBELLIES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m190", divisionId: "women", date: "2026-11-14", time: "18:00", venue: "CCAB", homeId: "women--jansenites", awayId: "women--theresian-fielders", homeName: "JANSENITES", awayName: "THERESIAN FIELDERS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m191", divisionId: "premier", date: "2026-11-14", time: "19:00", venue: "CCAB", homeId: null, awayId: null, homeName: "8TH", awayName: "9TH", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m192", divisionId: "women", date: "2026-11-14", time: "17:00", venue: "DELTA", homeId: "women--scc", awayId: "women--singapore-polytechnic", homeName: "SCC", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m193", divisionId: "women", date: "2026-11-14", time: "18:00", venue: "DELTA", homeId: "women--crescent", awayId: "women--tornados", homeName: "CRESCENT", awayName: "TORNADOS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m194", divisionId: "premier", date: "2026-11-14", time: "19:00", venue: "DELTA", homeId: null, awayId: null, homeName: "3RD", awayName: "4TH", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m195", divisionId: "premier", date: "2026-11-14", time: "20:00", venue: "DELTA", homeId: null, awayId: null, homeName: "6TH", awayName: "7TH", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m196", divisionId: "u21-boys", date: "2026-11-15", time: "15:00", venue: "CCAB", homeId: "u21-boys--singapore-polytechnic", awayId: "u21-boys--ora", homeName: "SINGAPORE POLYTECHNIC", awayName: "ORA", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m197", divisionId: "u21-girls", date: "2026-11-15", time: "16:00", venue: "CCAB", homeId: "u21-girls--crescent-fire-horse", awayId: "u21-girls--scc", homeName: "CRESCENT FIRE HORSE", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m198", divisionId: "women", date: "2026-11-15", time: "15:00", venue: "DELTA", homeId: "women--hollandse", awayId: "women--lion-city-hockey-club", homeName: "HOLLANDSE", awayName: "LION CITY HOCKEY CLUB", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m199", divisionId: "women", date: "2026-11-15", time: "16:00", venue: "DELTA", homeId: "women--sg-masters", awayId: "women--team-h-i", homeName: "SG MASTERS", awayName: "TEAM H.I.", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m200", divisionId: "women", date: "2026-11-15", time: "17:00", venue: "DELTA", homeId: "women--oldham", awayId: "women--sn-alumni", homeName: "OLDHAM", awayName: "SN ALUMNI", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m201", divisionId: "women", date: "2026-11-15", time: "18:00", venue: "DELTA", homeId: "women--silversticks-senoritas", awayId: "women--crescent", homeName: "SILVERSTICKS SENORITAS", awayName: "CRESCENT", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m202", divisionId: "premier", date: "2026-11-15", time: "19:00", venue: "DELTA", homeId: null, awayId: null, homeName: "1ST", awayName: "2ND", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m203", divisionId: "women", date: "2026-11-21", time: "15:00", venue: "CCAB", homeId: "women--oldham", awayId: "women--lion-city-hockey-club", homeName: "OLDHAM", awayName: "LION CITY HOCKEY CLUB", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m204", divisionId: "women", date: "2026-11-21", time: "16:00", venue: "CCAB", homeId: "women--crescent", awayId: "women--sn-alumni", homeName: "CRESCENT", awayName: "SN ALUMNI", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m205", divisionId: "women", date: "2026-11-21", time: "17:00", venue: "CCAB", homeId: "women--theresian-fielders", awayId: "women--hypernovas", homeName: "THERESIAN FIELDERS", awayName: "HYPERNOVAS", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 10th Oct, 4pm" },
  { id: "m133", divisionId: "women", date: "2026-11-21", time: "17:00", venue: "CCAB", homeId: "women--tornados", awayId: "women--theresian-fielders", homeName: "TORNADOS", awayName: "THERESIAN FIELDERS", homeGoals: null, awayGoals: null, postponed: false, note: "Game shifted to 21st Nov, 5pm" },
  { id: "m206", divisionId: "women", date: "2026-11-21", time: "17:00", venue: "DELTA", homeId: "women--team-h-i", awayId: "women--hollandse", homeName: "TEAM H.I.", awayName: "HOLLANDSE", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m207", divisionId: "women", date: "2026-11-21", time: "18:00", venue: "DELTA", homeId: "women--singapore-polytechnic", awayId: "women--silversticks-senoritas", homeName: "SINGAPORE POLYTECHNIC", awayName: "SILVERSTICKS SENORITAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m156", divisionId: "women", date: "2026-11-22", time: "15:00", venue: "CCAB", homeId: "women--hypernovas", awayId: "women--crescent", homeName: "HYPERNOVAS", awayName: "CRESCENT", homeGoals: null, awayGoals: null, postponed: false, note: "Game shiftefd from 18th Oct, 5pm" },
  { id: "m208", divisionId: "u21-boys", date: "2026-11-22", time: "15:00", venue: "DELTA", homeId: "u21-boys--ora", awayId: "u21-boys--singapore-polytechnic", homeName: "ORA", awayName: "SINGAPORE POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m209", divisionId: "u21-boys", date: "2026-11-22", time: "16:00", venue: "DELTA", homeId: "u21-boys--lch-young-boys", awayId: "u21-boys--republic-polytechnic", homeName: "LCH YOUNG BOYS", awayName: "REPUBLIC POLYTECHNIC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m210", divisionId: "women", date: "2026-11-22", time: "17:00", venue: "DELTA", homeId: "women--sg-masters", awayId: "women--scc", homeName: "SG MASTERS", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m211", divisionId: "women", date: "2026-11-22", time: "18:00", venue: "DELTA", homeId: "women--tornados", awayId: "women--jansenites", homeName: "TORNADOS", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m212", divisionId: "women", date: "2026-11-28", time: "15:00", venue: "CCAB", homeId: "women--lion-city-hockey-club", awayId: "women--jansenites", homeName: "LION CITY HOCKEY CLUB", awayName: "JANSENITES", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m213", divisionId: "women", date: "2026-11-28", time: "16:00", venue: "CCAB", homeId: "women--tornados", awayId: "women--scc", homeName: "TORNADOS", awayName: "SCC", homeGoals: null, awayGoals: null, postponed: true, note: "Game shifted to 26th Sept, 3pm" },
  { id: "m214", divisionId: "women", date: "2026-11-28", time: "16:00", venue: "CCAB", homeId: "women--hypernovas", awayId: "women--sn-alumni", homeName: "HYPERNOVAS", awayName: "SN ALUMNI", homeGoals: null, awayGoals: null, postponed: false, note: "Timing changed, venue remains" },
  { id: "m215", divisionId: "women", date: "2026-11-29", time: "15:00", venue: "DELTA", homeId: "women--crescent", awayId: "women--oldham", homeName: "CRESCENT", awayName: "OLDHAM", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m216", divisionId: "women", date: "2026-11-29", time: "16:00", venue: "DELTA", homeId: "women--theresian-fielders", awayId: "women--silversticks-senoritas", homeName: "THERESIAN FIELDERS", awayName: "SILVERSTICKS SENORITAS", homeGoals: null, awayGoals: null, postponed: false, note: null },
  { id: "m217", divisionId: "women", date: "2026-11-29", time: "17:00", venue: "DELTA", homeId: "women--singapore-polytechnic", awayId: "women--sg-masters", homeName: "SINGAPORE POLYTECHNIC", awayName: "SG MASTERS", homeGoals: null, awayGoals: null, postponed: false, note: null }
];

export const teamById = (id: string | null) => teams.find((t) => t.id === id) ?? null;

export const teamsOf = (divisionId: DivisionId) => teams.filter((t) => t.divisionId === divisionId);

export const matchesOf = (divisionId: DivisionId) =>
  matches.filter((m) => m.divisionId === divisionId).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

export const isPlayed = (m: Match) => m.homeGoals !== null && m.awayGoals !== null && !m.postponed;

export const playedOf = (divisionId: DivisionId) => matchesOf(divisionId).filter(isPlayed);

export const upcomingOf = (divisionId: DivisionId) => matchesOf(divisionId).filter((m) => !isPlayed(m));

export const matchDates = (divisionId: DivisionId) => [...new Set(matchesOf(divisionId).map((m) => m.date))];

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
    h.gp++; a.gp++;
    h.gf += hg; h.ga += ag;
    a.gf += ag; a.ga += hg;
    if (hg === ag) {
      h.d++; a.d++; h.pts++; a.pts++;
      h.form.push("D"); a.form.push("D");
    } else if (hg > ag) {
      h.w++; h.pts += 3; a.l++;
      h.form.push("W"); a.form.push("L");
    } else {
      a.w++; a.pts += 3; h.l++;
      a.form.push("W"); h.form.push("L");
    }
  }
  return [...map.values()]
    .map((s) => ({ ...s, gd: s.gf - s.ga, form: s.form.slice(-5) }))
    .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.name.localeCompare(y.team.name));
}

export const nextDate = (divisionId: DivisionId) => {
  const up = upcomingOf(divisionId);
  return up[0]?.date ?? matchDates(divisionId)[0] ?? SEASON.start;
};
