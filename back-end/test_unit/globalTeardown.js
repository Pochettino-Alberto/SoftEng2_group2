const db = require("../src/dao/db").default;

module.exports = async () => {
    if (db) {
        await new Promise((resolve) => {
            db.close(() => resolve());
        });
    }
};
