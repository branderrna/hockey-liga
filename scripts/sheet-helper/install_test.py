"""Installer safety tests. All Google responses below are explicit unit-test doubles."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

spec = importlib.util.spec_from_file_location("helper_install", Path(__file__).with_name("install.py"))
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class InstallerSafetyTests(unittest.TestCase):
    def state(self):
        return {"marker": installer.MARKER, "spreadsheetId": "TEST", "scriptId": "TEST_SCRIPT"}

    def response(self, value):
        return Mock(ok=True, json=Mock(return_value=value))

    def test_bad_state_never_makes_a_request(self):
        session = Mock()
        with self.assertRaisesRegex(ValueError, "sandbox installation"):
            installer.verify_target(session, {"spreadsheetId": "DO_NOT_ACCESS"})
        session.request.assert_not_called()

    def test_bad_marker_refuses_target(self):
        session = Mock()
        session.request.return_value = self.response({"values": [["LIVE"]]})
        with self.assertRaisesRegex(ValueError, "marker"):
            installer.verify_target(session, self.state())
        self.assertEqual(session.request.call_count, 1)

    def test_create_refuses_existing_installation(self):
        session = Mock()
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            path.write_text(json.dumps(self.state()))
            with self.assertRaisesRegex(ValueError, "already exists"):
                installer.create_sheet(session, path)
        session.request.assert_not_called()

    def test_wrong_script_parent_never_receives_an_upload(self):
        session = Mock()
        with patch.object(installer, "verify_target"), patch.object(installer, "request", return_value={"parentId": "OTHER"}) as request:
            with self.assertRaisesRegex(ValueError, "parent"):
                installer.upload(session, Path("unused"), self.state())
            self.assertEqual(request.call_count, 1)
            self.assertEqual(request.call_args.args[1], "GET")

    def test_source_mismatch_is_not_reported_as_verified(self):
        session = Mock()
        with patch.object(installer, "verify_target"), patch.object(installer, "request", return_value={"files": [{"name": "Code", "source": "outdated"}]}):
            with self.assertRaisesRegex(ValueError, "differs"):
                installer.verify(session, self.state())

    def test_runtime_manifest_has_no_network_or_whole_drive_scope(self):
        manifest = json.loads((Path(__file__).with_name("appsscript.json")).read_text())
        self.assertEqual(manifest["timeZone"], "Asia/Singapore")
        self.assertEqual(set(manifest["oauthScopes"]), {
            "https://www.googleapis.com/auth/spreadsheets.currentonly",
            "https://www.googleapis.com/auth/script.container.ui",
        })


if __name__ == "__main__":
    unittest.main()
