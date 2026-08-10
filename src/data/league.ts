export type Team = {
  id: string;
  name: string;
  short: string;
  city: string;
};

export type Match = {
  id: string;
  week: number;
  date: string; // ISO date
  time: string;
  venue: string;
  homeId: string;
  awayId: string;
  homeGoals?: number;
  awayGoals?: number;
  overtime?: boolean;
};

export const SEASON = {
  name: "Northern Ice Cup",
  subtitle: "6-month tournament · 10 teams · 24 weeks",
  start: "2026-01-10",
  end: "2026-06-27",
};

export const teams: Team[] = [
  { id: "frost", name: "Frostbite Wolves", short: "FRW", city: "Anchorvale" },
  { id: "granite", name: "Granite Bears", short: "GRB", city: "Stonefield" },
  { id: "harbor", name: "Harbor Kings", short: "HRK", city: "Port Mira" },
  { id: "aurora", name: "Aurora Blades", short: "AUB", city: "Northlight" },
  { id: "iron", name: "Iron Ravens", short: "IRR", city: "Kessler" },
  { id: "polar", name: "Polar Stampede", short: "POS", city: "Whitehall" },
  { id: "summit", name: "Summit Foxes", short: "SUF", city: "Ridgeway" },
  { id: "tide", name: "Tidewater Sharks", short: "TWS", city: "Bayline" },
  { id: "ember", name: "Ember Lynx", short: "EMB", city: "Redstone" },
  { id: "glacier", name: "Glacier Titans", short: "GLT", city: "Coldspur" },
];

export const teamById = (id: string) => teams.find((t) => t.id === id)!;

const V = ["Northgate Arena", "Mira Ice Dome", "Ridgeway Coliseum", "Kessler Rink", "Coldspur Pavilion"];

function build(): Match[] {
  const ids = teams.map((t) => t.id);
  const out: Match[] = [];
  const startWeekDate = new Date(SEASON.start);
  const rounds = 24;
  const n = ids.length;
  const rot = ids.slice(1);

  for (let w = 0; w < rounds; w++) {
    const r = w % (n - 1);
    const order = [ids[0], ...rot.slice(r), ...rot.slice(0, r)];
    const home = order.slice(0, n / 2);
    const away = order.slice(n / 2).reverse();
    for (let i = 0; i < home.length; i++) {
      const d = new Date(startWeekDate);
      d.setDate(d.getDate() + w * 7 + (i % 3));
      const flip = w % 2 === 1;
      const h = flip ? away[i] : home[i];
      const a = flip ? home[i] : away[i];
      const played = w < 14;
      const seed = (w * 7 + i * 13) % 11;
      const hg = (seed % 5) + (i % 2);
      const ag0 = ((seed * 3) % 5) + ((w + i) % 2);
      const ag = hg === ag0 ? ag0 + 1 : ag0;
      const base = {
        id: `w${w + 1}-${i}`,
        week: w + 1,
        date: d.toISOString().slice(0, 10),
        time: ["18:00", "19:30", "20:15", "17:00", "19:00"][i % 5]!,
        venue: V[(w + i) % V.length]!,
        homeId: h!,
        awayId: a!,
      };
      out.push(
        played ? { ...base, homeGoals: hg, awayGoals: ag, overtime: hg === ag0 } : base,
      );
    }
  }
  return out;
}

export const matches: Match[] = build();

export const isPlayed = (m: Match) => m.homeGoals !== undefined && m.awayGoals !== undefined;

export const playedMatches = matches.filter(isPlayed);
export const upcomingMatches = matches.filter((m) => !isPlayed(m));

export const currentWeek = upcomingMatches[0]?.week ?? matches[matches.length - 1]?.week ?? 1;

export const weeks = Array.from(new Set(matches.map((m) => m.week)));

export type Standing = {
  team: Team;
  gp: number;
  w: number;
  otw: number;
  otl: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  form: ("W" | "L" | "O")[];
};

export function standings(): Standing[] {
  const map = new Map<string, Standing>();
  for (const t of teams) {
    map.set(t.id, {
      team: t,
      gp: 0,
      w: 0,
      otw: 0,
      otl: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
      form: [],
    });
  }
  for (const m of playedMatches) {
    const h = map.get(m.homeId)!;
    const a = map.get(m.awayId)!;
    const hg = m.homeGoals!;
    const ag = m.awayGoals!;
    h.gp++; a.gp++;
    h.gf += hg; h.ga += ag;
    a.gf += ag; a.ga += hg;
    const hw = hg > ag;
    const winner = hw ? h : a;
    const loser = hw ? a : h;
    if (m.overtime) {
      winner.otw++; winner.pts += 2;
      loser.otl++; loser.pts += 1;
      winner.form.push("W");
      loser.form.push("O");
    } else {
      winner.w++; winner.pts += 3;
      loser.l++;
      winner.form.push("W");
      loser.form.push("L");
    }
  }
  return [...map.values()]
    .map((s) => ({ ...s, gd: s.gf - s.ga, form: s.form.slice(-5) }))
    .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.name.localeCompare(y.team.name));
}
