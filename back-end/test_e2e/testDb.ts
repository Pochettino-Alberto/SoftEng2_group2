import fs from 'fs'
import path from 'path'
import sqlite3 from 'sqlite3'

const isMemory = process.env.TEST_DB_IN_MEMORY === 'true'

const dbPath = isMemory
    ? ':memory:'
    : path.join(__dirname, 'test.db')

const schemaDir = path.join(__dirname, '..', 'database')

export async function resetTestDb() {
    const db = new sqlite3.Database(dbPath)

    const ddl = fs.readFileSync(
        path.join(schemaDir, 'tables_DDL.sql'),
        'utf8'
    )

    const defaults = fs.readFileSync(
        path.join(schemaDir, 'tables_default_values.sql'),
        'utf8'
    )

    await new Promise<void>((resolve, reject) => {
        db.exec(ddl, err => (err ? reject(err) : resolve()))
    })

    await new Promise<void>((resolve, reject) => {
        db.exec(defaults, err => (err ? reject(err) : resolve()))
    })

    db.close()
}

export async function teardownTestDb() {
    if (!isMemory && fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath)
    }
}