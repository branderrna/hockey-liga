import type { DivisionId, Match } from "./types.ts";

export type Scoreline = { home: number; away: number };

export type FixtureParserConfig = {
  seasonYear: string;
  categoryToDivision: Record<string, DivisionId>;
  resolveTeamId?: (divisionId: DivisionId, name: string) => string | null;
};

export type ParsedFixtures = {
  matches: Match[];
  unresolvedTeams: Set<string>;
  skippedRows: string[];
};

const MONTHS: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

/** Minimal RFC4180-ish CSV parser; quoted commas and newlines are supported. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (inQuotes) {
      if (character === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
    } else if (character === '"') {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character === "\r") {
      // CRLF is handled by the LF branch; a bare CR is also a line break.
      if (text[i + 1] === "\n") continue;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function cleanCell(value: string | undefined): string {
  return (value ?? "").trim();
}

function isCalendarDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(`${value}T`);
}

/** Handles the sheet's `Sunday,_02 Aug` export as well as normal text dates. */
export function parseDate(dayDate: string, seasonYear: string): string | null {
  const cleaned = dayDate
    .trim()
    .replace(/[_\u00a0]+/g, " ")
    .replace(/\s+/g, " ");
  const iso = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const value = `${iso[1]!}-${iso[2]!.padStart(2, "0")}-${iso[3]!.padStart(2, "0")}`;
    return isCalendarDate(value) ? value : null;
  }

  const match = cleaned.match(/(\d{1,2})\s+([A-Za-z]{3,})/);
  if (!match) return null;
  const month = MONTHS[match[2]!.slice(0, 3)];
  if (!month) return null;
  const value = `${seasonYear}-${month}-${match[1]!.padStart(2, "0")}`;
  return isCalendarDate(value) ? value : null;
}

export function parseTime(value: string): string {
  const digits = value.trim().replace(/\D/g, "").padStart(4, "0");
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export function parseScoreline(value: string): Scoreline | null {
  const match = value.match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
  if (!match) return null;
  return { home: Number(match[1]), away: Number(match[2]) };
}

export function parseRound(value: string): string | undefined {
  const compact = value.trim().replace(/\s+/g, " ");
  if (!compact) return undefined;

  if (/^\d+(?:\.0+)?$/.test(compact)) return String(Number(compact));

  const knockout = compact.match(/^(QF|SF)\s*(\d+)$/i);
  if (knockout) return `${knockout[1]!.toUpperCase()}${knockout[2]!}`;

  return compact
    .toUpperCase()
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s*-\s*/g, "-");
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeFixtureId(
  date: string,
  time: string,
  venue: string,
  homeName: string,
  awayName: string,
): string {
  return `m-${date}-${time.replace(":", "")}-${slugify(venue)}-${slugify(homeName)}-${slugify(awayName)}`;
}

export function parseFixtureRows(rows: string[][], config: FixtureParserConfig): ParsedFixtures {
  const headerIdx = rows.findIndex((row) => {
    const header = row.map((cell) => cell.trim());
    return header.includes("Home") && header.includes("Score") && header.includes("Away");
  });
  if (headerIdx === -1) {
    throw new Error('Could not find header row (expected "Home", "Score", "Away" columns)');
  }

  const header = rows[headerIdx]!.map((cell) => cell.trim());
  const column = (name: string) => header.indexOf(name);
  const idx = {
    no: column("No."),
    dayDate: column("Day & Date"),
    venue: column("Venue"),
    time: column("Time"),
    category: column("Category"),
    home: column("Home"),
    score: column("Score"),
    away: column("Away"),
    notes: column("Notes"),
    round: column("Round"),
    shootoutScore: column("Shootout Score"),
    pp: column("PP"),
  };

  const required = ["no", "dayDate", "venue", "time", "category", "home", "score", "away"] as const;
  for (const key of required) {
    if (idx[key] === -1) throw new Error(`Could not find expected column "${key}" in sheet header`);
  }

  const valueAt = (row: string[], index: number) => (index === -1 ? "" : cleanCell(row[index]));
  const matches: Match[] = [];
  const unresolvedTeams = new Set<string>();
  const skippedRows: string[] = [];

  for (let rowIndex = headerIdx + 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex] ?? [];
    if (row.every((cell) => !cleanCell(cell))) continue;
    const sheetRow = rowIndex + 1;

    const categoryRaw = valueAt(row, idx.category).toUpperCase();
    // The source tabs contain a repeated header row lower down in the sheet.
    if (categoryRaw === "CATEGORY") continue;
    const divisionId = config.categoryToDivision[categoryRaw];
    if (!divisionId) {
      skippedRows.push(`row ${sheetRow}: unrecognized Category "${valueAt(row, idx.category)}"`);
      continue;
    }

    const homeName = valueAt(row, idx.home);
    const awayName = valueAt(row, idx.away);
    if (!homeName || !awayName) {
      skippedRows.push(`row ${sheetRow}: missing Home or Away team name`);
      continue;
    }

    const date = parseDate(valueAt(row, idx.dayDate), config.seasonYear);
    if (!date) {
      skippedRows.push(`row ${sheetRow}: unparseable Day & Date "${valueAt(row, idx.dayDate)}"`);
      continue;
    }

    const no = Number(valueAt(row, idx.no));
    if (!Number.isInteger(no) || no <= 0) {
      skippedRows.push(`row ${sheetRow}: unparseable game number "${valueAt(row, idx.no)}"`);
      continue;
    }

    const scoreRaw = valueAt(row, idx.score);
    const ppRaw = valueAt(row, idx.pp).toUpperCase();
    const note = valueAt(row, idx.notes);
    const postponed = /PP/i.test(scoreRaw) || ppRaw === "PP";
    if (note && /\bpostpon(?:ed|ement)\b/i.test(note) && !postponed) {
      throw new Error(`row ${sheetRow}: Notes mark this fixture postponed but Score/PP does not`);
    }
    const score = postponed ? null : parseScoreline(scoreRaw);
    if (scoreRaw && !postponed && !score) {
      skippedRows.push(`row ${sheetRow}: malformed Score "${scoreRaw}"`);
      continue;
    }

    const shootoutRaw = valueAt(row, idx.shootoutScore);
    const shootout = shootoutRaw ? parseScoreline(shootoutRaw) : null;
    if (shootoutRaw && !shootout) {
      skippedRows.push(`row ${sheetRow}: malformed Shootout Score "${shootoutRaw}"`);
      continue;
    }

    const time = parseTime(valueAt(row, idx.time) || "0000");
    const venue = valueAt(row, idx.venue);
    const homeId = config.resolveTeamId?.(divisionId, homeName) ?? null;
    const awayId = config.resolveTeamId?.(divisionId, awayName) ?? null;
    if (!homeId) unresolvedTeams.add(`${divisionId}::${homeName}`);
    if (!awayId) unresolvedTeams.add(`${divisionId}::${awayName}`);

    const match: Match = {
      id: makeFixtureId(date, time, venue, homeName, awayName),
      no,
      divisionId,
      date,
      time,
      venue,
      homeId,
      awayId,
      homeName,
      awayName,
      homeGoals: score?.home ?? null,
      awayGoals: score?.away ?? null,
      postponed,
      note: note || null,
    };

    const round = parseRound(valueAt(row, idx.round));
    if (round) match.round = round;
    if (shootout) {
      match.shootoutHomeGoals = shootout.home;
      match.shootoutAwayGoals = shootout.away;
    }
    matches.push(match);
  }

  return { matches, unresolvedTeams, skippedRows };
}
