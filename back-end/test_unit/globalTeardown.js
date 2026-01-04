module.exports = async () => {
    try {
        const db = require("../src/db/db").default

        if (db && typeof db.close === "function") {
            await new Promise(resolve => {
                db.close(() => resolve())
            })
        }
    } catch (err) {
        // NEVER fail teardown
        console.error("globalTeardown cleanup error:", err)
    }
}
