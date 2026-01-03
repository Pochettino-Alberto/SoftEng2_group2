import fs from 'fs'
import path from 'path'
import sqlite3 from 'sqlite3'

const DB_PATH = path.join(__dirname, '../database/testdb.db')
const SCHEMA_PATH = path.join(__dirname, '../database/schema.sql')

export default async function globalSetup() {
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)

    const db = new sqlite3.Database(DB_PATH)

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8')

    await new Promise((resolve, reject) => {
        db.exec(schema, err => (err ? reject(err) : resolve(null)))
    })

    db.close()
}