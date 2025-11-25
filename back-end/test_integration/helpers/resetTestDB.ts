import fs from 'fs'
import path from 'path'
import os from 'os'

export function resetTestDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
  // __dirname = back-end/test_integration/helpers
  // repository root is three levels up from __dirname
  const projectRoot = path.resolve(__dirname, '..', '..', '..')
  const databaseDir = path.resolve(projectRoot, 'database')
      const ddlPath = path.resolve(databaseDir, 'tables_DDL.sql')
      const defaultPath = path.resolve(databaseDir, 'tables_default_values.sql')
      // Use the same per-worker temp DB path logic as db.ts uses for NODE_ENV=test
      const testDbPath = path.join(
        os.tmpdir(),
        `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`
      )

      // Instead of deleting the DB file (which can fail if another connection
      // has it open), open the file and execute the DDL which contains
      // DROP TABLE IF EXISTS statements to reset schema/state safely.
      const sqlite3 = require('sqlite3').verbose()
      const ddlSQL = fs.readFileSync(ddlPath, 'utf8')
      const defaultSQL = fs.readFileSync(defaultPath, 'utf8')

      const db = new sqlite3.Database(testDbPath, (err: Error | null) => {
        if (err) return reject(err)

        // Ensure foreign key checks are disabled while we DROP/CREATE tables
        // This prevents SQLITE_CONSTRAINT errors when dropping/creating
        // tables that reference each other in different orders.
        const ddlToRun = ddlSQL.replace(/PRAGMA\s+foreign_keys\s*=\s*ON;?/i, 'PRAGMA foreign_keys = OFF;')

        db.exec(ddlToRun, (err2: Error | null) => {
          if (err2) return reject(err2)
          db.exec(defaultSQL, (err3: Error | null) => {
            if (err3) return reject(err3)

            // Re-enable foreign key enforcement after seeding defaults
            db.exec('PRAGMA foreign_keys = ON;', (err4: Error | null) => {
              if (err4) return reject(err4)
              db.close()
              resolve()
            })
          })
        })
      })
    } catch (err) {
      reject(err)
    }
  })
}
