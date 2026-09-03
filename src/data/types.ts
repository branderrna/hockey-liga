export type DivisionId = "women" | "premier" | "u21-girls" | "u21-boys";

/** Ligas that have no fixtures in the sheet yet. Their pages render a placeholder. */
export type UpcomingLigaSlug = "super" | "veterans" | "social" | "u14-boys" | "u14-girls";

export type LigaSlug = DivisionId | UpcomingLigaSlug;

export type Liga = {
  slug: LigaSlug;
  name: string;
  /** Sidebar and card label. */
  short: string;
  group: "Open" | "Youth";
} & (
  | { status: "active"; divisionId: DivisionId }
  | { status: "upcoming"; divisionId: null; returns: string }
);

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
};

/** Consecutive match days played as one block — in practice a Sat/Sun weekend. */
export type Weekend = {
  key: string;
  dates: string[];
  label: string;
  matches: Match[];
};
