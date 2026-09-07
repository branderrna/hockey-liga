export const ARCHIVE_SEASON = {
  id: "2026-1",
  label: "2026/1",
  name: "Hockey Liga 2026/1",
  year: "2026",
  start: "2026-02-07",
  end: "2026-07-04",
} as const;

export type ArchiveDivisionId = "super" | "veterans" | "social" | "u14-boys" | "u14-girls";

export type ArchivedLiga = {
  slug: ArchiveDivisionId;
  name: string;
  short: string;
  group: "Open" | "Youth";
  divisionId: ArchiveDivisionId;
};

/**
 * Completed liga catalogue. This is display metadata only; fixtures and teams
 * are loaded from the immutable 2026/1 Google Sheet tab on the server.
 */
export const archivedLigas: ArchivedLiga[] = [
  {
    slug: "super",
    name: "Super Hockey Liga",
    short: "Super",
    group: "Open",
    divisionId: "super",
  },
  {
    slug: "veterans",
    name: "Veterans Hockey Liga",
    short: "Veterans",
    group: "Open",
    divisionId: "veterans",
  },
  {
    slug: "social",
    name: "Social Hockey Liga",
    short: "Social",
    group: "Open",
    divisionId: "social",
  },
  {
    slug: "u14-boys",
    name: "Youth Hockey Liga — U14 Boys",
    short: "U14 Boys",
    group: "Youth",
    divisionId: "u14-boys",
  },
  {
    slug: "u14-girls",
    name: "Youth Hockey Liga — U14 Girls",
    short: "U14 Girls",
    group: "Youth",
    divisionId: "u14-girls",
  },
];

export const archivedLigaBySlug = (slug: string) =>
  archivedLigas.find((liga) => liga.slug === slug);
