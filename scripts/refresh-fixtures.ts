// Fetches the league's public Google Sheet ("COMPLETE" tab) and regenerates
// src/data/matches.generated.ts. Run by .github/workflows/refresh-fixtures.yml,
// or manually with: node scripts/refresh-fixtures.ts
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { teams, SEASON } from "../src/data/league.ts";
import type { DivisionId, Match } from "../src/data/types.ts";

const SHEET_ID = "1xD2Yc5dJAlNe82Zps3b3bpT23XGXDl5hlOkGDum3vDA";
const GID = "9556364"; // "COMPLETE" tab
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const CATEGORY_TO_DIVISION: Record<string, DivisionId> = {
  WOMEN: "women",
  PREMIER: "premier",
  "U21 GIRLS": "u21-girls",
  "U21 BOYS": "u21-boys",
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

// Minimal RFC4180-ish CSV parser — handles quoted fields with embedded commas/newlines.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      /* skip */
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const teamIdByDivisionAndName = new Map<string, string>();
for (const t of teams)
  teamIdByDivisionAndName.set(`${t.divisionId}::${t.name.trim().toUpperCase()}`, t.id);

function resolveTeamId(divisionId: DivisionId, name: string): string | null {
  return teamIdByDivisionAndName.get(`${divisionId}::${name.trim().toUpperCase()}`) ?? null;
}

const seasonYear = SEASON.start.slice(0, 4);

function parseDate(dayDate: string): string | null {
  // e.g. "Sunday, 02 Aug" -> "2026-08-02"
  const m = dayDate.match(/(\d{1,2})\s+([A-Za-z]{3,})/);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = MONTHS[m[2].slice(0, 3)];
  if (!month) return null;
  return `${seasonYear}-${month}-${day}`;
}

function parseTime(t: string): string {
  const digits = t.trim().replace(/\D/g, "").padStart(4, "0");
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

function parseScore(scoreRaw: string): {
  postponed: boolean;
  homeGoals: number | null;
  awayGoals: number | null;
} {
  const s = scoreRaw.trim();
  if (!s) return { postponed: false, homeGoals: null, awayGoals: null };
  if (/PP/i.test(s)) return { postponed: true, homeGoals: null, awayGoals: null };
  const m = s.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return { postponed: false, homeGoals: null, awayGoals: null };
  return { postponed: false, homeGoals: Number(m[1]), awayGoals: Number(m[2]) };
}

async function main() {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${res.status} ${res.statusText}`);
  const csvText = await res.text();
  const rows = parseCsv(csvText);

  const headerIdx = rows.findIndex((r) => {
    const trimmed = r.map((c) => c.trim());
    return trimmed.includes("Home") && trimmed.includes("Score") && trimmed.includes("Away");
  });
  if (headerIdx === -1)
    throw new Error(
      'Could not find header row (expected "Home", "Score", "Away" columns) in the sheet',
    );
  const header = rows[headerIdx].map((c) => c.trim());
  const col = (name: string) => header.indexOf(name);
  const idx = {
    dayDate: col("Day & Date"),
    venue: col("Venue"),
    time: col("Time"),
    category: col("Category"),
    home: col("Home"),
    score: col("Score"),
    away: col("Away"),
    notes: col("Notes"),
  };
  for (const [key, i] of Object.entries(idx)) {
    if (i === -1) throw new Error(`Could not find expected column "${key}" in sheet header`);
  }

  const matches: Match[] = [];
  const unresolvedTeams = new Set<string>();
  const skippedRows: string[] = [];

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => !c?.trim())) continue;
    const sheetRow = r + 1; // 1-indexed, matches the sheet's own row numbers

    const categoryRaw = (row[idx.category] ?? "").trim().toUpperCase();
    const divisionId = CATEGORY_TO_DIVISION[categoryRaw];
    if (!divisionId) {
      skippedRows.push(`row ${sheetRow}: unrecognized Category "${row[idx.category] ?? ""}"`);
      continue;
    }

    const homeName = (row[idx.home] ?? "").trim();
    const awayName = (row[idx.away] ?? "").trim();
    if (!homeName || !awayName) {
      skippedRows.push(`row ${sheetRow}: missing Home or Away team name`);
      continue;
    }

    const date = parseDate(row[idx.dayDate] ?? "");
    if (!date) {
      skippedRows.push(`row ${sheetRow}: unparseable Day & Date "${row[idx.dayDate] ?? ""}"`);
      continue;
    }

    const time = parseTime(row[idx.time] ?? "0000");
    const venue = (row[idx.venue] ?? "").trim();
    const { postponed, homeGoals, awayGoals } = parseScore(row[idx.score] ?? "");
    const note = (row[idx.notes] ?? "").trim() || null;

    const homeId = resolveTeamId(divisionId, homeName);
    const awayId = resolveTeamId(divisionId, awayName);
    if (!homeId) unresolvedTeams.add(`${divisionId}::${homeName}`);
    if (!awayId) unresolvedTeams.add(`${divisionId}::${awayName}`);

    const id = `m-${date}-${time.replace(":", "")}-${slugify(venue)}-${slugify(homeName)}-${slugify(awayName)}`;

    matches.push({
      id,
      divisionId,
      date,
      time,
      venue,
      homeId,
      awayId,
      homeName,
      awayName,
      homeGoals,
      awayGoals,
      postponed,
      note,
    });
  }

  matches.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  if (unresolvedTeams.size > 0) {
    console.warn(
      `Warning: ${unresolvedTeams.size} team name(s) in the sheet did not match a known team (kept as text-only, no team link):\n  ` +
        [...unresolvedTeams].join("\n  "),
    );
  }

  if (skippedRows.length > 0) {
    console.warn(
      `Warning: ${skippedRows.length} row(s) in the sheet were skipped entirely (not included as a fixture):\n  ` +
        skippedRows.join("\n  "),
    );
  }

  const out = `// AUTO-GENERATED by scripts/refresh-fixtures.ts — do not edit by hand.
// Regenerated from the league Google Sheet. See .github/workflows/refresh-fixtures.yml
import type { Match } from "./types.ts";

export const matches: Match[] = ${JSON.stringify(matches, null, 2)};
`;

  const outPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../src/data/matches.generated.ts",
  );
  writeFileSync(outPath, out);
  console.log(`Wrote ${matches.length} matches to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
