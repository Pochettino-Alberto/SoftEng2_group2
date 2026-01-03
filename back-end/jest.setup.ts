afterAll(async () => {
    try {
        const db = require('./src/dao/db')
        if (db.closeDb) {
            await db.closeDb()
        }
    } catch {}
})