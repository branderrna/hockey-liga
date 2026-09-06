/*
 * The site's release history, newest first.
 *
 * These notes are written for a visitor, not for a developer: they say what
 * changed on the site, not how. The engineering log lives in CHANGELOG.md and
 * shares this numbering — see docs/versioning.md for the scheme and when to
 * bump. `npm test` fails if the two records drift apart.
 *
 * Fixtures and results refreshes never appear here. They are data, and the
 * "Results updated" stamp in the footer is what covers them.
 */

type Release = {
  version: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  notes: string[];
};

/*
 * Named rather than read back out of `releases`, so the version in the footer
 * cannot disagree with the newest entry in the history behind it.
 */
const CURRENT: Release = {
  version: "0.6.0",
  date: "2026-09-06",
  notes: [
    "Every page now shows when the results were last updated, so a blank score is clearly a game not yet played rather than a stale page.",
    "Added this version history.",
  ],
};

export const CURRENT_VERSION = CURRENT.version;

export const releases: Release[] = [
  CURRENT,
  {
    version: "0.5.1",
    date: "2026-09-05",
    notes: ["The schedule opens on the weekend being played today."],
  },
  {
    version: "0.5.0",
    date: "2026-09-04",
    notes: [
      "Each liga now has its own page, with the schedule and league table in one place.",
      "Pick your liga and team on the landing page, and the site remembers them.",
      "Added a My team view: your fixtures, results and form, without the rest of the liga.",
      "Scores entered in the league sheet now reach the site within minutes instead of overnight.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-08-23",
    notes: [
      "The site moved to its own hosting.",
      "The date filter scrolls on narrow screens.",
      "Added a note making clear this is an unofficial site, and that Balestier Lions holds the official results.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-08-20",
    notes: [
      "Fixtures and results now come straight from the league’s Google Sheet and refresh on their own.",
      "Postponed games are marked with a badge and the reason they were stood down.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-08-16",
    notes: [
      "All three ligas — Women’s, Premier and Youth U21 — run side by side.",
      "Added the About page.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-08-10",
    notes: ["First version: schedule and results."],
  },
];
