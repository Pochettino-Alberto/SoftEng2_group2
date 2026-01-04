const { closeDb } = require("../src/db")

module.exports = async () => {
    try {
        await closeDb()
    } catch {
        // ignore teardown errors
    }
}
