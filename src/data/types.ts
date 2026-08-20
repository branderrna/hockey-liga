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
