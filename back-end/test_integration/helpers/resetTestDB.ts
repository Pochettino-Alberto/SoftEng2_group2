import fs from "fs";
import path from "path";
import os from "os";

export async function resetTestDB(): Promise<void> {
  const projectRoot = path.resolve(__dirname, "..", "..", "..");
  const databaseDir = path.join(projectRoot, "database");

  const ddlPath = path.join(databaseDir, "tables_DDL.sql");
  const defaultPath = path.join(databaseDir, "tables_default_values.sql");

  const dbPath =
      process.env.TEST_DB_IN_MEMORY === "true"
          ? ":memory:"
          : path.join(os.tmpdir(), "e2e-test.db");

  if (dbPath !== ":memory:" && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const sqlite3 = require("sqlite3");
  const ddlSQL = fs.readFileSync(ddlPath, "utf8");
  const defaultSQL = fs.readFileSync(defaultPath, "utf8");

  await new Promise<void>((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err: Error | null) => {
      if (err) return reject(err);

      const cleanedDDL = ddlSQL.replace(
          /PRAGMA\s+foreign_keys\s*=\s*(ON|OFF);?/gi,
          ""
      );

      const fullDDL = `
        PRAGMA foreign_keys = OFF;
        ${cleanedDDL}
        PRAGMA foreign_keys = ON;
      `;

      db.exec(fullDDL, (err1: Error | null) => {
        if (err1) return db.close(() => reject(err1));

        db.exec(defaultSQL, (err2: Error | null) => {
          db.close(() => {
            if (err2) reject(err2);
            else resolve();
          });
        });
      });
    });
  });

  process.env.DB_PATH = dbPath;
}
