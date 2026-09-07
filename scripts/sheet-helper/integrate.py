"""Add TEST tabs/helper to an explicitly approved existing workbook.

Never edits existing cells, script source files, manifest, triggers or properties.
Requires an outside-repo state file and --approve-existing-workbook on apply.
"""
import argparse
import hashlib
import json
import re
import secrets
import subprocess
from pathlib import Path

from google.auth.transport.requests import AuthorizedSession
from google.oauth2.credentials import Credentials
from install import MARKER, SHEETS, SCRIPTS, SOURCE, request, save_state

TEST_TITLES = ["TEST — Helper", "_TEST_Seasons", "_TEST_Ligas"]
FILE_NAMES = ["LigaHelper", "LigaHelperConfig", "Sidebar"]


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=True).encode()).hexdigest()


def clean_files(content):
    return [{key: file[key] for key in ("name", "type", "source")} for file in content["files"]]


def files_map(files):
    return {file["name"]: (file["type"], file["source"]) for file in files}


def metadata(session, sheet_id):
    return request(session, "GET", f"{SHEETS}/{sheet_id}", params={"fields": "spreadsheetId,properties,sheets(properties)"})


def snapshot_cells(session, sheet_id, properties):
    ranges = ["'" + prop["title"].replace("'", "''") + "'" for prop in properties]
    params = [("ranges", value) for value in ranges] + [("valueRenderOption", "FORMULA")]
    result = request(session, "GET", f"{SHEETS}/{sheet_id}/values:batchGet", params=params)
    return {str(prop["sheetId"]): digest(row.get("values", [])) for prop, row in zip(properties, result["valueRanges"], strict=True)}


def helper_files(sheet_id):
    return [
        {"name": "LigaHelper", "type": "SERVER_JS", "source": (SOURCE / "Code.gs").read_text(encoding="utf-8")},
        {"name": "LigaHelperConfig", "type": "SERVER_JS", "source": f"const HELPER_SPREADSHEET_ID = {json.dumps(sheet_id)};\nconst HELPER_MARKER = {json.dumps(MARKER)};\n"},
        {"name": "Sidebar", "type": "HTML", "source": (SOURCE / "Sidebar.html").read_text(encoding="utf-8")},
    ]


def merge_files(original, additions):
    if set(files_map(original)) & set(files_map(additions)):
        raise ValueError("Existing project has a helper filename collision; manual review required")
    # Parse lexical scopes and compile the combined project without executing it.
    checked = subprocess.run(["node", str(SOURCE / "project-globals.mjs")],
                             input=json.dumps([original, additions]), text=True,
                             capture_output=True, timeout=30, check=False)
    if checked.returncode:
        try:
            message = json.loads(checked.stdout).get("message", "Project merge check failed")
        except json.JSONDecodeError:
            message = "Project merge check failed; ensure Node and repository dependencies are installed"
        raise ValueError(message)
    return original + additions


def prepare(session, path, sheet_id, script_id):
    if path.exists():
        raise ValueError("State already exists; inspect it instead of overwriting the backup")
    project = request(session, "GET", f"{SCRIPTS}/{script_id}")
    if project.get("parentId") != sheet_id:
        raise ValueError("Script does not belong to the requested workbook")
    content = request(session, "GET", f"{SCRIPTS}/{script_id}/content")
    original = clean_files(content)
    merge_files(original, helper_files(sheet_id))
    code = "\n".join(f["source"] for f in original if f["type"] == "SERVER_JS")
    if not re.search(r'const WATCHED_SHEET_NAME\s*=\s*"CURRENT"\s*;', code):
        raise ValueError("Existing CURRENT trigger requires manual review")
    book = metadata(session, sheet_id)
    props = [sheet["properties"] for sheet in book["sheets"]]
    if set(TEST_TITLES) & {p["title"] for p in props}:
        raise ValueError("A requested TEST tab already exists; refusing to overwrite it")
    state = {"mode": "existing-workbook-test-tabs", "spreadsheetId": sheet_id, "scriptId": script_id,
             "originalFiles": original, "originalProperties": book["properties"], "originalSheets": props,
             "originalCellHashes": snapshot_cells(session, sheet_id, props)}
    save_state(path, state)
    return {"prepared": True, "existingTabs": len(props), "backup": str(path)}


def original_unchanged(session, state):
    project = request(session, "GET", f"{SCRIPTS}/{state['scriptId']}")
    if project.get("parentId") != state["spreadsheetId"]:
        raise ValueError("Bound project changed parent")
    book = metadata(session, state["spreadsheetId"])
    current_props = {p["properties"]["sheetId"]: p["properties"] for p in book["sheets"]}
    if book["properties"] != state["originalProperties"]:
        raise ValueError("Workbook properties changed since backup; manual review required")
    if any(current_props.get(p["sheetId"]) != p for p in state["originalSheets"]):
        raise ValueError("An existing tab changed structure since backup; manual review required")
    if snapshot_cells(session, state["spreadsheetId"], state["originalSheets"]) != state["originalCellHashes"]:
        raise ValueError("Existing cell data/formulas changed since backup; no data will be restored automatically")
    current = clean_files(request(session, "GET", f"{SCRIPTS}/{state['scriptId']}/content"))
    current_map = files_map(current)
    if any(current_map.get(f["name"]) != (f["type"], f["source"]) for f in state["originalFiles"]):
        raise ValueError("Existing script source changed since backup; refusing to overwrite it")
    allowed = set(files_map(state["originalFiles"])) | (set(FILE_NAMES) if state.get("uploaded") else set())
    if set(current_map) - allowed:
        raise ValueError("Unexpected new script files found; refusing to discard them")
    return book


def tab_requests(ids):
    requests = []
    for index, title in enumerate(TEST_TITLES):
        requests.append({"addSheet": {"properties": {"sheetId": ids[index], "title": title, "hidden": index != 0,
            "gridProperties": {"rowCount": 1000 if index else 40, "columnCount": [8, 4, 3][index], "hideGridlines": index == 0}}}})
    content = {
        0: [[], ["", MARKER], [], ["", "HOCKEY LIGA / TEST WORKSPACE"], ["", "Your season. Your sheet."], [],
            ["", "PREVIEW ONLY — LIVE CURRENT IS UNCHANGED"], [],
            ["", "Open the helper"], ["", "Reload this workbook, then choose Liga helper → Open helper."],
            ["", "Use desktop Google Sheets. First use may request permission."], [],
            ["", "Create a draft season"], ["", "Add a liga, enter its teams, and schedule a fixture."],
            ["", "New fixture tabs begin TEST_. No real results are preloaded."], [],
            ["", "Enter a result"], ["", "Use Open fixture sheet. Fill both scores and set Status to Played."],
            ["", "Choose Check season before switching the current TEST season."], [],
            ["", "Safe to try — not private"], ["", "These tabs inherit this workbook’s viewer/editor permissions."],
            ["", "The existing refresh script still watches CURRENT only."],
            ["", "The live tabs, workbook timezone and refresh script files are unchanged."]],
        1: [["id", "name", "status", "sheetName"]], 2: [["seasonId", "name", "teams"]],
    }
    for index, rows in content.items():
        requests.append({"updateCells": {"start": {"sheetId": ids[index]}, "rows": [{"values": [{"userEnteredValue": {"stringValue": cell}} for cell in row]} for row in rows], "fields": "userEnteredValue"}})
    def rg(start, end):
        return {"sheetId": ids[0], "startRowIndex": start, "endRowIndex": end, "startColumnIndex": 1, "endColumnIndex": 8}
    for row in range(3, len(content[0])):
        requests.append({"mergeCells": {"range": rg(row, row + 1), "mergeType": "MERGE_ALL"}})
    requests.extend([
        {"repeatCell": {"range": {"sheetId": ids[0]}, "cell": {"userEnteredFormat": {"backgroundColor": {"red": 0.96, "green": 0.97, "blue": 0.96}, "textFormat": {"fontFamily": "Arial", "fontSize": 11}, "verticalAlignment": "MIDDLE"}}, "fields": "userEnteredFormat"}},
        {"updateDimensionProperties": {"range": {"sheetId": ids[0], "dimension": "COLUMNS", "startIndex": 1, "endIndex": 8}, "properties": {"pixelSize": 110}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": ids[0], "dimension": "COLUMNS", "startIndex": 0, "endIndex": 1}, "properties": {"pixelSize": 32}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": ids[0], "dimension": "ROWS", "startIndex": 0, "endIndex": 40}, "properties": {"pixelSize": 30}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": ids[0], "dimension": "ROWS", "startIndex": 1, "endIndex": 2}, "properties": {"hiddenByUser": True}, "fields": "hiddenByUser"}},
        {"addProtectedRange": {"protectedRange": {"range": {"sheetId": ids[0]}, "description": "Helper instructions / safety marker", "warningOnly": True}}},
    ])
    for row in [3, 4, 6, 8, 12, 16, 20]:
        requests.append({"repeatCell": {"range": rg(row, row + 1), "cell": {"userEnteredFormat": {"textFormat": {"bold": True, "fontSize": 24 if row == 4 else 11, "foregroundColor": {"red": 0.13, "green": 0.36, "blue": 0.26}}}}, "fields": "userEnteredFormat.textFormat"}})
    return requests


def apply(session, path, state):
    if state.get("mode") != "existing-workbook-test-tabs":
        raise ValueError("Wrong installation state")
    book = original_unchanged(session, state)
    if not state.get("tabsCreated"):
        if set(TEST_TITLES) & {s["properties"]["title"] for s in book["sheets"]}:
            raise ValueError("TEST tabs already exist; refusing to overwrite them")
        taken = {s["properties"]["sheetId"] for s in book["sheets"]}
        ids = []
        while len(ids) < 3:
            number = secrets.randbelow(2147483647)
            if number not in taken:
                ids.append(number)
                taken.add(number)
        state["testSheetIds"] = ids
        save_state(path, state)
        request(session, "POST", f"{SHEETS}/{state['spreadsheetId']}:batchUpdate", json={"requests": tab_requests(ids)})
        state["tabsCreated"] = True
        save_state(path, state)
    # Check all original data/source again immediately before the project-wide PUT.
    original_unchanged(session, state)
    files = merge_files(state["originalFiles"], helper_files(state["spreadsheetId"]))
    request(session, "PUT", f"{SCRIPTS}/{state['scriptId']}/content", json={"files": files})
    state["uploaded"] = True
    save_state(path, state)
    return verify(session, state)


def verify(session, state):
    original_unchanged(session, state)
    marker = request(session, "GET", f"{SHEETS}/{state['spreadsheetId']}/values/'TEST — Helper'!B2")
    if marker.get("values") != [[MARKER]]:
        raise ValueError("TEST marker missing")
    expected = merge_files(state["originalFiles"], helper_files(state["spreadsheetId"]))
    actual = clean_files(request(session, "GET", f"{SCRIPTS}/{state['scriptId']}/content"))
    if files_map(expected) != files_map(actual):
        raise ValueError("Installed helper does not match source")
    return {"verified": True, "originalTabsUnchanged": len(state["originalSheets"]), "originalScriptFilesUnchanged": len(state["originalFiles"]),
            "testTabUrl": f"https://docs.google.com/spreadsheets/d/{state['spreadsheetId']}/edit#gid={state['testSheetIds'][0]}",
            "helperHashes": {f["name"]: digest(f["source"]) for f in helper_files(state["spreadsheetId"])} }


def rollback(session, path, state):
    """Restore only verified original script files; no spreadsheet/trigger writes."""
    if state.get("mode") != "existing-workbook-test-tabs":
        raise ValueError("Wrong installation state")
    project = request(session, "GET", f"{SCRIPTS}/{state['scriptId']}")
    if project.get("parentId") != state["spreadsheetId"]:
        raise ValueError("Project parent changed")
    current = clean_files(request(session, "GET", f"{SCRIPTS}/{state['scriptId']}/content"))
    expected = merge_files(state["originalFiles"], helper_files(state["spreadsheetId"]))
    if files_map(current) != files_map(expected):
        raise ValueError("Script changed since installation; refusing to overwrite edits")
    request(session, "PUT", f"{SCRIPTS}/{state['scriptId']}/content", json={"files": state["originalFiles"]})
    restored = clean_files(request(session, "GET", f"{SCRIPTS}/{state['scriptId']}/content"))
    if files_map(restored) != files_map(state["originalFiles"]):
        raise ValueError("Rollback read-back mismatch")
    state["uploaded"] = False
    state["rolledBackForConsent"] = True
    save_state(path, state)
    return {"originalScriptRestored": True, "files": [f["name"] for f in restored], "testTabsRetained": True,
            "triggerExecutionVerified": False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["prepare", "apply", "verify", "rollback"])
    parser.add_argument("--credentials", type=Path, required=True)
    parser.add_argument("--state", type=Path, required=True)
    parser.add_argument("--sheet-id")
    parser.add_argument("--script-id")
    parser.add_argument("--approve-existing-workbook", action="store_true")
    args = parser.parse_args()
    if args.state.resolve().is_relative_to(SOURCE.parent.parent):
        raise ValueError("Keep backups outside the repository")
    session = AuthorizedSession(Credentials.from_authorized_user_file(str(args.credentials)))
    if args.action == "prepare":
        if not args.sheet_id or not args.script_id:
            parser.error("prepare requires --sheet-id and --script-id")
        result = prepare(session, args.state, args.sheet_id, args.script_id)
    else:
        state = json.loads(args.state.read_text())
        if args.action in {"apply", "rollback"} and not args.approve_existing_workbook:
            parser.error("mutation requires explicit --approve-existing-workbook")
        result = (apply(session, args.state, state) if args.action == "apply" else
                  rollback(session, args.state, state) if args.action == "rollback" else verify(session, state))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
