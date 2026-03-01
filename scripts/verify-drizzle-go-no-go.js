/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const initSqlJs = require("sql.js");

const DRIZZLE_TABLES = [
  "ArtKey",
  "Artist",
  "ArtistArtwork",
  "ArtworkProductLink",
  "CoCreator",
  "CoCreatorProduct",
  "Customer",
  "DesignDraft",
  "GuestbookEntry",
  "MediaItem",
  "Order",
  "OrderItem",
  "PortalPreviewNonce",
  "PrintAreaSpec",
  "ProductMockup",
  "ShopCategory",
  "ShopProduct",
  "SiteMedia",
  "SurfaceMap",
];

const SHARED_PARITY_TABLES = [
  "ArtKey",
  "Artist",
  "ArtistArtwork",
  "ArtworkProductLink",
  "CoCreator",
  "CoCreatorProduct",
  "Customer",
  "DesignDraft",
  "GuestbookEntry",
  "MediaItem",
  "Order",
  "OrderItem",
  "ShopCategory",
  "ShopProduct",
];

function isoStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function scalar(db, sql) {
  const result = db.exec(sql);
  if (!result[0] || !result[0].values[0]) return null;
  return result[0].values[0][0];
}

function tableExists(db, tableName) {
  const result = db.exec(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName.replace(/'/g, "''")}'`
  );
  return !!result[0] && result[0].values.length > 0;
}

function getColumns(db, tableName) {
  const result = db.exec(`PRAGMA table_info("${tableName}")`);
  if (!result[0]) return [];
  const nameIndex = result[0].columns.indexOf("name");
  return result[0].values.map((row) => row[nameIndex]);
}

function getRowsOrdered(db, tableName, columns) {
  let orderBy = "";
  if (columns.includes("id")) {
    orderBy = ' ORDER BY "id"';
  } else if (columns.length > 0) {
    orderBy = " ORDER BY " + columns.map((c) => `"${c}"`).join(", ");
  }
  const result = db.exec(`SELECT * FROM "${tableName}"${orderBy}`);
  return result[0] ? result[0].values : [];
}

function tableHash(db, tableName) {
  const columns = getColumns(db, tableName);
  const rows = getRowsOrdered(db, tableName, columns);
  const h = crypto.createHash("sha256");
  for (const row of rows) {
    const obj = {};
    for (let i = 0; i < columns.length; i += 1) {
      obj[columns[i]] = row[i];
    }
    h.update(JSON.stringify(obj));
    h.update("\n");
  }
  return h.digest("hex");
}

async function openDb(SQL, filePath) {
  const data = fs.readFileSync(filePath);
  return new SQL.Database(data);
}

async function main() {
  const strictMode = process.argv.includes("--strict");
  const root = process.cwd();
  const sourcePath = path.join(root, "prisma", "dev.db");
  const targetPath = path.join(root, "db", "drizzle-runtime.db");
  const reportDir = path.join(root, "tmp");
  fs.mkdirSync(reportDir, { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    strictMode,
    sourcePath,
    targetPath,
    checks: {
      filesExist: {},
      targetIntegrityCheck: null,
      requiredDrizzleTables: {},
      coreRowCounts: {},
      parityAgainstSource: {},
    },
    warnings: [],
    failures: [],
    result: "PASS",
  };

  report.checks.filesExist.source = fs.existsSync(sourcePath);
  report.checks.filesExist.target = fs.existsSync(targetPath);

  if (!report.checks.filesExist.target) {
    report.failures.push(`Missing target DB: ${targetPath}`);
    report.result = "FAIL";
  }

  if (!report.checks.filesExist.source && !strictMode) {
    report.warnings.push(`Source DB not found (parity skipped): ${sourcePath}`);
  }

  // Strict mode is intended for post-cutover cleanup verification.
  // In strict mode, keeping prisma/dev.db is treated as a failure.
  if (strictMode && report.checks.filesExist.source) {
    report.failures.push(
      `Strict mode requires Prisma DB to be retired, but file still exists: ${sourcePath}`
    );
    report.result = "FAIL";
  }

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(root, "node_modules", "sql.js", "dist", file),
  });

  let sourceDb = null;
  let targetDb = null;
  try {
    if (!report.checks.filesExist.target) {
      // Skip all database checks if target doesn't exist
    } else {
      targetDb = await openDb(SQL, targetPath);
      if (report.checks.filesExist.source) {
        sourceDb = await openDb(SQL, sourcePath);
      }

    // 1) Integrity check
    const integrity = scalar(targetDb, "PRAGMA integrity_check;");
    report.checks.targetIntegrityCheck = integrity;
    if (integrity !== "ok") {
      report.failures.push(`Target DB integrity_check failed: ${integrity}`);
      report.result = "FAIL";
    }

    // 2) Required Drizzle tables present
    for (const table of DRIZZLE_TABLES) {
      const exists = tableExists(targetDb, table);
      report.checks.requiredDrizzleTables[table] = exists;
      if (!exists) {
        report.failures.push(`Missing required Drizzle table in target: ${table}`);
        report.result = "FAIL";
      }
    }

    // 3) Core row counts
    const coreTables = ["ArtKey", "GuestbookEntry", "MediaItem", "ShopCategory", "ShopProduct"];
    for (const table of coreTables) {
      if (!tableExists(targetDb, table)) continue;
      const count = scalar(targetDb, `SELECT COUNT(*) FROM "${table}"`);
      report.checks.coreRowCounts[table] = Number(count || 0);
    }

    // 4) Parity checks for shared tables
    if (sourceDb) {
      for (const table of SHARED_PARITY_TABLES) {
        const inSource = tableExists(sourceDb, table);
        const inTarget = tableExists(targetDb, table);
        if (!inSource || !inTarget) {
          report.checks.parityAgainstSource[table] = {
            status: "skipped",
            reason: `table missing (source=${inSource}, target=${inTarget})`,
          };
          continue;
        }

        const sourceCount = Number(scalar(sourceDb, `SELECT COUNT(*) FROM "${table}"`) || 0);
        const targetCount = Number(scalar(targetDb, `SELECT COUNT(*) FROM "${table}"`) || 0);
        const sourceHash = tableHash(sourceDb, table);
        const targetHash = tableHash(targetDb, table);
        const match = sourceCount === targetCount && sourceHash === targetHash;

        report.checks.parityAgainstSource[table] = {
          status: match ? "match" : "mismatch",
          sourceCount,
          targetCount,
          sourceHash,
          targetHash,
        };

        if (!match) {
          report.failures.push(`Parity mismatch for table: ${table}`);
          report.result = "FAIL";
        }
      }
    }
    }
  } finally {
    if (sourceDb) sourceDb.close();
    if (targetDb) targetDb.close();
  }

  const outPath = path.join(reportDir, `drizzle_go_no_go_${isoStamp()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`REPORT_FILE=${outPath}`);
  console.log(`RESULT=${report.result}`);
  console.log(`FAILURE_COUNT=${report.failures.length}`);
  console.log(`WARNING_COUNT=${report.warnings.length}`);
  if (report.failures.length) {
    console.log("FAILURES=");
    for (const f of report.failures) console.log(`- ${f}`);
  }
  if (report.warnings.length) {
    console.log("WARNINGS=");
    for (const w of report.warnings) console.log(`- ${w}`);
  }

  if (report.result === "FAIL") {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Verification script crashed:", err);
  process.exit(1);
});
