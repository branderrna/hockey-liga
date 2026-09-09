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
  version: "0.10.0",
  date: "2026-09-09",
  notes: [
    "Match notes now follow one format, so a postponement, a moved game or a game stopped early reads the same way wherever you meet it.",
  ],
};

const PREVIOUS: Release = {
  version: "0.9.1",
  date: "2026-09-09",
  notes: ["The season is shown as its year again — both of a year's ligas are that year."],
};

const OLDER_0_9_0: Release = {
  version: "0.9.0",
  date: "2026-09-09",
  notes: [
    "The season's own name is shown on the site — this one is 2026/2 — instead of just the year.",
  ],
};

const OLDER_0_8_1: Release = {
  version: "0.8.1",
  date: "2026-09-09",
  notes: ["Completed ligas are listed under 2026, matching the rest of the season."],
};

const OLDER_0_8_0: Release = {
  version: "0.8.0",
  date: "2026-09-08",
  notes: [
    "Added the complete 2026/1 results archive with round-by-round tables and knockout brackets.",
    "Knockout brackets are drawn as they were played: four quarter-finals into two semi-finals into the final, with lines that follow the winner.",
    "Play-off brackets for the lower places are shown as separate charts, lined up with the main one so each stage sits in the same column.",
    "The bracket has its own tab beside the round tables, and My team shows your knockout run as who you played and how it finished.",
    "A round where the top and bottom halves play separately stays one league table, with points carried forward, so a team can still climb past the half above it. The table says so above it.",
    "A bracket wider than the window can be dragged across, or swiped on a phone.",
    "Round labels and shootout scores now appear in schedules and team views.",
    "If a row of a completed season cannot be read from the league sheet, the page now says so and shows the rest, instead of failing to load.",
  ],
};

export const CURRENT_VERSION = CURRENT.version;

export const releases: Release[] = [
  CURRENT,
  PREVIOUS,
  OLDER_0_9_0,
  OLDER_0_8_1,
  OLDER_0_8_0,
  {
    version: "0.7.1",
    date: "2026-09-07",
    notes: ["The Add to Home Screen screenshots now carry Hockey Liga branding."],
  },
  {
    version: "0.7.0",
    date: "2026-09-07",
    notes: [
      "Added an Add to Home Screen guide, with the steps for Safari on iPhone and iPad and for Chrome on Android.",
      "Each browser's steps come with a screenshot of the menu to look for.",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-09-06",
    notes: [
      "Every page now ends with the date the results were last updated, so a blank score reads as a game not yet played rather than a page that stopped updating.",
      "The footer also carries the site's version. Clicking it opens this history.",
    ],
  },
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
