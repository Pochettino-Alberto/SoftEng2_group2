import { teardownTestDb } from './testDb'

export default async function globalTeardown() {
    await teardownTestDb()
}