import sqlite3 from "sqlite3"

let db: sqlite3.Database | null = null

export function getDb(): sqlite3.Database {
    if (db) return db

    const filename =
        process.env.TEST_DB_IN_MEMORY === "true" ? ":memory:" : "database.sqlite"

    db = new sqlite3.Database(filename)
    db.serialize()
    return db
}

export async function closeDb(): Promise<void> {
    if (!db) return

    await new Promise<void>((resolve, reject) => {
        db!.close(err => (err ? reject(err) : resolve()))
    })

    db = null
}