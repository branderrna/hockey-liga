export type DivisionId =
  | "women"
  | "premier"
  | "u21-girls"
  | "u21-boys"
  | "super"
  | "veterans"
  | "social"
  | "u14-boys"
  | "u14-girls";

type LigaSlug = DivisionId;

export type Liga = {
  slug: LigaSlug;
  name: string;
  /** Sidebar and card label. */
  short: string;
  group: "Open" | "Youth";
  status: "active";
  divisionId: DivisionId;
};

export type ActiveLiga = Liga;

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
  /** Game number as printed in column A ("No.") of the sheet. */
  no: number;
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
  /** Compact value from the source Round column, e.g. "1", "QF1", or "FINAL". */
  round?: string;
  /** Shootout result, stored separately from the full-time score when applicable. */
  shootoutHomeGoals?: number | null;
  shootoutAwayGoals?: number | null;
};

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

/** Consecutive match days played as one block — in practice a Sat/Sun weekend. */
export type Weekend = {
  key: string;
  dates: string[];
  label: string;
  matches: Match[];
};
