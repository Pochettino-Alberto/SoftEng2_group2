const { closeDb } = require('../src/dao/db');

module.exports = async () => {
    try {
        if (typeof closeDb === 'function') {
            await closeDb();
        }
    } catch {
        // never fail teardown
    }
};
