import { createServerFn } from "@tanstack/react-start";
import { parseArchiveCsv } from "./archive-parser.ts";
import type { CompetitionDataset } from "./competition.ts";

const SHEET_ID = "1xD2Yc5dJAlNe82Zps3b3bpT23XGXDl5hlOkGDum3vDA";
const ARCHIVE_GID = "896089478"; // immutable "2026/1" tab
const ARCHIVE_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${ARCHIVE_GID}`;

let cachedDataset: Promise<CompetitionDataset> | undefined;

async function fetchArchiveDataset(): Promise<CompetitionDataset> {
  const response = await fetch(ARCHIVE_CSV_URL, {
    headers: { accept: "text/csv" },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to load completed liga data: ${response.status} ${response.statusText}`,
    );
  }
  return parseArchiveCsv(await response.text());
}

/**
 * Loads the completed season on the server only. The browser receives the
 * parsed dataset through the route loader, but the Sheet URL and parsing work
 * never become a client-side data source or checked-in fixture snapshot.
 */
export const getArchivedDataset = createServerFn({ method: "GET" }).handler(async () => {
  if (!cachedDataset) {
    cachedDataset = fetchArchiveDataset().catch((error) => {
      cachedDataset = undefined;
      throw error;
    });
  }
  return cachedDataset;
});
