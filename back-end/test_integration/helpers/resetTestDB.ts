import fs from 'fs'
import path from 'path'
import os from 'os'

export function resetTestDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const projectRoot = path.resolve(__dirname, '..', '..', '..')
      const databaseDir = path.resolve(projectRoot, 'database')
      const ddlPath = path.resolve(databaseDir, 'tables_DDL.sql')
      const defaultPath = path.resolve(databaseDir, 'tables_default_values.sql')

      const useMemoryDb = process.env.TEST_DB_IN_MEMORY === 'true' || process.env.TEST_DB_IN_MEMORY === '1'
      const useRepoFileDb = process.env.CI_USE_FILE_DB === 'true' || process.env.CI_USE_FILE_DB === '1'

      const testDbPath = useMemoryDb
          ? ':memory:'
          : (useRepoFileDb
              ? path.resolve(databaseDir, 'testdb.db')
              : path.join(os.tmpdir(), `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`))

      const sqlite3 = require('sqlite3').verbose()
      const ddlSQL = fs.readFileSync(ddlPath, 'utf8')
      const defaultSQL = fs.readFileSync(defaultPath, 'utf8')

      const db = new sqlite3.Database(testDbPath, (err: Error | null) => {
        if (err) return reject(err)

        const ddlToRun = `PRAGMA foreign_keys = OFF;
${ddlSQL.replace(/PRAGMA\s+foreign_keys\s*=\s*ON;?/gi, '')}
PRAGMA foreign_keys = ON;`

        db.exec(ddlToRun, (err2: Error | null) => {
          if (err2) {
            return db.close(() => reject(err2))
          }

          db.exec("DELETE FROM sqlite_sequence;", () => {
            db.exec(defaultSQL, (err3: Error | null) => {
              db.close((errClose: Error | null) => {
                if (err3) return reject(err3)
                resolve()
              })
            })
          })
        })
      })
    } catch (err) {
      reject(err)
    }
  })
}
