"""Offline tests of additive existing-workbook installation. No Google mutations."""
import unittest
from unittest.mock import Mock, patch
from pathlib import Path
import integrate


class IntegrationSafetyTests(unittest.TestCase):
    def test_preserves_original_code_and_manifest_exactly(self):
        original = [{"name": "Code", "type": "SERVER_JS", "source": "function onSheetEdit(e) {}\n"},
                    {"name": "appsscript", "type": "JSON", "source": '{"timeZone":"Asia/Singapore"}'}]
        merged = integrate.merge_files(original, integrate.helper_files("TEST"))
        self.assertEqual(merged[:2], original)
        self.assertEqual(len(merged), 5)

    def test_rejects_existing_menu_or_filename_collision(self):
        for original in [[{"name": "Existing", "type": "SERVER_JS", "source": "function onOpen(e) {}"}],
                         [{"name": "Sidebar", "type": "HTML", "source": "existing"}]]:
            with self.assertRaisesRegex(ValueError, "collision"):
                integrate.merge_files(original, integrate.helper_files("TEST"))

    def test_detects_indented_global_collisions_without_flagging_locals(self):
        additions = integrate.helper_files("TEST")
        for source in ["  function onOpen(e) {}", "  const HELPER_SPREADSHEET_ID = 'existing';"]:
            with self.assertRaisesRegex(ValueError, "collision"):
                integrate.merge_files([{"name": "Original", "type": "SERVER_JS", "source": source}], additions)
        original = [{"name": "Original", "type": "SERVER_JS", "source": "function unrelated() { const HELPER_SPREADSHEET_ID = 'local'; }"}]
        self.assertEqual(integrate.merge_files(original, additions)[:1], original)

    def test_every_sheet_write_targets_only_new_tab_ids(self):
        allowed = {111, 222, 333}
        requests = integrate.tab_requests(list(allowed))
        found = []
        def walk(obj):
            if isinstance(obj, dict):
                if "sheetId" in obj:
                    found.append(obj["sheetId"])
                for val in obj.values():
                    walk(val)
            elif isinstance(obj, list):
                for val in obj:
                    walk(val)
        walk(requests)
        self.assertTrue(found)
        self.assertEqual(set(found), allowed)
        operations = {key for req in requests for key in req}
        self.assertFalse({"deleteSheet", "updateSpreadsheetProperties", "deleteDimension"} & operations)
        titles = [r["addSheet"]["properties"]["title"] for r in requests if "addSheet" in r]
        self.assertEqual(titles, integrate.TEST_TITLES)

    def test_rollback_only_restores_script_and_leaves_tabs(self):
        original = [{"name": "Code", "type": "SERVER_JS", "source": "function original() {}"}]
        state = {"mode": "existing-workbook-test-tabs", "spreadsheetId": "S", "scriptId": "P",
                 "originalFiles": original, "uploaded": True}
        merged = integrate.merge_files(original, integrate.helper_files("S"))
        with patch.object(integrate, "request", side_effect=[{"parentId": "S"}, {"files": merged}, {}, {"files": original}]) as req, patch.object(integrate, "save_state"):
            result = integrate.rollback(Mock(), Path("unused"), state)
        self.assertTrue(result["originalScriptRestored"])
        self.assertFalse(state["uploaded"])
        self.assertTrue(all("sheets.googleapis.com" not in call.args[2] for call in req.call_args_list))
        self.assertEqual(req.call_args_list[2].kwargs["json"]["files"], original)

    def test_rollback_refuses_to_overwrite_unexpected_edits(self):
        state = {"mode": "existing-workbook-test-tabs", "spreadsheetId": "S", "scriptId": "P", "originalFiles": []}
        with patch.object(integrate, "request", side_effect=[{"parentId": "S"}, {"files": [{"name": "Unexpected", "type": "SERVER_JS", "source": "user edit"}]}]) as req:
            with self.assertRaisesRegex(ValueError, "changed"):
                integrate.rollback(Mock(), Path("unused"), state)
        self.assertTrue(all(call.args[1] == "GET" for call in req.call_args_list))

    def test_changed_source_stops_before_upload(self):
        state = {"mode": "existing-workbook-test-tabs"}
        with patch.object(integrate, "original_unchanged", side_effect=ValueError("changed")), patch.object(integrate, "request") as request:
            with self.assertRaisesRegex(ValueError, "changed"):
                integrate.apply(Mock(), Path("unused"), state)
            request.assert_not_called()


if __name__ == "__main__":
    unittest.main()
