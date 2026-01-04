const { closeDb } = require("../src/dao/db")

module.exports = async () => {
    try {
        await closeDb()
    } catch {
        // ignore teardown errors
    }
}
