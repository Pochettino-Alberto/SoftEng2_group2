import fs from 'fs'
import path from 'path'
import sqlite3 from 'sqlite3'
import { DB_PATH } from '../src/dao/db'

export async function resetTestDb() {
    const inMemory = process.env.TEST_DB_IN_MEMORY === 'true'

    if (!inMemory && fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH)
    }

    const db = new sqlite3.Database(inMemory ? ':memory:' : DB_PATH)

    const ddl = fs.readFileSync(
        path.join(__dirname, '../database/tables_DDL.sql'),
        'utf-8'
    )
    const defaults = fs.readFileSync(
        path.join(__dirname, '../database/defaults.sql'),
        'utf-8'
    )

    await new Promise<void>((resolve, reject) => {
        db.exec(ddl, err => (err ? reject(err) : resolve()))
    })

    await new Promise<void>((resolve, reject) => {
        db.exec(defaults, err => (err ? reject(err) : resolve()))
    })

    db.close()
}