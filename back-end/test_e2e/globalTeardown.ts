import fs from "fs"
import os from "os"
import path from "path"

export default async () => {
    const dbPath = path.join(os.tmpdir(), "participium-e2e.db")
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath)
    }
}
