"""Browser UI regression checks. Google RPC is explicitly stubbed; not a Google E2E test.
Run: uv run --with playwright python scripts/sheet-helper/ui-smoke.py --browser PATH --output DIR
"""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--browser", required=True)
parser.add_argument("--output", required=True)
args = parser.parse_args()
source = Path(__file__).with_name("Sidebar.html")
assert source.exists(), "Sidebar.html must exist"
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)

# An explicit test double: never loaded by the installed Apps Script HTML.
stub = r"""
window.testCalls = [];
window.testReject = '';
window.testDelay = 0;
window.testState = {sandbox: true, spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/TEST', currentSeasonId: '', seasons: []};
window.google = {script: {run: new Proxy({}, {get(target, key) {
 if (key === 'withSuccessHandler') return function(fn) {target.success = fn; return this;};
 if (key === 'withFailureHandler') return function(fn) {target.failure = fn; return this;};
 return function(input) {
  window.testCalls.push({method: key, input});
  const success = target.success, failure = target.failure;
  setTimeout(() => {
   if (window.testReject) {failure({message: window.testReject}); return;}
   if (key === 'createSeason') window.testState.seasons.push({id: input.id.toUpperCase(), name: input.name, status: 'Draft', sheetName: 'S_TEST', ligas: [], fixturesCount: 0, playedCount: 0});
   if (key === 'saveLiga') window.testState.seasons[0].ligas = [{name: input.name, teams: input.teams}];
   if (key === 'validateSeason') {success({valid: false, errors: ['Add at least one fixture.'], warnings: [], fixtureCount: 0}); return;}
   success(JSON.parse(JSON.stringify(window.testState)));
  }, window.testDelay);
 };
}})}};
"""
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=args.browser, headless=True)
    page = browser.new_page(viewport={"width": 300, "height": 900}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.add_init_script(stub)
    page.goto(source.resolve().as_uri())
    page.get_by_role("button", name="New season", exact=True).click()
    page.get_by_label("Season ID", exact=True).fill("BAD_ID")
    assert not page.get_by_label("Season ID", exact=True).evaluate("e => e.checkValidity()"), "Invalid season ID was accepted by HTML pattern"
    page.get_by_label("Season ID", exact=True).fill("TEST-2027")
    page.get_by_label("Season name", exact=True).fill("Test season <script>alert(1)</script>")
    page.evaluate("window.testDelay = 200")
    page.get_by_role("button", name="Create draft", exact=True).click()
    page.wait_for_function("window.testState.seasons.length === 1")
    page.get_by_role("button", name="Add liga", exact=True).wait_for()
    assert len(page.evaluate("window.testCalls.filter(c => c.method === 'createSeason')")) == 1
    assert page.locator("script").count() == 1, "Season label injected markup"
    page.get_by_role("button", name="Add liga", exact=True).click()
    page.get_by_label("Liga name", exact=True).fill("DEMO LIGA")
    page.get_by_label("Teams", exact=True).fill("Example A\nExample B\nExample C")
    page.get_by_role("button", name="Save liga", exact=True).click()
    page.get_by_role("button", name="Check season", exact=True).wait_for()
    assert page.evaluate("window.testState.seasons[0].ligas[0].teams.length") == 3
    page.evaluate("window.testState.seasons[0].playedCount = 1")
    page.get_by_role("button", name="Check season", exact=True).click()
    page.get_by_text("Add at least one fixture.", exact=True).wait_for()
    assert page.evaluate("window.testCalls.slice(-2).map(c => c.method)") == ["getHelperState", "validateSeason"], "Check must refresh after direct sheet edits"
    assert page.get_by_role("button", name="Make current in test sheet", exact=True).is_disabled()
    page.get_by_role("button", name="Back", exact=True).click()
    page.get_by_role("button", name="Add fixture", exact=True).click()
    page.get_by_label("Date", exact=True).fill("2027-03-01")
    page.get_by_label("Time", exact=True).fill("15:00")
    page.get_by_label("Home team", exact=True).select_option("Example A")
    page.get_by_label("Away team", exact=True).select_option("Example B")
    page.evaluate("window.testReject = 'Fixture already exists.'")
    page.get_by_role("button", name="Add scheduled fixture", exact=True).click()
    page.get_by_text("Fixture already exists.", exact=True).wait_for()
    assert page.get_by_label("Date", exact=True).input_value() == "2027-03-01", "Failed save lost input"
    assert page.get_by_role("button", name="Add scheduled fixture", exact=True).is_enabled()
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "300px sidebar overflows"
    page.screenshot(path=str(out / "fixture-form.png"), full_page=True)
    page.get_by_role("button", name="Back", exact=True).click()
    page.screenshot(path=str(out / "season-overview.png"), full_page=True)
    page.get_by_role("button", name="New season", exact=True).click()
    page.screenshot(path=str(out / "new-season.png"), full_page=True)
    page.set_viewport_size({"width": 300, "height": 550})
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    assert not errors, errors
    offline = browser.new_page(viewport={"width": 300, "height": 650})
    offline.goto(source.resolve().as_uri())
    offline.get_by_text("Open this helper from the test spreadsheet.", exact=True).wait_for()
    assert offline.get_by_role("button", name="New season", exact=True).count() == 0, "Offline UI silently pretends to save"
    browser.close()
print(json.dumps({"status": "PASS", "checks": ["create season RPC", "escaped season name", "one RPC per save", "liga teams", "invalid activation disabled", "fixture error preserves input", "300px overflow", "short viewport", "offline fails closed", "no browser errors"], "google_rpc": "TEST DOUBLE ONLY", "screenshots": str(out)}))
