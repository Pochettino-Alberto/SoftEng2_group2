const path = require("path")
const os = require("os")
const fs = require("fs")

module.exports = async () => {
    try {
        // Force SQLite to release file locks
        const dbFile = path.join(
            os.tmpdir(),
            `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`
        )

        if (fs.existsSync(dbFile)) {
            fs.unlinkSync(dbFile)
        }
    } catch (err) {
        // Never fail teardown
        console.error("Global teardown error:", err)
    }
}
