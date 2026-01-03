import sqlite3 from 'sqlite3'
import fs from 'fs'
import path from 'path'

const DB_PATH = process.env.DB_PATH!

export async function resetTestDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) return reject(err)
    })

    const ddlPath = path.resolve(__dirname, '../../database/tables_DDL.sql')
    const defaultPath = path.resolve(
        __dirname,
        '../../database/tables_default_values.sql'
    )

    const ddlSQL = fs.readFileSync(ddlPath, 'utf8')
    const defaultSQL = fs.readFileSync(defaultPath, 'utf8')

    db.serialize(() => {
      // 1️⃣ Disable FK checks
      db.exec('PRAGMA foreign_keys = OFF;', (err) => {
        if (err) return reject(err)

        // 2️⃣ Drop all tables
        db.all(
            "SELECT name FROM sqlite_master WHERE type='table'",
            (err, rows: { name: string }[]) => {
              if (err) return reject(err)

              const dropSQL = rows
                  .filter(r => r.name !== 'sqlite_sequence')
                  .map(r => `DROP TABLE IF EXISTS ${r.name};`)
                  .join('\n')

              db.exec(dropSQL, (err) => {
                if (err) return reject(err)

                // 3️⃣ Recreate schema
                db.exec(ddlSQL, (err) => {
                  if (err) return reject(err)

                  // 4️⃣ Reinsert default data
                  db.exec(defaultSQL, (err) => {
                    if (err) return reject(err)

                    // 5️⃣ Re-enable FK checks
                    db.exec(
                        'PRAGMA foreign_keys = ON;',
                        (err) => {
                          if (err) return reject(err)

                          db.close(() => resolve())
                        }
                    )
                  })
                })
              })
            }
        )
      })
    })
  })
}
