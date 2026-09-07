"""Install ONLY into a new, explicitly marked helper sandbox. Never accepts a sheet ID.

Credentials and installation state stay outside the repository. No sharing,
production deployment, live fixture access, or automatic retries of writes.
"""
import argparse
import hashlib
import json
from pathlib import Path

from google.auth.transport.requests import AuthorizedSession
from google.oauth2.credentials import Credentials

MARKER = "HOCKEY_LIGA_HELPER_SANDBOX_V1"
SHEETS = "https://sheets.googleapis.com/v4/spreadsheets"
SCRIPTS = "https://script.googleapis.com/v1/projects"
SOURCE = Path(__file__).resolve().parent


def request(session, method, url, **kwargs):
    response = session.request(method, url, timeout=60, **kwargs)
    if not response.ok:
        try:
            message = response.json().get("error", {}).get("message", "Google API error")
        except ValueError:
            message = "Non-JSON response from Google API"
        raise RuntimeError(f"HTTP {response.status_code}: {message}")
    return response.json()


def save_state(path, state):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2))


def verify_target(session, state):
    if state.get("marker") != MARKER or not state.get("spreadsheetId"):
        raise ValueError("Not a helper sandbox installation state")
    url = f"{SHEETS}/{state['spreadsheetId']}"
    marker = request(session, "GET", f"{url}/values/'TEST — Helper'!B2").get("values", [])
    if marker != [[MARKER]]:
        raise ValueError("Sandbox marker missing or changed; refusing access")
    metadata = request(session, "GET", url, params={"fields": "spreadsheetId,properties(title),spreadsheetUrl"})
    if not metadata["properties"]["title"].startswith("Hockey Liga — HELPER TEST"):
        raise ValueError("Spreadsheet is not explicitly named as a helper test")
    return url


def create_sheet(session, path):
    if path.exists():
        raise ValueError("Installation state already exists; use upload or verify, not create")
    sheet = request(session, "POST", SHEETS, json={
        "properties": {"title": "Hockey Liga — HELPER TEST", "locale": "en_GB", "timeZone": "Asia/Singapore"},
        "sheets": [
            {"properties": {"sheetId": 0, "title": "TEST — Helper", "gridProperties": {"rowCount": 40, "columnCount": 8, "hideGridlines": True}}},
            {"properties": {"sheetId": 1, "title": "_TEST_Seasons", "hidden": True, "gridProperties": {"rowCount": 100, "columnCount": 4}}},
            {"properties": {"sheetId": 2, "title": "_TEST_Ligas", "hidden": True, "gridProperties": {"rowCount": 500, "columnCount": 3}}},
        ],
    })
    state = {"spreadsheetId": sheet["spreadsheetId"], "spreadsheetUrl": sheet["spreadsheetUrl"], "marker": MARKER}
    # Save the new handle immediately. A subsequent failure never loses its identity.
    save_state(path, state)
    base = f"{SHEETS}/{state['spreadsheetId']}"
    rows = {
        2: ["", MARKER],
        4: ["", "HOCKEY LIGA"],
        5: ["", "Your season. Your sheet."],
        7: ["", "HELPER TEST  /  NOT CONNECTED TO THE WEBSITE"],
        9: ["", "A separate workspace to try the new season helper."],
        10: ["", "No live fixtures, scores, sharing settings or refresh scripts are changed."],
        13: ["", "01   OPEN THE HELPER"],
        14: ["", "After installation, reload this sheet. Choose Liga helper → Open helper."],
        15: ["", "Use Google Sheets in a desktop browser. First use may request permission."],
        18: ["", "02   BUILD A SEASON"],
        19: ["", "Create a draft. Add a liga and at least two teams. Schedule a fixture."],
        20: ["", "Copy a season to reuse its setup — never its fixtures or scores."],
        23: ["", "03   ENTER A RESULT"],
        24: ["", "Open the fixture sheet. Fill both score columns and set Status to Played."],
        25: ["", "Use the separate shootout columns for a tied knockout. Then Check season."],
        28: ["", "SAFE TO EXPERIMENT"],
        29: ["", "Make current switches this test workbook only. It does not publish anything."],
        30: ["", "Keep this file private. The helper is an unconnected prototype, not a live importer."],
    }
    data = [{"range": f"'TEST — Helper'!A{row}:B{row}", "values": [values]} for row, values in rows.items()]
    data.extend([
        {"range": "_TEST_Seasons!A1:D1", "values": [["id", "name", "status", "sheetName"]]},
        {"range": "_TEST_Ligas!A1:C1", "values": [["seasonId", "name", "teams"]]},
    ])
    request(session, "POST", base + "/values:batchUpdate", json={"valueInputOption": "RAW", "data": data})
    ink = {"red": 0.09, "green": 0.17, "blue": 0.14}
    green = {"red": 0.13, "green": 0.36, "blue": 0.26}
    wash = {"red": 0.96, "green": 0.97, "blue": 0.96}
    reqs = [
        {"repeatCell": {"range": {"sheetId": 0}, "cell": {"userEnteredFormat": {"backgroundColor": wash, "textFormat": {"fontFamily": "Arial", "fontSize": 11, "foregroundColor": ink}, "verticalAlignment": "MIDDLE"}}, "fields": "userEnteredFormat"}},
        {"updateDimensionProperties": {"range": {"sheetId": 0, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 1}, "properties": {"pixelSize": 34}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": 0, "dimension": "COLUMNS", "startIndex": 1, "endIndex": 8}, "properties": {"pixelSize": 108}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": 0, "dimension": "ROWS", "startIndex": 0, "endIndex": 40}, "properties": {"pixelSize": 28}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": 0, "dimension": "ROWS", "startIndex": 1, "endIndex": 2}, "properties": {"hiddenByUser": True}, "fields": "hiddenByUser"}},
        {"addProtectedRange": {"protectedRange": {"range": {"sheetId": 0}, "description": "Sandbox instructions and safety marker — do not edit", "warningOnly": True}}},
    ]
    for row in rows:
        if row == 2:
            continue
        rg = {"sheetId": 0, "startRowIndex": row - 1, "endRowIndex": row, "startColumnIndex": 1, "endColumnIndex": 8}
        reqs.append({"mergeCells": {"range": rg, "mergeType": "MERGE_ALL"}})
        if row in [4, 5, 7, 13, 18, 23, 28]:
            reqs.append({"repeatCell": {"range": rg, "cell": {"userEnteredFormat": {"textFormat": {"bold": True, "fontSize": 26 if row == 5 else 11, "foregroundColor": green}}}, "fields": "userEnteredFormat.textFormat"}})
    reqs.append({"updateDimensionProperties": {"range": {"sheetId": 0, "dimension": "ROWS", "startIndex": 4, "endIndex": 5}, "properties": {"pixelSize": 48}, "fields": "pixelSize"}})
    request(session, "POST", base + ":batchUpdate", json={"requests": reqs})
    verify_target(session, state)
    return state


def project_files(state):
    files = [{"name": "Sandbox", "type": "SERVER_JS", "source": f"const HELPER_SPREADSHEET_ID = {json.dumps(state['spreadsheetId'])};\nconst HELPER_MARKER = {json.dumps(MARKER)};\n"}]
    for name, kind, filename in [("Code", "SERVER_JS", "Code.gs"), ("Sidebar", "HTML", "Sidebar.html"), ("appsscript", "JSON", "appsscript.json")]:
        files.append({"name": name, "type": kind, "source": (SOURCE / filename).read_text(encoding="utf-8")})
    return files


def upload(session, path, state):
    verify_target(session, state)
    files = project_files(state)
    if not state.get("scriptId"):
        project = request(session, "POST", SCRIPTS, json={"title": "Hockey Liga helper — sandbox only", "parentId": state["spreadsheetId"]})
        state["scriptId"] = project["scriptId"]
        save_state(path, state)
    project = request(session, "GET", f"{SCRIPTS}/{state['scriptId']}")
    if project.get("parentId") != state["spreadsheetId"]:
        raise ValueError("Script parent is not this sandbox; refusing upload")
    request(session, "PUT", f"{SCRIPTS}/{state['scriptId']}/content", json={"files": files})
    return verify(session, state)


def verify(session, state):
    verify_target(session, state)
    if state.get("scriptId"):
        actual = request(session, "GET", f"{SCRIPTS}/{state['scriptId']}/content")
        want = {f["name"]: f["source"] for f in project_files(state)}
        got = {f["name"]: f["source"] for f in actual["files"]}
        if want != got:
            raise ValueError("Installed source differs from local source")
        state = dict(state, verifiedFiles={name: hashlib.sha256(source.encode()).hexdigest() for name, source in got.items()})
    return state


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["create", "upload", "verify"])
    parser.add_argument("--credentials", type=Path, required=True)
    parser.add_argument("--state", type=Path, required=True)
    args = parser.parse_args()
    if args.state.resolve().is_relative_to(SOURCE.parent.parent):
        raise ValueError("Installation state must be outside the repository")
    session = AuthorizedSession(Credentials.from_authorized_user_file(str(args.credentials)))
    if args.action == "create":
        result = create_sheet(session, args.state)
    else:
        state = json.loads(args.state.read_text())
        result = upload(session, args.state, state) if args.action == "upload" else verify(session, state)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
