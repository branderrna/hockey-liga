import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { checkProject } from "./project-globals.mjs";

test("project merge guard catches indented globals without executing source", () => {
  const file = (source) => [{ name: "Code", type: "SERVER_JS", source }];
  assert.throws(
    () => checkProject(file("  function onOpen() {}"), file("function onOpen() {}")),
    /collision/,
  );
  assert.throws(() => checkProject(file("const id = 1;"), file("const id = 2;")), /collision/);
  assert.doesNotThrow(() =>
    checkProject(
      file("function previous() { const id = 1; }"),
      file("const id = 2; throw new Error('must not execute');"),
    ),
  );
});

const codePath = new URL("./Code.gs", import.meta.url);
const HEADERS = [
  "Date",
  "Time",
  "Liga",
  "Stage",
  "Home",
  "Away",
  "Home score",
  "Away score",
  "Status",
  "Venue",
  "Notes",
  "Match ID",
  "Home shootout",
  "Away shootout",
];
const MARKER = "HOCKEY_LIGA_HELPER_SANDBOX_V1";

// Apps Script is unavailable in Node. Only its storage/UI/lock boundary is mocked;
// every business rule and public API below runs the actual Code.gs in a V8 VM.
class Range {
  constructor(sheet, row, column, rows = 1, columns = 1) {
    Object.assign(this, { sheet, row, column, rows, columns });
  }
  getValues() {
    return Array.from({ length: this.rows }, (_, r) =>
      Array.from(
        { length: this.columns },
        (_, c) => this.sheet.cells[this.row + r - 1]?.[this.column + c - 1] ?? "",
      ),
    );
  }
  getDisplayValues() {
    return this.getValues().map((row) => row.map(String));
  }
  getValue() {
    return this.getValues()[0][0];
  }
  getFormulas() {
    return this.getValues().map((row) =>
      row.map((v) => (typeof v === "string" && v.startsWith("=") ? v : "")),
    );
  }
  setValues(values) {
    assert.equal(values.length, this.rows);
    for (let r = 0; r < this.rows; r++) {
      assert.equal(values[r].length, this.columns);
      this.sheet.cells[this.row + r - 1] ??= [];
      for (let c = 0; c < this.columns; c++)
        this.sheet.cells[this.row + r - 1][this.column + c - 1] = values[r][c];
    }
    this.sheet.writes++;
    return this;
  }
  setValue(value) {
    return this.setValues([[value]]);
  }
  setNumberFormat(value) {
    this.sheet.formats.push({
      row: this.row,
      column: this.column,
      rows: this.rows,
      columns: this.columns,
      value,
    });
    return this;
  }
  setFontWeight() {
    return this;
  }
  setBackground() {
    return this;
  }
  setFontColor() {
    return this;
  }
  setWrap() {
    return this;
  }
  setDataValidation(rule) {
    this.sheet.validations.push(rule);
    return this;
  }
  createFilter() {
    this.sheet.filter = true;
    return this;
  }
}
class Sheet {
  constructor(name, cells = []) {
    Object.assign(this, {
      name,
      cells: cells.map((row) => [...row]),
      writes: 0,
      formats: [],
      validations: [],
      hiddenColumns: [],
      frozenRows: 0,
      filter: false,
    });
  }
  getName() {
    return this.name;
  }
  getLastRow() {
    let n = this.cells.length;
    while (n && !this.cells[n - 1].some((v) => v !== "" && v != null)) n--;
    return n;
  }
  getLastColumn() {
    return Math.max(1, ...this.cells.map((row) => row.length));
  }
  getMaxRows() {
    return 1000;
  }
  getRange(row, column, rows, columns) {
    if (row === "B2") return new Range(this, 2, 2);
    assert.equal(typeof row, "number", `Unexpected A1 range: ${row}`);
    return new Range(this, row, column, rows, columns);
  }
  getDataRange() {
    return new Range(this, 1, 1, Math.max(1, this.getLastRow()), this.getLastColumn());
  }
  appendRow(values) {
    this.getRange(this.getLastRow() + 1, 1, 1, values.length).setValues([values]);
    return this;
  }
  setFrozenRows(n) {
    this.frozenRows = n;
    return this;
  }
  setColumnWidth() {
    return this;
  }
  setColumnWidths() {
    return this;
  }
  autoResizeColumns() {
    return this;
  }
  hideColumns(n) {
    this.hiddenColumns.push(n);
    return this;
  }
  hideSheet() {
    this.hidden = true;
    return this;
  }
  getFilter() {
    return this.filter || null;
  }
}
function harness() {
  const sheets = new Map([
    ["TEST — Helper", new Sheet("TEST — Helper", [[], ["", MARKER]])],
    ["_TEST_Seasons", new Sheet("_TEST_Seasons", [["id", "name", "status", "sheetName"]])],
    ["_TEST_Ligas", new Sheet("_TEST_Ligas", [["seasonId", "name", "teams"]])],
  ]);
  const lock = {
    acquired: 0,
    released: 0,
    held: false,
    fail: false,
    waitLock() {
      if (this.fail) throw new Error("Lock timeout");
      this.acquired++;
      this.held = true;
    },
    releaseLock() {
      assert.equal(this.held, true);
      this.held = false;
      this.released++;
    },
  };
  const ui = {
    menus: [],
    sidebars: [],
    createMenu(name) {
      const menu = {
        name,
        items: [],
        addItem(label, fn) {
          this.items.push([label, fn]);
          return this;
        },
        addToUi() {
          ui.menus.push(this);
        },
      };
      return menu;
    },
    showSidebar(html) {
      this.sidebars.push(html);
    },
  };
  const ss = {
    id: "test-sheet",
    active: null,
    getId() {
      return this.id;
    },
    getUrl() {
      return "https://docs.google.com/spreadsheets/d/test-sheet/edit";
    },
    getSheetByName(name) {
      return sheets.get(name) || null;
    },
    insertSheet(name) {
      assert.equal(lock.held, true, "writes require document lock");
      assert.equal(sheets.has(name), false);
      const sheet = new Sheet(name);
      sheets.set(name, sheet);
      return sheet;
    },
    setActiveSheet(sheet) {
      this.active = sheet.name;
    },
  };
  let uuid = 0;
  const context = vm.createContext({
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      getUi: () => ui,
      newDataValidation: () => ({
        requireValueInList() {
          return this;
        },
        setAllowInvalid() {
          return this;
        },
        build() {
          return { rule: true };
        },
      }),
    },
    LockService: { getDocumentLock: () => lock },
    Utilities: { getUuid: () => `00000000-0000-4000-8000-${String(++uuid).padStart(12, "0")}` },
    HtmlService: {
      createHtmlOutputFromFile: (file) => ({
        file,
        setTitle(title) {
          this.title = title;
          return this;
        },
        setWidth(width) {
          this.width = width;
          return this;
        },
      }),
    },
  });
  vm.runInContext(
    `const HELPER_SPREADSHEET_ID = 'test-sheet'; const HELPER_MARKER = '${MARKER}';\n${existsSync(codePath) ? readFileSync(codePath, "utf8") : ""}`,
    context,
    { filename: "Code.gs" },
  );
  const api = (name, ...args) => {
    assert.equal(typeof context[name], "function", `${name} API must exist`);
    const result = context[name](...args);
    return result === undefined ? result : JSON.parse(JSON.stringify(result));
  };
  return { api, sheets, ss, lock, ui, context };
}
function seedSeason(
  h,
  {
    id = "TEST-1",
    name = "Test season",
    status = "Draft",
    teams = ["Owls", "Foxes"],
    liga = "Premier",
    rows = [],
  } = {},
) {
  h.sheets.get("_TEST_Seasons").appendRow([id, name, status, `TEST_${id}`]);
  if (teams) h.sheets.get("_TEST_Ligas").appendRow([id, liga, JSON.stringify(teams)]);
  const sheet = new Sheet(`TEST_${id}`, [HEADERS, ...rows]);
  h.sheets.set(sheet.name, sheet);
  return sheet;
}
function fixture(overrides = {}) {
  return {
    seasonId: "TEST-1",
    date: "2026-09-15",
    time: "19:30",
    liga: "Premier",
    stage: "League",
    home: "Owls",
    away: "Foxes",
    venue: "Ice hall",
    notes: "",
    ...overrides,
  };
}
function fixtureRow(overrides = {}) {
  const f = {
    ...fixture(),
    status: "Scheduled",
    homeScore: "",
    awayScore: "",
    matchId: "00000000-0000-4000-8000-000000000099",
    homeShootout: "",
    awayShootout: "",
    ...overrides,
  };
  return [
    f.date,
    f.time,
    f.liga,
    f.stage,
    f.home,
    f.away,
    f.homeScore,
    f.awayScore,
    f.status,
    f.venue,
    f.notes,
    f.matchId,
    f.homeShootout,
    f.awayShootout,
  ];
}

test("existing CURRENT refresh handler ignores helper TEST tab edits", () => {
  let pendingWrites = 0;
  const context = vm.createContext({
    PropertiesService: {
      getScriptProperties: () => ({
        setProperty: () => {
          pendingWrites++;
        },
      }),
    },
  });
  const trigger = readFileSync(new URL("../sheet-refresh-trigger.gs", import.meta.url), "utf8");
  vm.runInContext(
    trigger + "\n" + readFileSync(new URL("./Code.gs", import.meta.url), "utf8"),
    context,
  );
  for (const title of ["TEST — Helper", "_TEST_Seasons", "_TEST_Ligas", "TEST_NEXT-27"]) {
    context.onSheetEdit({ range: { getSheet: () => ({ getName: () => title }) } });
  }
  assert.equal(pendingWrites, 0);
  context.onSheetEdit({ range: { getSheet: () => ({ getName: () => "CURRENT" }) } });
  assert.equal(pendingWrites, 1);
});

test("activateSeason validates under lock and changes only local season statuses", () => {
  const h = harness();
  const source = seedSeason(h, {
    status: "Current",
    rows: [fixtureRow({ status: "Played", homeScore: 1, awayScore: 0 })],
  });
  h.api("createSeason", { id: "NEXT-27", name: "Next", copyFrom: "TEST-1" });
  const beforeInvalid = JSON.stringify(h.sheets.get("_TEST_Seasons").cells);
  assert.throws(() => h.api("activateSeason", "NEXT-27"), /fixture/i);
  assert.equal(JSON.stringify(h.sheets.get("_TEST_Seasons").cells), beforeInvalid);
  h.api("addFixture", fixture({ seasonId: "NEXT-27" }));
  h.api("createSeason", { id: "FUTURE-28", name: "Future" });
  const beforeFixtures = JSON.stringify([source.cells, h.sheets.get("TEST_NEXT-27").cells]);
  const beforeLigas = JSON.stringify(h.sheets.get("_TEST_Ligas").cells);
  const state = h.api("activateSeason", "NEXT-27");
  assert.equal(state.currentSeasonId, "NEXT-27");
  assert.deepEqual(
    state.seasons.map((s) => s.status),
    ["Archived", "Current", "Draft"],
  );
  assert.equal(JSON.stringify([source.cells, h.sheets.get("TEST_NEXT-27").cells]), beforeFixtures);
  assert.equal(JSON.stringify(h.sheets.get("_TEST_Ligas").cells), beforeLigas);
  assert.deepEqual(h.api("activateSeason", "NEXT-27"), state, "activation is idempotent");
  h.sheets.get("TEST_NEXT-27").getRange(2, 7).setValue(2);
  assert.throws(
    () => h.api("activateSeason", "NEXT-27"),
    /score/i,
    "even a Current season is revalidated",
  );
  assert.equal(h.lock.acquired, h.lock.released);
});

test("openSeasonSheet selects only the registered sandbox tab", () => {
  const h = harness();
  seedSeason(h);
  assert.deepEqual(h.api("openSeasonSheet", "TEST-1"), { ok: true });
  assert.equal(h.ss.active, "TEST_TEST-1");
  assert.throws(() => h.api("openSeasonSheet", "TEST — Helper"), /season/i);
  assert.equal(h.ss.active, "TEST_TEST-1");
  assert.equal(h.lock.acquired, h.lock.released);
});

test("corrupt metadata and headers fail validation and cannot become trusted write targets", () => {
  const corruptions = [
    (h) => h.sheets.get("_TEST_Ligas").getRange(2, 3).setValue("not JSON"),
    (h) => h.sheets.get("_TEST_Ligas").getRange(2, 3).setValue("[]"),
    (h) => h.sheets.get("_TEST_Ligas").getRange(2, 3).setValue('["Owls","owls"]'),
    (h) => h.sheets.get("_TEST_Ligas").getRange(2, 3).setValue('["Owls","=BAD"]'),
    (h) => h.sheets.get("_TEST_Ligas").appendRow(["TEST-1", " premier ", '["Owls","Foxes"]']),
    (h) => h.sheets.get("_TEST_Ligas").appendRow(["UNKNOWN", "Other", '["Owls","Foxes"]']),
    (h) => h.sheets.get("_TEST_Seasons").appendRow(["TEST-1", "Duplicate", "Draft", "TEST_TEST-1"]),
    (h) => h.sheets.get("_TEST_Seasons").getRange(2, 2).setValue("=BAD"),
    (h) => h.sheets.get("_TEST_Seasons").getRange(2, 3).setValue("Published"),
    (h) => h.sheets.get("_TEST_Seasons").getRange(2, 4).setValue("TEST — Helper"),
    (h) => h.sheets.get("_TEST_Seasons").getRange(1, 1).setValue("changed"),
    (h) => h.sheets.get("_TEST_Ligas").getRange(1, 3).setValue("changed"),
    (h) => h.sheets.get("TEST_TEST-1").getRange(1, 7).setValue("wrong score column"),
    (h) => h.sheets.delete("TEST_TEST-1"),
  ];
  for (const corrupt of corruptions) {
    const h = harness();
    seedSeason(h, { rows: [fixtureRow()] });
    corrupt(h);
    const before = JSON.stringify([...h.sheets].map(([name, sheet]) => [name, sheet.cells]));
    const result = h.api("validateSeason", "TEST-1");
    assert.equal(result.valid, false, corrupt.toString());
    assert.ok(result.errors.length);
    assert.throws(
      () => h.api("createSeason", { id: "NEXT-27", name: "New", copyFrom: "TEST-1" }),
      corrupt.toString(),
    );
    assert.equal(JSON.stringify([...h.sheets].map(([name, sheet]) => [name, sheet.cells])), before);
    assert.equal(h.lock.acquired, h.lock.released);
  }
});

test("a liga without fixtures blocks validation even if another liga has fixtures", () => {
  const h = harness();
  seedSeason(h, { rows: [fixtureRow()] });
  h.sheets.get("_TEST_Ligas").appendRow(["TEST-1", "Second", '["Bears","Lynx"]']);
  const result = h.api("validateSeason", "TEST-1");
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => /Second.*fixture/i.test(e)));
});

test("validation catches duplicate IDs and active fixtures but retains cancelled/postponed records", () => {
  for (const second of [
    fixtureRow({ date: "2026-09-16" }),
    fixtureRow({ matchId: "other-id", home: "Foxes", away: "Owls" }),
    fixtureRow({ matchId: "other-id", status: "Played", homeScore: 1, awayScore: 0 }),
  ]) {
    const h = harness();
    seedSeason(h, { rows: [fixtureRow(), second] });
    const result = h.api("validateSeason", "TEST-1");
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((e) => /Row 3:.*duplicate/i.test(e)),
      JSON.stringify(result.errors),
    );
  }
  const h = harness();
  const sheet = seedSeason(h, {
    rows: [
      fixtureRow({ status: "Cancelled" }),
      fixtureRow({ matchId: "postponed-id", status: "Postponed" }),
    ],
  });
  h.api("addFixture", fixture());
  assert.equal(h.api("validateSeason", "TEST-1").valid, true);
  assert.equal(sheet.getLastRow(), 4);
});

test("validateSeason enforces result/status consistency and decisive knockout shootouts", () => {
  const invalid = [
    { status: "Played" },
    { status: "Played", homeScore: 1 },
    { homeScore: 0, awayScore: 0 },
    ...["Postponed", "Cancelled"].map((status) => ({ status, homeScore: 1, awayScore: 0 })),
    ...[-1, 1.5, "2", true, Infinity, NaN].map((homeScore) => ({
      status: "Played",
      homeScore,
      awayScore: 0,
    })),
    { status: "Played", homeScore: 2, awayScore: 2, stage: "Final" },
    ...["Quarter-final", "Semi-final", "Placement"].map((stage) => ({
      status: "Played",
      homeScore: 0,
      awayScore: 0,
      stage,
    })),
    { status: "Played", homeScore: 2, awayScore: 2, stage: "Final", homeShootout: 3 },
    {
      status: "Played",
      homeScore: 2,
      awayScore: 2,
      stage: "Final",
      homeShootout: 3,
      awayShootout: 3,
    },
    { status: "Played", homeScore: 2, awayScore: 1, homeShootout: 3, awayShootout: 1 },
    ...[-1, 1.5, "2", true].map((homeShootout) => ({
      status: "Played",
      homeScore: 2,
      awayScore: 2,
      stage: "Final",
      homeShootout,
      awayShootout: 0,
    })),
    { homeShootout: 3, awayShootout: 1 },
  ];
  for (const changes of invalid) {
    const h = harness();
    seedSeason(h, { rows: [fixtureRow(changes)] });
    const result = h.api("validateSeason", "TEST-1");
    assert.equal(result.valid, false, JSON.stringify(changes));
    assert.ok(
      result.errors.some((e) => /score|shootout|draw/i.test(e)),
      JSON.stringify(result),
    );
  }
  for (const changes of [
    {},
    { status: "Played", homeScore: 0, awayScore: 0 },
    { status: "Played", homeScore: 2, awayScore: 1, stage: "Final" },
    {
      status: "Played",
      homeScore: 2,
      awayScore: 2,
      stage: "Final",
      homeShootout: 3,
      awayShootout: 0,
    },
    {
      status: "Played",
      homeScore: 2,
      awayScore: 2,
      stage: "League",
      homeShootout: 0,
      awayShootout: 1,
    },
    { status: "Postponed" },
    { status: "Cancelled" },
  ]) {
    const h = harness();
    const sheet = seedSeason(h, { rows: [fixtureRow(changes)] });
    const before = JSON.stringify(sheet.cells);
    const result = h.api("validateSeason", "TEST-1");
    assert.equal(result.valid, true, JSON.stringify(result));
    assert.equal(
      JSON.stringify(sheet.cells),
      before,
      "validation is read-only, including cancelled/postponed rows",
    );
    if (["Postponed", "Cancelled"].includes(changes.status))
      assert.ok(result.warnings.some((e) => /retained/i.test(e)));
  }
});

test("validateSeason reports direct sheet-edit errors with physical row numbers", () => {
  const cases = [
    [{ matchId: "" }, /Match ID/i],
    [{ date: "2026-02-29" }, /date/i],
    [{ date: new Date("2026-01-01") }, /date/i],
    [{ time: "24:00" }, /time/i],
    [{ liga: "Other" }, /liga/i],
    [{ home: "Other" }, /team/i],
    [{ home: "Foxes" }, /self|itself/i],
    [{ stage: "Cup" }, /stage/i],
    [{ status: "Done" }, /status/i],
    [{ notes: "=EVIL()" }, /formula|unsafe/i],
    [{ venue: "+EVIL" }, /unsafe/i],
  ];
  for (const [changes, error] of cases) {
    const h = harness();
    seedSeason(h, { rows: [Array(14).fill(""), fixtureRow(changes)] });
    const result = h.api("validateSeason", "TEST-1");
    assert.equal(result.valid, false, JSON.stringify(changes));
    assert.equal(result.fixtureCount, 1);
    assert.ok(
      result.errors.some((e) => /Row 3:/.test(e) && error.test(e)),
      JSON.stringify(result.errors),
    );
  }
  const h = harness();
  seedSeason(h, { rows: [fixtureRow()] });
  assert.deepEqual(h.api("validateSeason", "TEST-1"), {
    valid: true,
    errors: [],
    warnings: [],
    fixtureCount: 1,
  });
});

test("validateSeason blocks empty seasons and ligas instead of inventing fixtures", () => {
  const h = harness();
  seedSeason(h, { teams: null });
  let result = h.api("validateSeason", "TEST-1");
  assert.equal(result.valid, false);
  assert.equal(result.fixtureCount, 0);
  assert.ok(result.errors.some((e) => /liga/i.test(e)));
  assert.ok(result.errors.some((e) => /fixture/i.test(e)));
  h.sheets.get("_TEST_Ligas").appendRow(["TEST-1", "Premier", JSON.stringify(["Owls", "Foxes"])]);
  result = h.api("validateSeason", "TEST-1");
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => /fixture/i.test(e)));
});

test("addFixture persists validated text, blank scores and a stable UUID", () => {
  const h = harness();
  const sheet = seedSeason(h);
  const state = h.api(
    "addFixture",
    fixture({ stage: undefined, venue: " Ice hall ", notes: " Friendly game " }),
  );
  const row = sheet.cells[1];
  assert.deepEqual(row.slice(0, 11), [
    "2026-09-15",
    "19:30",
    "Premier",
    "League",
    "Owls",
    "Foxes",
    "",
    "",
    "Scheduled",
    "Ice hall",
    "Friendly game",
  ]);
  assert.match(row[11], /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.deepEqual(row.slice(12), ["", ""]);
  assert.ok(
    sheet.formats.some((f) => f.row === 2 && f.column === 1 && f.columns >= 2 && f.value === "@"),
    "ISO date/time stored as text",
  );
  assert.ok(
    sheet.formats.some((f) => f.row === 2 && f.column === 7 && f.columns === 2 && f.value === "0"),
  );
  assert.ok(
    sheet.formats.some((f) => f.row === 2 && f.column === 13 && f.columns === 2 && f.value === "0"),
  );
  assert.equal(state.seasons[0].fixturesCount, 1);
  assert.equal(state.seasons[0].playedCount, 0);
  const id = row[11];
  h.api("addFixture", fixture({ date: "2028-02-29" }));
  assert.equal(sheet.cells[1][11], id);
  assert.notEqual(sheet.cells[2][11], id);
  assert.equal(h.lock.acquired, h.lock.released);
});

test("addFixture rejects unsafe or ambiguous inputs before any row is written", () => {
  const h = harness();
  const sheet = seedSeason(h);
  h.api("addFixture", fixture());
  const invalid = [
    { date: "2026-02-29" },
    { date: "2026-04-31" },
    { date: "2026-9-1" },
    { date: "0000-01-01" },
    { date: new Date() },
    { time: "24:00" },
    { time: "12:60" },
    { time: "9:00" },
    { time: 0.5 },
    { liga: "Unknown" },
    { home: "Unknown" },
    { away: "OWLS" },
    { home: "owls" },
    { stage: "Cup" },
    { seasonId: "MISSING" },
    { status: "Played", homeScore: 3, awayScore: 2 },
    { homeScore: 0 },
    { homeShootout: 1 },
    ...["=BAD()", "+BAD", "-BAD", "@BAD", "\u0001=BAD"].flatMap((value) =>
      ["home", "liga", "venue", "notes"].map((field) => ({ [field]: value })),
    ),
    { venue: "X".repeat(121) },
    { notes: "X".repeat(1001) },
  ];
  for (const changes of invalid)
    assert.throws(
      () => h.api("addFixture", fixture({ date: "2026-10-01", ...changes })),
      `reject ${JSON.stringify(changes)}`,
    );
  assert.throws(() => h.api("addFixture", fixture()), /duplicate/i);
  assert.throws(() => h.api("addFixture", fixture({ home: "Foxes", away: "Owls" })), /duplicate/i);
  assert.equal(sheet.getLastRow(), 2);
  assert.equal(h.lock.acquired, h.lock.released);
});

test("copying a season copies only ligas and teams, never fixtures or scores", () => {
  const h = harness();
  const source = seedSeason(h, {
    status: "Current",
    rows: [
      fixtureRow({
        status: "Played",
        homeScore: 3,
        awayScore: 2,
        homeShootout: "",
        awayShootout: "",
      }),
    ],
  });
  const before = JSON.stringify(source.cells);
  const state = h.api("createSeason", { id: "NEXT-27", name: "Next season", copyFrom: "TEST-1" });
  assert.equal(state.currentSeasonId, "TEST-1");
  assert.deepEqual(state.seasons[1], {
    id: "NEXT-27",
    name: "Next season",
    status: "Draft",
    sheetName: "TEST_NEXT-27",
    ligas: [{ name: "Premier", teams: ["Owls", "Foxes"] }],
    fixturesCount: 0,
    playedCount: 0,
  });
  assert.deepEqual(h.sheets.get("TEST_NEXT-27").cells, [HEADERS]);
  assert.equal(JSON.stringify(source.cells), before);
  h.api("saveLiga", { seasonId: "NEXT-27", name: "Premier", teams: ["Owls", "Foxes", "Bears"] });
  assert.deepEqual(h.api("getHelperState").seasons[0].ligas[0].teams, ["Owls", "Foxes"]);
});

test("saveLiga upserts case-insensitively and preserves referenced team names", () => {
  const h = harness();
  const sheet = seedSeason(h, { teams: null });
  let state = h.api("saveLiga", {
    seasonId: "TEST-1",
    name: " Premier ",
    teams: [" Owls ", "Foxes"],
  });
  assert.deepEqual(state.seasons[0].ligas, [{ name: "Premier", teams: ["Owls", "Foxes"] }]);
  state = h.api("saveLiga", {
    seasonId: "TEST-1",
    name: " premier ",
    teams: ["Owls", "Foxes", "Bears"],
  });
  assert.deepEqual(state.seasons[0].ligas, [
    { name: "Premier", teams: ["Owls", "Foxes", "Bears"] },
  ]);
  assert.equal(h.sheets.get("_TEST_Ligas").getLastRow(), 2);
  sheet.appendRow(fixtureRow());
  for (const teams of [
    [],
    ["Owls"],
    Array.from({ length: 33 }, (_, i) => `T${i}`),
    ["Owls", " owls "],
    ["Owls", ""],
    ["Owls", "=EVIL()"],
    ["Owls", "+EVIL"],
    ["Owls", "-EVIL"],
    ["Owls", "@EVIL"],
    ["Owls", "A".repeat(81)],
    ["Foxes", "Bears"],
    ["OWLS", "Foxes"],
    "not an array",
  ]) {
    assert.throws(
      () => h.api("saveLiga", { seasonId: "TEST-1", name: "Premier", teams }),
      `reject ${JSON.stringify(teams)}`,
    );
  }
  for (const name of ["=BAD", "+BAD", "-BAD", "@BAD", "", "A".repeat(81)])
    assert.throws(() => h.api("saveLiga", { seasonId: "TEST-1", name, teams: ["Owls", "Foxes"] }));
  assert.throws(
    () => h.api("saveLiga", { seasonId: "MISSING", name: "Premier", teams: ["Owls", "Foxes"] }),
    /season/i,
  );
  assert.equal(h.lock.acquired, h.lock.released);
  assert.deepEqual(h.api("getHelperState").seasons[0].ligas[0].teams, ["Owls", "Foxes", "Bears"]);
});

test("createSeason persists an empty Draft tab with safe labels and locking", () => {
  const h = harness();
  const state = h.api("createSeason", { id: " fall-26 ", name: " Fall 2026 " });
  assert.deepEqual(state.seasons[0], {
    id: "FALL-26",
    name: "Fall 2026",
    status: "Draft",
    sheetName: "TEST_FALL-26",
    ligas: [],
    fixturesCount: 0,
    playedCount: 0,
  });
  const sheet = h.sheets.get("TEST_FALL-26");
  assert.deepEqual(sheet.cells[0], HEADERS);
  assert.equal(sheet.frozenRows, 1);
  assert.equal(sheet.filter, true);
  assert.ok(sheet.hiddenColumns.includes(12));
  assert.equal(h.lock.acquired, 1);
  assert.equal(h.lock.released, 1);
  for (const payload of [
    { id: "FALL-26", name: "Duplicate" },
    { id: "A", name: "Short" },
    { id: "A".repeat(21), name: "Long" },
    { id: "BAD_ID", name: "Bad" },
    ...["", "=IMPORTXML()", "+bad", "-bad", "@bad", "N".repeat(101)].map((name) => ({
      id: "NEW-26",
      name,
    })),
    { id: "NEW-26", name: "New", copyFrom: "MISSING" },
  ])
    assert.throws(() => h.api("createSeason", payload));
  assert.equal(h.sheets.size, 4, "rejections must not create orphan tabs");
  assert.equal(h.lock.acquired, h.lock.released);
  h.lock.fail = true;
  assert.throws(() => h.api("createSeason", { id: "NEW-26", name: "Timeout" }), /timeout/i);
  assert.equal(h.sheets.size, 4);
  h.lock.fail = false;
  h.ss.id = "live";
  assert.throws(() => h.api("createSeason", { id: "NEW-26", name: "Unsafe" }), /sandbox/i);
});

test("menu and sidebar are available only in the marked sandbox", () => {
  const h = harness();
  h.api("onOpen");
  assert.equal(h.ui.menus[0].name, "Liga helper");
  assert.deepEqual(h.ui.menus[0].items, [["Open helper", "showHelper"]]);
  h.api("showHelper");
  assert.equal(h.ui.sidebars[0].file, "Sidebar");
  assert.equal(h.ui.sidebars[0].width, 300);
  h.ss.id = "production";
  for (const fn of ["onOpen", "showHelper"]) assert.throws(() => h.api(fn), /sandbox/i);
  assert.equal(h.ui.menus.length, 1);
  assert.equal(h.ui.sidebars.length, 1);
});

test("getHelperState reads the sandbox and actual season counts", () => {
  const h = harness();
  assert.deepEqual(h.api("getHelperState"), {
    sandbox: true,
    spreadsheetUrl: h.ss.getUrl(),
    currentSeasonId: null,
    seasons: [],
  });
  seedSeason(h, {
    status: "Current",
    rows: [
      fixtureRow(),
      fixtureRow({ status: "Played", homeScore: 2, awayScore: 1, date: "2026-09-16" }),
    ],
  });
  assert.deepEqual(h.api("getHelperState").seasons, [
    {
      id: "TEST-1",
      name: "Test season",
      status: "Current",
      sheetName: "TEST_TEST-1",
      ligas: [{ name: "Premier", teams: ["Owls", "Foxes"] }],
      fixturesCount: 2,
      playedCount: 1,
    },
  ]);
  assert.equal(h.api("getHelperState").currentSeasonId, "TEST-1");
  for (const mutation of [
    () => {
      h.ss.id = "live-sheet";
    },
    () => {
      h.ss.id = "test-sheet";
      h.sheets.get("TEST — Helper").getRange("B2").setValue("WRONG");
    },
  ]) {
    mutation();
    assert.throws(() => h.api("getHelperState"), /sandbox/i);
  }
});
