# Hockey Liga Sheets helper — TEST-tab preview

A bound Apps Script sidebar for trying season, liga, team and fixture setup in
`TEST_…` tabs. It does **not** publish website data or replace the live `CURRENT`
workflow. Real historical results are not preloaded.

## Preview capabilities

- Create a Draft season with a stable ID and display name.
- Copy another test season’s ligas and teams, without copying fixtures or scores.
- Add/edit a liga and its team list; prevent removal of teams used by fixtures.
- Schedule fixtures with stable UUIDs and controlled teams/stages/statuses.
- Enter results directly in the generated fixture tab.
- Validate dates, times, teams, duplicates, statuses, scores and shootout pairs.
- Switch the current **test** season after validation. This only changes helper
  metadata, not the live `CURRENT` tab, sheet gid, website or refresh configuration.

Stages are League, Quarter-final, Semi-final, Final and Placement. Statuses are
Scheduled, Played, Postponed and Cancelled. Supported stages are labels, not a
complete competition-format/ranking engine. Historical migration, standings rules,
season date bounds, reschedule linkage and automated round-robin generation remain
outside this preview.

## Tab layout and scope

- `TEST — Helper`: instructions and the exact safety marker in B2.
- `_TEST_Seasons`: hidden season registry.
- `_TEST_Ligas`: hidden liga/team configuration.
- `TEST_<SEASON-ID>`: generated fixture sheets.

The bound spreadsheet ID, safety marker, metadata headers and exact fixture tab
mapping are checked before helper writes. An edited metadata row cannot redirect
writes to `CURRENT` or another existing tab. Hidden sheets and warning-only
protections are **not security boundaries**: all test tabs inherit the workbook’s
sharing permissions. Do not place credentials or confidential notes in them.

Fixture columns: Date, Time, Liga, Stage, Home, Away, Home Score, Away Score,
Status, Venue, Notes, Match ID, Home Shootout, Away Shootout.

Helper dates/times are stored as text, explicitly using `YYYY-MM-DD` / `HH:mm`
Singapore fixture semantics. Integrating into an existing workbook does not change
its timezone or locale. Mark a completed fixture Played and fill both main scores.
A decisive shootout for a drawn knockout goes in the separate shootout columns;
do not put `2 - 2 (4 - 5)` in a score cell. Knockouts are not standings rows.

Locks serialize helper writes, not human cell editing. Sheet changes do not auto-
validate: use **Check season**, which refreshes the state and reports errors with
physical sheet row numbers. Activation revalidates under the document lock.

## Google authorization: check before touching a live script

There are three independent setup gates: OAuth `script.projects` access for the
installer, Apps Script API enablement in the Cloud project, and the account’s
Apps Script API switch at <https://script.google.com/home/usersettings>.

The bound helper then needs its own first-run permission. **Adding a new service
can make the existing project’s installable triggers require reauthorization by
their creator**, even when the original source and manifest are unchanged. Have
that account available for the first-run check. If consent fails, roll back the
added helper files rather than leave the live project awaiting new permissions.
See [Google’s authorization guidance](https://developers.google.com/apps-script/guides/services/authorization).

Never revoke working credentials as a first troubleshooting step. A recurring
Google 401 before consent does not prove the helper code is failing. A private
browser session can isolate Google login/session issues; it is not a guaranteed
fix. Do not reuse a stale session-specific consent URL.

## Existing-workbook installation (explicit approval required)

`integrate.py` requires Node and this repository’s installed dependencies for its
scope-aware JavaScript merge check. It appends test tabs and helper files to the specifically approved
workbook and its verified existing bound project. It makes an outside-repository
backup, hashes original cells/formulas, checks global/file collisions and preserves
the original manifest/source exactly. It changes no trigger registrations, script
properties, permissions, original tab cells or workbook settings.

```sh
python scripts/sheet-helper/integrate.py prepare \
  --credentials /private/google_apps_script_token.json \
  --state /private/liga-helper-backup.json \
  --sheet-id APPROVED_WORKBOOK_ID --script-id ITS_EXISTING_BOUND_SCRIPT_ID

python scripts/sheet-helper/integrate.py apply --approve-existing-workbook \
  --credentials /private/google_apps_script_token.json \
  --state /private/liga-helper-backup.json

python scripts/sheet-helper/integrate.py verify \
  --credentials /private/google_apps_script_token.json \
  --state /private/liga-helper-backup.json
```

Reload desktop Google Sheets and choose **Liga helper → Open helper**. Complete
consent as the original trigger creator. Do not run `installTriggers` or
`testDispatchNow` just to test this preview: those touch the existing live workflow.

If authorization fails:

```sh
python scripts/sheet-helper/integrate.py rollback --approve-existing-workbook \
  --credentials /private/google_apps_script_token.json \
  --state /private/liga-helper-backup.json
```

Rollback restores only the backed-up script files and retains the test tabs. It
refuses to overwrite unexpected source edits. Source restoration is not proof that
a live trigger has executed; verify that separately without forcing an unwanted
production refresh. Keep installation backups outside Git and private: an existing
script could contain a credential. No automatic data restoration is attempted if
someone edits the original workbook between verification steps.

## Alternative: a separate private spreadsheet

`install.py create` makes a new private sandbox, never accepts a target sheet ID,
and saves its handle outside the repository. `upload` creates/binds its project and
verifies the files read back from Google. `verify` checks the bound project, marker
and exact source. All commands require `--credentials` and `--state` as above.
This alternative changes no sharing settings. Do not confuse a new spreadsheet
file with a test tab inside an existing workbook; confirm the intended location.
The supplied standalone manifest uses Singapore time and only current-spreadsheet
and container-UI scopes. It is **not** used to replace an existing live manifest.

## Checks and limits of verification

```sh
npm test
python scripts/sheet-helper/install_test.py
python scripts/sheet-helper/integrate_test.py
uv run --with playwright python scripts/sheet-helper/ui-smoke.py \
  --browser 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe' \
  --output /private/sheet-helper-qa
npm run lint
npx tsc --noEmit
npm run build
```

Backend tests run real helper source against in-memory SpreadsheetApp test doubles.
Browser tests exercise the actual sidebar HTML at 300px width and short-height
viewports with **explicitly stubbed** Google RPC. They check form validation,
escaping, duplicate submissions, preserved inputs after errors and offline failure.
These are not proof of execution inside Google Sheets. API source read-back proves
installation, not successful first-run consent or operation of live triggers.

Website integration remains blocked on validated season-specific configuration,
historical source reconciliation and actual Sheets workflow acceptance testing.
