/** Bound, sandbox-only helper. Sandbox.gs supplies the exact test ID and marker.
 * No publishing, network requests, triggers, or production-sheet access.
 * Private functions end in _ so google.script.run cannot invoke them.
 */
const FIXTURE_HEADERS_ = [
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

function sandbox_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (
    typeof HELPER_SPREADSHEET_ID !== "string" ||
    !HELPER_SPREADSHEET_ID ||
    typeof HELPER_MARKER !== "string" ||
    HELPER_MARKER !== "HOCKEY_LIGA_HELPER_SANDBOX_V1" ||
    !ss ||
    ss.getId() !== HELPER_SPREADSHEET_ID
  ) {
    throw new Error("Sandbox only: this spreadsheet is not the configured test spreadsheet.");
  }
  const start = ss.getSheetByName("TEST — Helper");
  if (
    !start ||
    start.getRange("B2").getValue() !== HELPER_MARKER ||
    start.getRange("B2").getFormulas()[0][0]
  ) {
    throw new Error("Sandbox only: 'TEST — Helper'!B2 marker is missing or invalid.");
  }
  return ss;
}

function rows_(sheet, width) {
  if (!sheet) throw new Error("Required helper sheet is missing.");
  if (sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, width)
    .getValues()
    .filter(function (row) {
      return row.some(function (v) {
        return v !== "" && v !== null;
      });
    });
}

function table_(ss, name, headers) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error("Required sheet " + name + " is missing.");
  const header = sheet.getRange(1, 1, 1, headers.length);
  if (
    JSON.stringify(header.getValues()[0]) !== JSON.stringify(headers) ||
    header.getFormulas()[0].some(Boolean)
  ) {
    throw new Error(name + ": headers do not match the helper schema.");
  }
  if (
    name.charAt(0) === "_" &&
    sheet
      .getDataRange()
      .getFormulas()
      .some(function (row) {
        return row.some(Boolean);
      })
  ) {
    throw new Error(name + ": formulas are forbidden in metadata.");
  }
  return sheet;
}

function state_(ss) {
  const seasonRows = rows_(table_(ss, "_TEST_Seasons", ["id", "name", "status", "sheetName"]), 4);
  const ligaRows = rows_(table_(ss, "_TEST_Ligas", ["seasonId", "name", "teams"]), 3);
  const ids = new Set(),
    ligaKeys = new Set();
  seasonRows.forEach(function (row) {
    if (row[0] !== seasonId_(row[0]) || ids.has(row[0]))
      throw new Error("Invalid or duplicate season ID in metadata.");
    ids.add(row[0]);
    label_(row[1], "Season name", 100);
    if (!["Draft", "Current", "Archived"].includes(row[2]))
      throw new Error("Invalid season status.");
    if (row[3] !== "TEST_" + row[0]) throw new Error("Invalid season sheet mapping.");
  });
  const ligas = ligaRows.map(function (row) {
    if (!ids.has(row[0])) throw new Error("Liga references an unknown season.");
    const name = label_(row[1], "Liga name", 80);
    const ligaKey = JSON.stringify([row[0], key_(name)]);
    if (ligaKeys.has(ligaKey)) throw new Error("Duplicate liga name in metadata.");
    ligaKeys.add(ligaKey);
    let parsed;
    try {
      parsed = JSON.parse(row[2]);
    } catch (_) {
      throw new Error("Liga " + name + ": teams must be a JSON array.");
    }
    return { seasonId: row[0], name: name, teams: teams_(parsed) };
  });
  const seasons = seasonRows.map(function (row) {
    const fixtures = rows_(table_(ss, row[3], FIXTURE_HEADERS_), FIXTURE_HEADERS_.length);
    return {
      id: row[0],
      name: row[1],
      status: row[2],
      sheetName: row[3],
      ligas: ligas
        .filter(function (liga) {
          return liga.seasonId === row[0];
        })
        .map(function (liga) {
          return { name: liga.name, teams: liga.teams };
        }),
      fixturesCount: fixtures.length,
      playedCount: fixtures.filter(function (fixture) {
        return fixture[8] === "Played";
      }).length,
    };
  });
  const current = seasons.filter(function (season) {
    return season.status === "Current";
  });
  return {
    sandbox: true,
    spreadsheetUrl: ss.getUrl(),
    currentSeasonId: current.length ? current[0].id : null,
    seasons: seasons,
  };
}

function withLock_(work) {
  sandbox_();
  const lock = LockService.getDocumentLock();
  if (!lock) throw new Error("A bound spreadsheet document lock is required.");
  lock.waitLock(10000);
  try {
    return work(sandbox_());
  } finally {
    lock.releaseLock();
  }
}

function label_(value, field, max, optional) {
  if (value == null && optional) return "";
  if (typeof value !== "string") throw new Error(field + " must be text.");
  const text = value.trim();
  if (
    (!optional && !text) ||
    text.length > max ||
    /^[=+\-@]/.test(text) ||
    /[\u0000-\u001f\u007f]/.test(text)
  ) {
    throw new Error(
      field + " is empty, too long, or contains unsafe text (formula prefixes are forbidden).",
    );
  }
  return text;
}

function seasonId_(value) {
  const id = label_(value, "Season ID", 20).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{1,19}$/.test(id))
    throw new Error("Season ID must be 2–20 letters, digits or hyphens.");
  return id;
}

function season_(ss, id) {
  const season = state_(ss).seasons.filter(function (item) {
    return item.id === seasonId_(id);
  })[0];
  if (!season) throw new Error("Unknown season.");
  if (season.sheetName !== "TEST_" + season.id) throw new Error("Invalid season sheet mapping.");
  return season;
}

function key_(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function teams_(values) {
  if (!Array.isArray(values) || values.length < 2 || values.length > 32)
    throw new Error("A liga needs 2–32 teams.");
  const teams = values.map(function (value) {
    return label_(value, "Team name", 80);
  });
  if (new Set(teams.map(key_)).size !== teams.length)
    throw new Error("Duplicate team names are not allowed.");
  return teams;
}

function saveLiga(input) {
  return withLock_(function (ss) {
    const season = season_(ss, input.seasonId);
    const name = label_(input.name, "Liga name", 80);
    const teams = teams_(input.teams);
    const existing = season.ligas.filter(function (liga) {
      return key_(liga.name) === key_(name);
    })[0];
    const savedName = existing ? existing.name : name;
    rows_(ss.getSheetByName(season.sheetName), FIXTURE_HEADERS_.length).forEach(function (row) {
      if (
        key_(row[2]) === key_(savedName) &&
        (!teams.includes(row[4]) || !teams.includes(row[5]))
      ) {
        throw new Error("Cannot remove or rename a team referenced by fixtures.");
      }
    });
    const sheet = ss.getSheetByName("_TEST_Ligas");
    // Keep physical row indices, including gaps from direct edits.
    const data =
      sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
    const index = data.findIndex(function (row) {
      return row[0] === season.id && key_(row[1]) === key_(savedName);
    });
    sheet
      .getRange(index < 0 ? sheet.getLastRow() + 1 : index + 2, 1, 1, 3)
      .setNumberFormat("@")
      .setValues([[season.id, savedName, JSON.stringify(teams)]]);
    return state_(ss);
  });
}

function createSeason(input) {
  return withLock_(function (ss) {
    const id = seasonId_(input.id);
    const name = label_(input.name, "Season name", 100);
    if (
      state_(ss).seasons.some(function (season) {
        return season.id === id;
      }) ||
      ss.getSheetByName("TEST_" + id)
    ) {
      throw new Error("Season ID or tab already exists.");
    }
    const copiedLigas = input.copyFrom
      ? season_(ss, input.copyFrom).ligas.map(function (liga) {
          return [id, label_(liga.name, "Liga name", 80), JSON.stringify(teams_(liga.teams))];
        })
      : [];
    const sheet = ss.insertSheet("TEST_" + id);
    sheet
      .getRange(1, 1, 1, FIXTURE_HEADERS_.length)
      .setValues([FIXTURE_HEADERS_])
      .setFontWeight("bold")
      .setBackground("#e8eef8");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, FIXTURE_HEADERS_.length, 120);
    sheet.setColumnWidth(11, 240);
    sheet.hideColumns(12);
    sheet.getRange(1, 1, sheet.getMaxRows(), FIXTURE_HEADERS_.length).createFilter();
    ss.getSheetByName("_TEST_Seasons")
      .getRange(ss.getSheetByName("_TEST_Seasons").getLastRow() + 1, 1, 1, 4)
      .setNumberFormat("@")
      .setValues([[id, name, "Draft", sheet.getName()]]);
    if (copiedLigas.length) {
      const ligas = ss.getSheetByName("_TEST_Ligas");
      ligas
        .getRange(ligas.getLastRow() + 1, 1, copiedLigas.length, 3)
        .setNumberFormat("@")
        .setValues(copiedLigas);
    }
    return state_(ss);
  });
}

const STAGES_ = ["League", "Quarter-final", "Semi-final", "Final", "Placement"];
const STATUSES_ = ["Scheduled", "Played", "Postponed", "Cancelled"];

function date_(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Date must be text YYYY-MM-DD.");
  const parts = value.split("-").map(Number);
  const y = parts[0],
    m = parts[1],
    d = parts[2];
  const days = [
    31,
    y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > days[m - 1])
    throw new Error("Date is not a real calendar date.");
  return value;
}

function time_(value) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
    throw new Error("Time must be text HH:mm (00:00–23:59).");
  return value;
}

function fixtureKey_(row) {
  return JSON.stringify([row[0], row[1], key_(row[2]), [key_(row[4]), key_(row[5])].sort()]);
}

function fixtureFields_(row, season) {
  date_(row[0]);
  time_(row[1]);
  const ligaName = label_(row[2], "Liga name", 80);
  const liga = season.ligas.filter(function (item) {
    return item.name === ligaName;
  })[0];
  if (!liga) throw new Error("Unknown liga.");
  if (!STAGES_.includes(row[3])) throw new Error("Invalid stage.");
  const home = label_(row[4], "Home team", 80);
  const away = label_(row[5], "Away team", 80);
  if (key_(home) === key_(away)) throw new Error("A team cannot play itself (self-match).");
  if (!liga.teams.includes(home) || !liga.teams.includes(away))
    throw new Error("Unknown team in this liga (names are case-sensitive).");
  label_(row[9], "Venue", 120, true);
  label_(row[10], "Notes", 1000, true);
}

function addFixture(input) {
  return withLock_(function (ss) {
    const season = season_(ss, input.seasonId);
    const fields = ["seasonId", "date", "time", "liga", "stage", "home", "away", "venue", "notes"];
    if (
      Object.keys(input).some(function (field) {
        return !fields.includes(field);
      })
    )
      throw new Error(
        "Only scheduling fields are accepted; scores and status must be edited explicitly in the sheet.",
      );
    const row = [
      date_(input.date),
      time_(input.time),
      label_(input.liga, "Liga name", 80),
      input.stage || "League",
      label_(input.home, "Home team", 80),
      label_(input.away, "Away team", 80),
      "",
      "",
      "Scheduled",
      label_(input.venue, "Venue", 120, true),
      label_(input.notes, "Notes", 1000, true),
      "",
      "",
      "",
    ];
    fixtureFields_(row, season);
    const sheet = ss.getSheetByName(season.sheetName);
    if (
      rows_(sheet, FIXTURE_HEADERS_.length).some(function (other) {
        return (
          ["Scheduled", "Played"].includes(other[8]) && fixtureKey_(other) === fixtureKey_(row)
        );
      })
    )
      throw new Error("Duplicate fixture at this date/time, liga and pair of teams.");
    row[11] = Utilities.getUuid();
    const next = sheet.getLastRow() + 1;
    sheet.getRange(next, 1, 1, FIXTURE_HEADERS_.length).setNumberFormat("@");
    sheet.getRange(next, 7, 1, 2).setNumberFormat("0");
    sheet.getRange(next, 13, 1, 2).setNumberFormat("0");
    sheet.getRange(next, 1, 1, FIXTURE_HEADERS_.length).setValues([row]);
    sheet
      .getRange(next, 4)
      .setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(STAGES_, true)
          .setAllowInvalid(false)
          .build(),
      );
    sheet
      .getRange(next, 9)
      .setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(STATUSES_, true)
          .setAllowInvalid(false)
          .build(),
      );
    return state_(ss);
  });
}

function score_(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function resultErrors_(row) {
  const errors = [];
  const scores = [row[6], row[7], row[12], row[13]];
  if (
    scores.some(function (value) {
      return value !== "" && !score_(value);
    })
  )
    errors.push("Scores and shootouts must be numeric non-negative integers or blank.");
  if (row[8] !== "Played") {
    if (
      scores.some(function (value) {
        return value !== "";
      })
    )
      errors.push("Only Played fixtures may have scores or shootouts.");
    return errors;
  }
  const scored = score_(row[6]) && score_(row[7]);
  if (!scored) errors.push("Played fixtures require both numeric scores.");
  const anyShootout = row[12] !== "" || row[13] !== "";
  const shootout = score_(row[12]) && score_(row[13]) && row[12] !== row[13];
  if (anyShootout && (!shootout || !scored || row[6] !== row[7]))
    errors.push("Shootout requires a drawn score and two different numeric shootout scores.");
  if (scored && row[6] === row[7] && row[3] !== "League" && !shootout)
    errors.push("Knockout draw requires two different shootout scores.");
  return errors;
}

function validateSeason_(ss, id) {
  let season;
  try {
    season = season_(ss, id);
  } catch (error) {
    return { valid: false, errors: [error.message], warnings: [], fixtureCount: 0 };
  }
  const sheet = ss.getSheetByName(season.sheetName);
  const errors = [],
    warnings = [];
  const ids = new Set(),
    fixtures = new Set();
  let fixtureCount = 0;
  if (!season.ligas.length) errors.push("Season needs at least one liga.");
  const data =
    sheet.getLastRow() < 2
      ? []
      : sheet.getRange(2, 1, sheet.getLastRow() - 1, FIXTURE_HEADERS_.length).getValues();
  const formulas = data.length
    ? sheet.getRange(2, 1, data.length, FIXTURE_HEADERS_.length).getFormulas()
    : [];
  data.forEach(function (row, index) {
    if (
      !row.some(function (value) {
        return value !== "" && value !== null;
      }) &&
      !formulas[index].some(Boolean)
    )
      return;
    fixtureCount++;
    const prefix = "Row " + (index + 2) + ": ";
    try {
      fixtureFields_(row, season);
    } catch (error) {
      errors.push(prefix + error.message);
    }
    try {
      const matchId = label_(row[11], "Match ID", 80);
      if (ids.has(key_(matchId))) errors.push(prefix + "Duplicate Match ID.");
      ids.add(key_(matchId));
    } catch (error) {
      errors.push(prefix + error.message);
    }
    if (["Scheduled", "Played"].includes(row[8])) {
      const fixtureKey = fixtureKey_(row);
      if (fixtures.has(fixtureKey)) errors.push(prefix + "Duplicate scheduled/played fixture.");
      fixtures.add(fixtureKey);
    }
    if (!STATUSES_.includes(row[8])) errors.push(prefix + "Invalid status.");
    resultErrors_(row).forEach(function (error) {
      errors.push(prefix + error);
    });
    if (["Cancelled", "Postponed"].includes(row[8]))
      warnings.push(prefix + row[8] + " fixture retained; not an active scheduled/played fixture.");
    if (formulas[index].some(Boolean))
      errors.push(prefix + "Formulas are forbidden; use literal values.");
  });
  if (!fixtureCount) errors.push("Season needs at least one fixture.");
  season.ligas.forEach(function (liga) {
    if (
      !data.some(function (row) {
        return row[2] === liga.name;
      })
    )
      errors.push("Liga " + liga.name + " needs at least one fixture.");
  });
  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    fixtureCount: fixtureCount,
  };
}

function validateSeason(seasonId) {
  return validateSeason_(sandbox_(), seasonId);
}

function activateSeason(seasonId) {
  return withLock_(function (ss) {
    const season = season_(ss, seasonId);
    const result = validateSeason_(ss, season.id);
    if (!result.valid) throw new Error(result.errors.join("\n"));
    const sheet = ss.getSheetByName("_TEST_Seasons");
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
    const statuses = rows.map(function (row) {
      return [row[0] === season.id ? "Current" : row[2] === "Current" ? "Archived" : row[2]];
    });
    // One write changes only local status cells; fixtures and ligas are retained.
    sheet.getRange(2, 3, statuses.length, 1).setValues(statuses);
    return state_(ss);
  });
}

function openSeasonSheet(seasonId) {
  return withLock_(function (ss) {
    const season = season_(ss, seasonId);
    ss.setActiveSheet(ss.getSheetByName(season.sheetName));
    return { ok: true };
  });
}

function onOpen() {
  sandbox_();
  SpreadsheetApp.getUi().createMenu("Liga helper").addItem("Open helper", "showHelper").addToUi();
}

function showHelper() {
  sandbox_();
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutputFromFile("Sidebar").setTitle("Liga helper · Sandbox").setWidth(300),
  );
}

function getHelperState() {
  return state_(sandbox_());
}
