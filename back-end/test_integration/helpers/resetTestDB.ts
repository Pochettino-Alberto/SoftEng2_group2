import fs from 'fs'
import path from 'path'
import db, { dbReady } from '../../src/dao/db'

export async function resetTestDB(): Promise<void> {
  try {
    const projectRoot = path.resolve(__dirname, '..', '..', '..')
    const databaseDir = path.resolve(projectRoot, 'database')
    const ddlPath = path.resolve(databaseDir, 'tables_DDL.sql')
    const defaultPath = path.resolve(databaseDir, 'tables_default_values.sql')

    const ddlSQL = fs.readFileSync(ddlPath, 'utf8')
    const defaultSQL = fs.readFileSync(defaultPath, 'utf8')

    const ddlToRun = `PRAGMA foreign_keys = OFF;
${ddlSQL.replace(/PRAGMA\s+foreign_keys\s*=\s*ON;?/gi, '')}
PRAGMA foreign_keys = ON;`

    await dbReady

    await new Promise<void>((resolve, reject) => {
      db.exec(ddlToRun, (err: Error | null) => {
        if (err) return reject(err)
        db.exec(defaultSQL, (err2: Error | null) => {
          if (err2) return reject(err2)
          resolve()
        })
      })
    })
  } catch (err) {
    throw err
  }
}
