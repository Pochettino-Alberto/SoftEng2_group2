import fs from "fs"
import os from "os"
import path from "path"
import db from "../src/dao/db"

export default async () => {
    if (db) {
        await new Promise<void>((resolve) => {
            db.close(() => resolve())
        })
    }

    const dbPath = path.join(os.tmpdir(), "participium-e2e.db")
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath)
    }
}
