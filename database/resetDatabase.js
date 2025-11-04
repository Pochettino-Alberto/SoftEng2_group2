// database/resetDatabase.js
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ---- Fixes ESM paths ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Resolve absolute paths ----
const backendPath = path.resolve(__dirname, "../back-end");

// ---- Add backend/node_modules to module search path ----
import { createRequire } from "module";
const require = createRequire(import.meta.url);
process.env.NODE_PATH = path.join(backendPath, "node_modules");
require("module").Module._initPaths();

// ---- Now we can require sqlite3 from back-end ----
const sqlite3 = require("sqlite3").verbose();

// ---- Database + SQL paths ----
const dbPath = path.resolve(__dirname, "database.db");
const ddlPath = path.resolve(__dirname, "tables_DDL.sql");
const defaultValuesPath = path.resolve(__dirname, "tables_default_values.sql");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to database:", dbPath);
  runSQLFiles();
});

function runSQLFiles() {
  try {
    const ddlSQL = fs.readFileSync(ddlPath, "utf8");
    const defaultSQL = fs.readFileSync(defaultValuesPath, "utf8");

    console.log("🚧 Running DDL script...");
    db.exec(ddlSQL, (err) => {
      if (err) {
        console.error("❌ Error executing DDL script:", err.message);
        process.exit(1);
      }
      console.log("✅ Tables created successfully.");

      console.log("🚧 Running default values script...");
      db.exec(defaultSQL, (err) => {
        if (err) {
          console.error("❌ Error executing default values script:", err.message);
          process.exit(1);
        }
        console.log("✅ Default values inserted successfully.");
        db.close();
      });
    });
  } catch (err) {
    console.error("❌ Failed to read SQL files:", err.message);
    process.exit(1);
  }
}
