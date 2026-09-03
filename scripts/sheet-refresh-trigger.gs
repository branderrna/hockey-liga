/**
 * Google Apps Script — bound to the league's fixtures/results Google Sheet.
 *
 * Purpose: when someone edits a score in the sheet, get that change onto the
 * live site quickly instead of waiting for the daily cron in
 * .github/workflows/refresh-fixtures.yml.
 *
 * It does NOT deploy directly. It dispatches `refresh-fixtures.yml`, which
 * re-reads the sheet, validates it, commits `src/data/matches.generated.ts`
 * only if something actually changed, and then hands off to `deploy.yml` via
 * `workflow_run`. Reusing that path means a sheet edit goes through exactly
 * the same validation gate as a code change — a malformed row fails
 * `npm test` instead of reaching the site.
 *
 * Setup lives in docs/fixtures-refresh.md. Two things must be done by hand in
 * the Apps Script editor: store the GitHub token in Script Properties, then
 * run installTriggers() once.
 */

const GITHUB_OWNER = "branderrna";
const GITHUB_REPO = "hockey-liga";
const WORKFLOW_FILE = "refresh-fixtures.yml";
const WORKFLOW_REF = "main";

/** Only edits on this tab are worth a refresh — it is the tab the script reads. */
const WATCHED_SHEET_NAME = "COMPLETE";

/** Script Property names. The token is never committed to the repository. */
const TOKEN_PROPERTY = "GITHUB_TOKEN";
const PENDING_PROPERTY = "refreshPending";

/** How often flushPendingRefresh() runs. Also the worst-case edit-to-live delay. */
const FLUSH_INTERVAL_MINUTES = 10;

/**
 * Installable edit trigger. Deliberately does almost nothing.
 *
 * Two reasons this cannot dispatch directly:
 *   1. A *simple* onEdit(e) runs unauthorized and cannot use UrlFetchApp at
 *      all. This must be installed via installTriggers() to get authorization.
 *   2. onEdit fires per cell. Entering ten scores would fire ten times, and
 *      refresh-fixtures.yml queues rather than cancels
 *      (concurrency.cancel-in-progress: false), so each one would pile up.
 *
 * So an edit only marks the sheet dirty; flushPendingRefresh() coalesces any
 * number of edits into at most one workflow run per interval.
 */
function onSheetEdit(e) {
  if (!e || !e.range) return;
  if (e.range.getSheet().getName() !== WATCHED_SHEET_NAME) return;
  PropertiesService.getScriptProperties().setProperty(PENDING_PROPERTY, "1");
}

/**
 * Time-driven trigger. Dispatches the refresh workflow if any edit landed
 * since the last run.
 */
function flushPendingRefresh() {
  const lock = LockService.getScriptLock();
  // Skip rather than queue: if the previous run is still going, its dispatch
  // already covers the pending edits.
  if (!lock.tryLock(5000)) return;

  try {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty(PENDING_PROPERTY) !== "1") return;

    dispatchRefreshWorkflow();

    // Cleared only after a successful dispatch. Clearing first would silently
    // drop the edit if GitHub were unreachable. A duplicate dispatch is
    // harmless by comparison — the workflow exits without committing when the
    // generated file is unchanged.
    props.deleteProperty(PENDING_PROPERTY);
  } finally {
    lock.releaseLock();
  }
}

/** Fires refresh-fixtures.yml on main. Throws on any non-204 response. */
function dispatchRefreshWorkflow() {
  const token = PropertiesService.getScriptProperties().getProperty(TOKEN_PROPERTY);
  if (!token) {
    throw new Error(
      "Missing Script Property " +
        TOKEN_PROPERTY +
        ". See docs/fixtures-refresh.md for how to create and store the token.",
    );
  }

  const url =
    "https://api.github.com/repos/" +
    GITHUB_OWNER +
    "/" +
    GITHUB_REPO +
    "/actions/workflows/" +
    WORKFLOW_FILE +
    "/dispatches";

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    payload: JSON.stringify({ ref: WORKFLOW_REF }),
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  // A successful workflow dispatch returns 204 with an empty body.
  if (status !== 204) {
    throw new Error(
      "GitHub workflow dispatch failed (HTTP " + status + "): " + response.getContentText(),
    );
  }
}

/**
 * Run once from the Apps Script editor to install both triggers. Safe to re-run:
 * it removes this script's existing triggers first, so it will not stack
 * duplicates.
 */
function installTriggers() {
  const handlers = ["onSheetEdit", "flushPendingRefresh"];
  ScriptApp.getProjectTriggers()
    .filter((t) => handlers.indexOf(t.getHandlerFunction()) !== -1)
    .forEach((t) => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger("onSheetEdit").forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();

  ScriptApp.newTrigger("flushPendingRefresh")
    .timeBased()
    .everyMinutes(FLUSH_INTERVAL_MINUTES)
    .create();
}

/**
 * Convenience check for the Apps Script editor: dispatches a refresh right now,
 * bypassing the pending flag. Use it to confirm the token works after setup.
 */
function testDispatchNow() {
  dispatchRefreshWorkflow();
}
