import fs from 'fs'
import path from 'path'

export function resetTestDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
  // __dirname = back-end/test_integration/helpers
  // repository root is three levels up from __dirname
  const projectRoot = path.resolve(__dirname, '..', '..', '..')
  const databaseDir = path.resolve(projectRoot, 'database')
      const ddlPath = path.resolve(databaseDir, 'tables_DDL.sql')
      const defaultPath = path.resolve(databaseDir, 'tables_default_values.sql')
      const testDbPath = path.resolve(databaseDir, 'testdb.db')

      // remove existing testdb if present
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath)
      }

      const sqlite3 = require('sqlite3').verbose()
      const ddlSQL = fs.readFileSync(ddlPath, 'utf8')
      const defaultSQL = fs.readFileSync(defaultPath, 'utf8')

      const db = new sqlite3.Database(testDbPath, (err: Error | null) => {
        if (err) return reject(err)
        db.exec(ddlSQL, (err2: Error | null) => {
          if (err2) return reject(err2)
          db.exec(defaultSQL, (err3: Error | null) => {
            if (err3) return reject(err3)
            db.close()
            resolve()
          })
        })
      })
    } catch (err) {
      reject(err)
    }
  })
}
