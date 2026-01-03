export default async fuimport { teardownTestDb } from './testDb'

export default async function globalTeardown() {
    await teardownTestDb()
}nction globalTeardown() {}