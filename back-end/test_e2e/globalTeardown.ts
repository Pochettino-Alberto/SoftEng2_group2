import { teardownTestDb } from './testDb'

export default async function globalTeardown() {
    // This ensures the SQLite connection is closed and the temp file is unlinked
    await teardownTestDb();
}